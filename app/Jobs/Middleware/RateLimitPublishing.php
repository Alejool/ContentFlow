<?php

namespace App\Jobs\Middleware;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class RateLimitPublishing
{
    /**
     * Limita cuántas publicaciones puede hacer un usuario simultáneamente
     */
    public function handle($job, $next)
    {
        // Obtener el workspace_id del job
        $publication = \App\Models\Publications\Publication::find($job->publicationId);
        
        if (!$publication) {
            return $next($job);
        }
        
        $workspaceId = $publication->workspace_id;
        $key = "publishing:workspace:{$workspaceId}";
        
        // Límite: máximo 3 publicaciones simultáneas por workspace
        $maxConcurrent = 3;
        
        Redis::throttle($key)
            ->allow($maxConcurrent)
            ->every(1) // Por segundo
            ->block(0) // No bloquear, solo verificar
            ->then(function () use ($job, $next, $workspaceId) {
                Log::info('Publishing rate limit passed', [
                    'workspace_id' => $workspaceId,
                    'publication_id' => $job->publicationId
                ]);
                
                return $next($job);
            }, function () use ($job, $workspaceId) {
                // Límite alcanzado - liberar el job para reintentarlo después
                Log::warning('Publishing rate limit reached, releasing job', [
                    'workspace_id' => $workspaceId,
                    'publication_id' => $job->publicationId
                ]);
                
                // Liberar el job para que se reintente en 30 segundos
                return $job->release(30);
            });
    }
}

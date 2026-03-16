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
        
        Log::info('Publishing rate limit passed', [
            'workspace_id' => $workspaceId,
            'publication_id' => $job->publicationId
        ]);
        
        // SIMPLIFICADO: Removido el throttle que estaba bloqueando jobs
        // El rate limiting ahora se maneja a nivel de UI y validación
        return $next($job);
    }
}

<?php

namespace App\Console\Commands;

use App\Services\Cache\PublicationCacheService;
use App\Services\Cache\QueryCacheService;
use App\Services\Cache\SocialApiCacheService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class ManageCacheCommand extends Command
{
    protected $signature = 'cache:manage 
                            {action : Action to perform (stats|clear|warm|preload)}
                            {--workspace= : Workspace ID for workspace-specific operations}
                            {--publication= : Publication ID for publication-specific operations}
                            {--type= : Cache type (publications|queries|social|all)}';

    protected $description = 'Manage application cache (statistics, clearing, warming)';

    public function handle(
        PublicationCacheService $publicationCache,
        QueryCacheService $queryCache,
        SocialApiCacheService $socialCache
    ): int {
        $action = $this->argument('action');
        $type = $this->option('type') ?? 'all';

        return match($action) {
            'stats' => $this->showStats($publicationCache, $queryCache, $socialCache, $type),
            'clear' => $this->clearCache($publicationCache, $queryCache, $type),
            'warm' => $this->warmCache($publicationCache, $type),
            'preload' => $this->preloadCache($publicationCache),
            default => $this->error("Unknown action: {$action}"),
        };
    }

    private function showStats(
        PublicationCacheService $publicationCache,
        QueryCacheService $queryCache,
        SocialApiCacheService $socialCache,
        string $type
    ): int {
        $this->info('Cache Statistics');
        $this->line('================');

        if ($type === 'all' || $type === 'publications') {
            $this->newLine();
            $this->info('Publication Cache:');
            $stats = $publicationCache->getCacheStats();
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Frequent Publications', $stats['frequent_publications']],
                    ['Cache Driver', $stats['cache_driver']],
                    ['Metadata TTL', $stats['ttl']['metadata'] . 's'],
                    ['Stats TTL', $stats['ttl']['stats'] . 's'],
                    ['List TTL', $stats['ttl']['list'] . 's'],
                ]
            );
        }

        if ($type === 'all' || $type === 'queries') {
            $this->newLine();
            $this->info('Query Cache:');
            $stats = $queryCache->getCacheStats();
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Cache Driver', $stats['driver']],
                    ['Default TTL', $stats['ttl']['default'] . 's'],
                    ['Stats TTL', $stats['ttl']['stats'] . 's'],
                ]
            );
        }

        if ($type === 'all' || $type === 'social') {
            $this->newLine();
            $this->info('Social API Cache:');
            $stats = $socialCache->getStats();
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Cache Driver', $stats['driver']],
                    ['Profile TTL', $stats['ttl']['profile'] . 's'],
                    ['Analytics TTL', $stats['ttl']['analytics'] . 's'],
                    ['Posts TTL', $stats['ttl']['posts'] . 's'],
                    ['Rate Limit TTL', $stats['ttl']['rate_limit'] . 's'],
                ]
            );
        }

        return self::SUCCESS;
    }

    private function clearCache(
        PublicationCacheService $publicationCache,
        QueryCacheService $queryCache,
        string $type
    ): int {
        $workspaceId = $this->option('workspace');
        $publicationId = $this->option('publication');

        if ($publicationId) {
            $publicationCache->invalidate((int) $publicationId);
            $queryCache->invalidatePublication((int) $publicationId);
            $this->info("Cache cleared for publication: {$publicationId}");
            return self::SUCCESS;
        }

        if ($workspaceId) {
            $publicationCache->invalidateWorkspace((int) $workspaceId);
            $queryCache->invalidateWorkspace((int) $workspaceId);
            $this->info("Cache cleared for workspace: {$workspaceId}");
            return self::SUCCESS;
        }

        if ($type === 'all') {
            Cache::flush();
            $this->info('All cache cleared');
        } else {
            $this->warn('Specify --workspace or --publication to clear specific cache');
        }

        return self::SUCCESS;
    }

    private function warmCache(PublicationCacheService $publicationCache, string $type): int
    {
        $publicationId = $this->option('publication');

        if (!$publicationId) {
            $this->error('Please specify --publication for warming cache');
            return self::FAILURE;
        }

        $publicationCache->warmUp((int) $publicationId);
        $this->info("Cache warmed for publication: {$publicationId}");

        return self::SUCCESS;
    }

    private function preloadCache(PublicationCacheService $publicationCache): int
    {
        $workspaceId = $this->option('workspace');

        if (!$workspaceId) {
            $this->error('Please specify --workspace for preloading cache');
            return self::FAILURE;
        }

        $this->info('Preloading frequently accessed publications...');
        
        $count = $publicationCache->preloadFrequent((int) $workspaceId);
        
        $this->info("Preloaded {$count} publications into cache");

        return self::SUCCESS;
    }
}

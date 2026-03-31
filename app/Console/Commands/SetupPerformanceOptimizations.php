<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class SetupPerformanceOptimizations extends Command
{
    protected $signature = 'performance:setup
                            {--skip-migrations : Skip running migrations}
                            {--skip-optimization : Skip optimizing existing images}';

    protected $description = 'Setup all performance optimizations (cache, CDN, image optimization, queues)';

    public function handle(): int
    {
        $this->info('🚀 Setting up performance optimizations...');
        $this->newLine();

        // Step 1: Check environment configuration
        $this->info('📋 Step 1: Checking environment configuration...');
        $this->checkEnvironment();
        $this->newLine();

        // Step 2: Run migrations
        if (!$this->option('skip-migrations')) {
            $this->info('📊 Step 2: Running performance migrations...');
            Artisan::call('migrate', ['--force' => true]);
            $this->line(Artisan::output());
        } else {
            $this->warn('⏭️  Skipping migrations');
        }
        $this->newLine();

        // Step 3: Clear and warm up caches
        $this->info('🔥 Step 3: Setting up caches...');
        $this->setupCaches();
        $this->newLine();

        // Step 4: Verify CDN configuration
        $this->info('🌐 Step 4: Verifying CDN configuration...');
        $this->verifyCDN();
        $this->newLine();

        // Step 5: Setup queue priorities
        $this->info('⚙️  Step 5: Configuring queue priorities...');
        $this->setupQueues();
        $this->newLine();

        // Step 6: Optimize existing images (optional)
        if (!$this->option('skip-optimization')) {
            if ($this->confirm('Do you want to optimize existing images? (This may take a while)', false)) {
                $this->info('🖼️  Step 6: Optimizing existing images...');
                Artisan::call('media:optimize-images', ['--limit' => 50]);
                $this->line(Artisan::output());
            }
        }
        $this->newLine();

        // Step 7: Display summary
        $this->displaySummary();

        return self::SUCCESS;
    }

    private function checkEnvironment(): void
    {
        $checks = [
            'CACHE_STORE' => env('CACHE_STORE'),
            'QUEUE_CONNECTION' => env('QUEUE_CONNECTION'),
            'CDN_ENABLED' => env('CDN_ENABLED', 'false'),
            'CDN_PROVIDER' => env('CDN_PROVIDER', 'not set'),
        ];

        $this->table(
            ['Configuration', 'Value'],
            collect($checks)->map(fn($value, $key) => [$key, $value])->values()->toArray()
        );

        // Warnings
        if (env('CACHE_STORE') !== 'redis') {
            $this->warn('⚠️  CACHE_STORE is not set to "redis". Performance may be suboptimal.');
        }

        if (env('QUEUE_CONNECTION') !== 'redis') {
            $this->warn('⚠️  QUEUE_CONNECTION is not set to "redis". Queue priorities may not work correctly.');
        }

        if (!env('CDN_ENABLED')) {
            $this->warn('⚠️  CDN is not enabled. Set CDN_ENABLED=true in .env.docker');
        }
    }

    private function setupCaches(): void
    {
        // Clear all caches
        $this->line('Clearing existing caches...');
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        // Cache configurations
        $this->line('Caching configurations...');
        Artisan::call('config:cache');
        Artisan::call('route:cache');
        Artisan::call('view:cache');

        $this->info('✅ Caches configured successfully');
    }

    private function verifyCDN(): void
    {
        if (!env('CDN_ENABLED')) {
            $this->warn('CDN is disabled. Enable it by setting CDN_ENABLED=true');
            return;
        }

        $cdnDomain = env('CDN_DOMAIN');
        if (!$cdnDomain) {
            $this->error('❌ CDN_DOMAIN is not set');
            return;
        }

        $this->info("✅ CDN configured: {$cdnDomain}");

        // Test CDN connectivity (optional)
        if ($this->confirm('Test CDN connectivity?', false)) {
            $this->line('Testing CDN...');
            try {
                $response = \Http::timeout(5)->get($cdnDomain);
                if ($response->successful()) {
                    $this->info('✅ CDN is accessible');
                } else {
                    $this->warn("⚠️  CDN returned status: {$response->status()}");
                }
            } catch (\Exception $e) {
                $this->error("❌ CDN test failed: {$e->getMessage()}");
            }
        }
    }

    private function setupQueues(): void
    {
        $priorityService = app(\App\Services\Queue\QueuePriorityService::class);

        // Display queue configuration
        $queues = $priorityService->getOrderedQueues();
        $this->line('Queue priorities configured:');
        
        $tableData = [];
        foreach ($queues as $queue) {
            $priority = $priorityService->getPriority($queue);
            $tableData[] = [$queue, $priority];
        }

        $this->table(['Queue', 'Priority'], $tableData);

        // Display recommended worker distribution
        $distribution = $priorityService->getRecommendedWorkerDistribution(10);
        $this->newLine();
        $this->line('Recommended worker distribution (10 workers):');
        
        $workerData = [];
        foreach ($distribution as $queue => $workers) {
            $workerData[] = [$queue, $workers];
        }

        $this->table(['Queue', 'Workers'], $workerData);

        $this->info('✅ Queue priorities configured');
    }

    private function displaySummary(): void
    {
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('✅ Performance optimizations setup complete!');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->newLine();

        $this->line('📚 Next steps:');
        $this->line('');
        $this->line('1. Configure CDN (if not done):');
        $this->line('   - Set CDN_ENABLED=true in .env.docker');
        $this->line('   - Configure CDN_DOMAIN with your CloudFront/Cloudflare URL');
        $this->line('');
        $this->line('2. Restart services to apply changes:');
        $this->line('   docker-compose restart app queue');
        $this->line('');
        $this->line('3. Monitor performance:');
        $this->line('   - Horizon dashboard: /horizon');
        $this->line('   - Redis Commander: http://localhost:8082');
        $this->line('   - Logs: docker-compose logs -f app queue');
        $this->line('');
        $this->line('4. Read full documentation:');
        $this->line('   - PERFORMANCE_OPTIMIZATION.md');
        $this->line('');
        $this->info('═══════════════════════════════════════════════════════════');
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ClearSystemConfigCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'system:clear-config-cache';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear system configuration cache (plans, addons, features)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Clearing system configuration cache...');

        // Limpiar caché de SystemSetting
        Cache::forget('system_settings:all');
        
        // Limpiar caché por categoría
        $categories = ['plans', 'addons', 'features', 'integrations', 'payment_methods', 'general'];
        foreach ($categories as $category) {
            Cache::forget("system_settings:category:{$category}");
        }

        // Limpiar caché de SystemConfigService
        Cache::forget('system:available_plans');
        Cache::forget('system:available_addons');

        // Limpiar caché de settings individuales
        $keys = [
            'plan.free.enabled',
            'plan.starter.enabled',
            'plan.growth.enabled',
            'plan.professional.enabled',
            'plan.enterprise.enabled',
            'plan.demo.enabled',
            'feature.ai.enabled',
            'feature.analytics.enabled',
            'feature.reels.enabled',
            'feature.approval_workflows.enabled',
            'feature.calendar_sync.enabled',
            'feature.bulk_operations.enabled',
            'feature.white_label.enabled',
        ];

        foreach ($keys as $key) {
            Cache::forget("system_setting:{$key}");
        }

        $this->info('✓ System configuration cache cleared successfully!');
        $this->newLine();
        $this->info('The following caches were cleared:');
        $this->line('  - System settings cache');
        $this->line('  - Available plans cache');
        $this->line('  - Available addons cache');
        $this->line('  - Individual setting keys');

        return Command::SUCCESS;
    }
}

<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\AIService;

class AIServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton('ai-service', function ($app) {
            return new AIService();
        });

        $this->app->bind(AIService::class, function ($app) {
            return new AIService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
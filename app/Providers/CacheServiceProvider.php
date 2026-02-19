<?php

namespace App\Providers;

use App\Services\Cache\PublicationCacheService;
use App\Services\Cache\QueryCacheService;
use App\Services\Cache\SocialApiCacheService;
use App\Services\Video\StreamingVideoService;
use Illuminate\Support\ServiceProvider;

/**
 * Service provider for cache services
 * Registers cache services as singletons for better performance
 */
class CacheServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register cache services as singletons
        $this->app->singleton(PublicationCacheService::class, function ($app) {
            return new PublicationCacheService();
        });

        $this->app->singleton(SocialApiCacheService::class, function ($app) {
            return new SocialApiCacheService();
        });

        $this->app->singleton(QueryCacheService::class, function ($app) {
            return new QueryCacheService();
        });

        $this->app->singleton(StreamingVideoService::class, function ($app) {
            return new StreamingVideoService();
        });

        // Register aliases for easier access
        $this->app->alias(PublicationCacheService::class, 'cache.publication');
        $this->app->alias(SocialApiCacheService::class, 'cache.social_api');
        $this->app->alias(QueryCacheService::class, 'cache.query');
        $this->app->alias(StreamingVideoService::class, 'video.streaming');
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}

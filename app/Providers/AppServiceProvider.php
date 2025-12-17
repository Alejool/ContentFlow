<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Notifications\DatabaseNotification;

class AppServiceProvider extends ServiceProvider
{

  /**
   * Register any application services.
   */
  public function register(): void
  {
    //
  }

  /**
   * Bootstrap any application services.
   */
  public function boot(): void
  {
    Vite::prefetch(concurrency: 3);
    if ($this->app->environment('local') && request()->header('X-Forwarded-Proto') === 'https') {
      URL::forceScheme('https');
    }

    // Register Notification Observer
    DatabaseNotification::observe(\App\Observers\NotificationObserver::class);
  }
}

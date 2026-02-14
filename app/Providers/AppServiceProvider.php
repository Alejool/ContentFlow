<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Notifications\DatabaseNotification;
use App\Observers\NotificationObserver;
use App\Observers\UserObserver;
use App\Observers\PublicationObserver;

use App\Models\User;
use App\Models\Publications\Publication;

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
    if (config('app.url')) {
      URL::forceRootUrl(config('app.url'));
    }
    if (request()->header('X-Forwarded-Proto') === 'https') {
      URL::forceScheme('https');
    }

    DatabaseNotification::observe(NotificationObserver::class);
    User::observe(UserObserver::class);
    Publication::observe(PublicationObserver::class);
  }
}

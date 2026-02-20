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
    // Bind OnboardingService interface
    $this->app->bind(
      \App\Interfaces\OnboardingServiceInterface::class,
      \App\Services\OnboardingService::class
    );

    // Bind OnboardingStateRepository interface
    $this->app->bind(
      \App\Interfaces\OnboardingStateRepositoryInterface::class,
      \App\Repositories\OnboardingStateRepository::class
    );
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

    // Log broadcasting events
    \Illuminate\Support\Facades\Event::listen(
      \Illuminate\Broadcasting\BroadcastEvent::class,
      function ($event) {
        \Illuminate\Support\Facades\Log::info('Broadcasting event', [
          'event' => get_class($event->event),
          'channels' => $event->event->broadcastOn(),
        ]);
      }
    );

    DatabaseNotification::observe(NotificationObserver::class);
    User::observe(UserObserver::class);
    Publication::observe(PublicationObserver::class);

    // Register audit event listeners
    \Illuminate\Support\Facades\Event::listen(
      \App\Events\ConfigurationChanged::class,
      \App\Listeners\AuditLogger::class
    );
    \Illuminate\Support\Facades\Event::listen(
      \App\Events\RoleChanged::class,
      \App\Listeners\AuditLogger::class
    );
    \Illuminate\Support\Facades\Event::listen(
      \App\Events\SocialTokenAccessed::class,
      \App\Listeners\AuditLogger::class
    );
    \Illuminate\Support\Facades\Event::listen(
      \App\Events\AuthenticationFailed::class,
      \App\Listeners\AuditLogger::class
    );
    \Illuminate\Support\Facades\Event::listen(
      \App\Events\CriticalDataDeleted::class,
      \App\Listeners\AuditLogger::class
    );
  }
}

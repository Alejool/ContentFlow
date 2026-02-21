<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Log;
use App\Helpers\LogHelper;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\HandleWorkspaceContext;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use App\Http\Middleware\SecurityHeaders;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use App\Http\Middleware\IsSuperAdmin;
use App\Http\Middleware\ThrottleReelGeneration;
use App\Http\Middleware\CustomRateLimiter;
use App\Http\Middleware\Require2FA;
use Illuminate\Routing\Middleware\CacheResponse;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->trustProxies(at: '*');
        $middleware->validateCsrfTokens(except: [
            'check-user',
            'login',
            'logout',
            'api/*',
        ]);
        $middleware->web(append: [
            SecurityHeaders::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SetLocale::class,
            HandleWorkspaceContext::class,
        ]);
        $middleware->api(append: [
            SecurityHeaders::class,
        ]);
        $middleware->alias([
            'super-admin' => IsSuperAdmin::class,
            'throttle.reel' => ThrottleReelGeneration::class,
            'cache.response' => CacheResponse::class,
            'rate.limit' => CustomRateLimiter::class,
            'require.2fa' => Require2FA::class,
        ]);
    })
    ->withSchedule(function ($schedule) {
        $schedule->command('social:process-scheduled')
            ->everyMinute()
            ->withoutOverlapping();
        $schedule->command('analytics:sync --days=7')->hourly();
        $schedule->command('social:check-tokens')->daily();
        $schedule->command('youtube:process-playlist-queue')->everyFiveMinutes();
        $schedule->command('app:send-event-reminders')->everyMinute();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (MethodNotAllowedHttpException $e, $request) {
            LogHelper::error('405 Method Not Allowed', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'allowed_methods' => $e->getHeaders()['Allow'] ?? 'unknown',
                'ip' => $request->ip(),
                'headers' => $request->headers->all(),
            ]);
            return null;
        });
        $exceptions->render(function (NotFoundHttpException $e, $request) {
            Log::warning('404 Not Found', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
                'headers' => $request->headers->all(),
            ]);
            return null;
        });
    })->create();

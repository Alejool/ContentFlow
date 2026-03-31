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
use App\Http\Middleware\CheckSubscriptionLimits;
use App\Http\Middleware\CheckFeatureAccess;
use App\Http\Middleware\ThrottleByPlan;
use App\Http\Middleware\CheckGranularLimits;
use App\Http\Middleware\ApiRateLimiter;
use App\Http\Middleware\CheckWorkspaceLimit;
use App\Http\Middleware\CheckWorkspaceOwner;
use App\Http\Middleware\IdempotentPublish;
use App\Http\Middleware\CheckWorkspaceRole;
use Illuminate\Routing\Middleware\CacheResponse;
use App\Http\Middleware\CheckApiWorkspacePlan;
use App\Http\Middleware\CheckMaintenanceMode;
use App\Http\Middleware\CheckNewRegistrations;
use App\Http\Middleware\LogContextMiddleware;
use App\Http\Middleware\CheckPurchasesEnabled;

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
            LogContextMiddleware::class,
            SecurityHeaders::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SetLocale::class,
            HandleWorkspaceContext::class,
            CheckMaintenanceMode::class,
            CheckNewRegistrations::class,
        ]);
        $middleware->api(append: [
            LogContextMiddleware::class,
            SecurityHeaders::class,
            SetLocale::class,
        ]);
        $middleware->alias([
            'super-admin' => IsSuperAdmin::class,
            'throttle.reel' => ThrottleReelGeneration::class,
            'cache.response' => CacheResponse::class,
            'rate.limit' => CustomRateLimiter::class,
            'require.2fa' => Require2FA::class,
            'subscription.limits' => CheckSubscriptionLimits::class,
            'feature.access' => CheckFeatureAccess::class,
            'throttle.plan' => ThrottleByPlan::class,
            'granular.limit' => CheckGranularLimits::class,
            'api.rate.limit' => ApiRateLimiter::class,
            'workspace.limit' => CheckWorkspaceLimit::class,
            'workspace.owner' => CheckWorkspaceOwner::class,
            'idempotent.publish' => IdempotentPublish::class,
            'workspace.role' => CheckWorkspaceRole::class,
            'api.plan' => CheckApiWorkspacePlan::class,
            'purchases.enabled' => CheckPurchasesEnabled::class,
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
        // Verificar contenido publicado cada 6 horas (4 veces al día)
        $schedule->command('content:verify-status --days=7 --limit=200')
            ->everySixHours()
            ->withoutOverlapping();
        // Reset monthly usage metrics on the first day of each month
        $schedule->command('usage:reset-monthly')
            ->monthlyOn(1, '00:00')
            ->timezone('UTC');
        // Daily subscription status check: validate expired subscriptions, process grace periods, send warnings
        $schedule->command('subscription:check-status')->daily();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            $message = $e->getMessage();
            if (str_contains($message, 'relation "users" does not exist') || str_contains($message, 'Base table or view not found')) {
                try {
                    auth()->guard('web')->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                } catch (\Throwable $th) {
                    // Ignore errors during emergency logout
                }
                
                // Si la tabla que falta no es users, o estamos en la pagina principal y sigue fallando, 
                // para evitar un bucle devolvemos la vista o simplemente dejamos que siga si no podemos solucionarlo.
                if ($request->is('/')) {
                    // Si ya estamos en root y falla la DB (ej. system_settings no existe), dejamos que el error se muestre
                    // O podemos enviar un error limpio en vez de un loop.
                    if (!str_contains($message, 'users')) {
                         return response()->view('errors.500', ['exception' => $e], 500)->throwResponse();
                    }
                }
                
                return redirect('/');
            }
        });

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

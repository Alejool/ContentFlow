<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Jobs\CheckSocialTokensJob;

class Kernel extends ConsoleKernel
{
  protected function schedule(Schedule $schedule): void
  {
    // Procesar posts programados cada minuto
    $schedule->command('social:process-scheduled')
      ->everyMinute()
      ->withoutOverlapping();

    // Sincronizar analytics detallados diariamente a las 7 AM
    $schedule->command('analytics:sync --days=7')
      ->daily()
      ->at('07:00')
      ->withoutOverlapping();

    // Verificar tokens expirados diariamente
    $schedule->command('social:check-tokens')->daily();

    // Verificar y refrescar tokens cada 2 horas
    $schedule->job(new CheckSocialTokensJob)
      ->everyTwoHours()
      ->withoutOverlapping();

    // Procesar cola de playlists de YouTube cada 5 minutos
    $schedule->command('youtube:process-playlist-queue')->everyFiveMinutes();

    // Enviar recordatorios de calendario cada minuto
    $schedule->command('app:send-event-reminders')->everyMinute();

    // Sincronizar calendarios externos cada hora
    $schedule->command('calendar:sync-external')
      ->hourly()
      ->withoutOverlapping()
      ->runInBackground();

    // Limpiar eventos huérfanos de calendarios externos diariamente a las 4 AM
    $schedule->command('calendar:clean-orphaned')
      ->daily()
      ->at('04:00');

    // Limpiar caché antiguo diariamente a las 3 AM
    $schedule->command('cache:clear')
      ->daily()
      ->at('03:00');

    // Limpiar logs de auditoría antiguos (>90 días) diariamente a las 2 AM
    $schedule->command('audit:clean')
      ->daily()
      ->at('02:00');

    // Verificar suscripciones en trial diariamente
    $schedule->command('subscription:check-trials')
      ->daily()
      ->at('09:00');

    // Resetear métricas de uso mensualmente el primer día del mes
    $schedule->command('subscription:reset-monthly-usage')
      ->monthlyOn(1, '00:00')
      ->withoutOverlapping();

    // Resetear métricas de publicaciones IA y actualizar storage real (nuevo sistema)
    $schedule->command('usage:reset-monthly')
      ->monthlyOn(1, '00:05')
      ->withoutOverlapping();

    // Renovar límites mensuales (nuevo sistema) el primer día del mes
    $schedule->command('subscription:renew-monthly-limits')
      ->monthlyOn(1, '00:10')
      ->withoutOverlapping();

    // Verificar límites de uso y enviar notificaciones diariamente
    $schedule->command('subscription:check-limits --notify')
      ->daily()
      ->at('10:00');

    // ===== NUEVOS COMANDOS DE GESTIÓN DE SUSCRIPCIONES =====

    // Verificar y aplicar períodos de gracia expirados cada hora
    $schedule->command('subscriptions:check-grace-periods')
      ->hourly()
      ->withoutOverlapping();

    // Aplicar cambios de plan programados (downgrades) cada hora
    $schedule->command('subscriptions:apply-scheduled-changes')
      ->hourly()
      ->withoutOverlapping();

    // Expirar suscripciones canceladas que han llegado a su fecha de fin
    $schedule->command('subscriptions:expire')
      ->hourly()
      ->withoutOverlapping()
      ->runInBackground();

    // Sincronizar facturas de Stripe diariamente a las 5 AM
    $schedule->command('stripe:sync-invoices')
      ->daily()
      ->at('05:00')
      ->withoutOverlapping()
      ->runInBackground();

    // Sincronizar estado de suscripciones con Stripe diariamente a las 6 AM
    $schedule->command('stripe:sync-subscriptions')
      ->daily()
      ->at('06:00')
      ->withoutOverlapping()
      ->runInBackground();

    // Enviar reportes programados cada hora
    $schedule->command('reports:send')
      ->hourly()
      ->withoutOverlapping();
    
    // Limpiar logs huérfanos de publicaciones cada 5 minutos
    // Previene que el frontend muestre "publicando" indefinidamente cuando jobs fallan
    $schedule->command('publications:clean-orphaned-logs --minutes=10 --no-interaction')
      ->everyFiveMinutes()
      ->withoutOverlapping()
      ->runInBackground();

    // ===== OPTIMIZACIONES PARA DATABASE CACHE (DEMO) =====
    
    // Limpiar caché database expirado cada 15 minutos
    $schedule->command('cache:cleanup-database')
      ->everyFifteenMinutes()
      ->withoutOverlapping()
      ->when(fn() => config('cache.default') === 'database');
    
    // Limpiar jobs fallidos antiguos (>48h) diariamente
    $schedule->command('queue:prune-failed --hours=48')
      ->daily()
      ->at('01:00')
      ->when(fn() => config('queue.default') === 'database');

    // Agregar analytics antiguos en rollups semanales/mensuales y limpiar datos crudos
    // Corre los domingos a las 03:30 AM (después del audit:clean)
    $schedule->command('analytics:rollup')
      ->weekly()
      ->sundays()
      ->at('03:30')
      ->withoutOverlapping()
      ->runInBackground();
  }
}

<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
  protected function schedule(Schedule $schedule): void
  {
    // Procesar posts programados cada minuto
    $schedule->command('social:process-scheduled')
      ->everyMinute()
      ->withoutOverlapping();

    // Sincronizar analytics detallados cada 6 horas
    $schedule->command('analytics:sync --days=7')
      ->everySixHours()
      ->withoutOverlapping();

    // Verificar tokens expirados diariamente
    $schedule->command('social:check-tokens')->daily();

    // Procesar cola de playlists de YouTube cada 5 minutos
    $schedule->command('youtube:process-playlist-queue')->everyFiveMinutes();

    // Enviar recordatorios de calendario cada minuto
    $schedule->command('app:send-event-reminders')->everyMinute();
    
    // Limpiar caché antiguo diariamente a las 3 AM
    $schedule->command('cache:clear')
      ->daily()
      ->at('03:00');
  }
}

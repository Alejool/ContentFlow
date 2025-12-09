<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Http\Middleware\ForceAssetHttps;



class Kernel extends ConsoleKernel
{
  protected $middleware = [
    ForceAssetHttps::class,
  ];
  protected function schedule(Schedule $schedule)
  {
    // Procesar posts programados cada minuto
    $schedule->command('social:process-scheduled')->everyMinute();

    // Sincronizar estadísticas cada hora
    $schedule->command('social:sync-analytics')->hourly();

    // Limpiar tokens expirados diariamente
    $schedule->command('social:cleanup-tokens')->daily();

    // Procesar cola de playlists de YouTube cada 5 minutos
    $schedule->command('youtube:process-playlist-queue')->everyFiveMinutes();
  }
}

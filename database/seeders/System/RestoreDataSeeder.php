<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class RestoreDataSeeder extends Seeder
{
  public function run(): void
  {
    // Buscar el archivo de backup más reciente
    $backupPath = database_path('backups');
    $files = File::glob($backupPath . '/data_backup_*.json');

    if (empty($files)) {
      $this->command->error('No backup file found!');
      return;
    }

    // Obtener el archivo más reciente
    $latestBackup = end($files);
    $this->command->info("Restoring from: " . basename($latestBackup));

    $backup = json_decode(File::get($latestBackup), true);

    // Restaurar usuarios
    if (isset($backup['users']) && count($backup['users']) > 0) {
      foreach ($backup['users'] as $user) {
        DB::table('users')->insert((array)$user);
      }
      $this->command->info('Restored ' . count($backup['users']) . ' users');
    }

    // Restaurar otras tablas si existen
    $tables = ['social_accounts', 'publications', 'media_files', 'scheduled_posts', 'social_post_logs'];
    foreach ($tables as $table) {
      if (isset($backup[$table]) && count($backup[$table]) > 0 && DB::getSchemaBuilder()->hasTable($table)) {
        foreach ($backup[$table] as $record) {
          DB::table($table)->insert((array)$record);
        }
        $this->command->info("Restored {$table}: " . count($backup[$table]) . " records");
      }
    }

    $this->command->info('Data restoration completed!');
  }
}

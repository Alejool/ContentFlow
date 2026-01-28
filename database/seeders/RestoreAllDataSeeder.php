<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class RestoreAllDataSeeder extends Seeder
{
  public function run(): void
  {
    $backupFile = database_path('backups/data_backup_2025_12_09_005235.json');

    if (!File::exists($backupFile)) {
      $this->command->error('Backup file not found!');
      return;
    }

    $this->command->info("Restoring from backup...");
    $backup = json_decode(File::get($backupFile), true);

    // Restaurar usuarios
    if (isset($backup['users'])) {
      $this->command->info("Restoring users...");
      foreach ($backup['users'] as $user) {
        try {
          DB::table('users')->insertOrIgnore($user);
        } catch (\Exception $e) {
          $this->command->warn("Error with user {$user['email']}: " . $e->getMessage());
        }
      }
      $this->command->info("Users: " . count($backup['users']) . " processed");
    }

    // Restaurar social accounts
    if (isset($backup['social_accounts'])) {
      $this->command->info("Restoring social accounts...");
      foreach ($backup['social_accounts'] as $account) {
        try {
          DB::table('social_accounts')->insertOrIgnore($account);
        } catch (\Exception $e) {
          $this->command->warn("Error with social account: " . $e->getMessage());
        }
      }
      $this->command->info("Social accounts: " . count($backup['social_accounts']) . " processed");
    }

    // Restaurar media files
    if (isset($backup['media_files'])) {
      $this->command->info("Restoring media files...");
      foreach ($backup['media_files'] as $file) {
        try {
          DB::table('media_files')->insertOrIgnore($file);
        } catch (\Exception $e) {
          $this->command->warn("Error with media file {$file['id']}: " . $e->getMessage());
        }
      }
      $this->command->info("Media files: " . count($backup['media_files']) . " processed");
    }

    $this->command->info('✅ Data restoration completed!');
    $this->command->info('Users: ' . DB::table('users')->count());
    $this->command->info('Social accounts: ' . DB::table('social_accounts')->count());
    $this->command->info('Media files: ' . DB::table('media_files')->count());
  }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class DataBackupSeeder extends Seeder
{
    public function run(): void
    {
        // Exportar datos de todas las tablas relevantes
        $tables = [
            'users',
            'social_accounts',
            'campaigns', // o publications si ya fue renombrada
            'media_files',
            'scheduled_posts',
            'campaign_analytics',
            'social_post_logs',
        ];

        $backup = [];

        foreach ($tables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                $backup[$table] = DB::table($table)->get()->toArray();
                $this->command->info("Exported {$table}: " . count($backup[$table]) . " records");
            }
        }

        // Guardar en archivo JSON
        $backupPath = database_path('backups');
        if (!File::exists($backupPath)) {
            File::makeDirectory($backupPath, 0755, true);
        }

        File::put(
            $backupPath . '/data_backup_' . date('Y_m_d_His') . '.json',
            json_encode($backup, JSON_PRETTY_PRINT)
        );

        $this->command->info('Data backup completed!');
    }
}

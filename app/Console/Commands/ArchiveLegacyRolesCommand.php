<?php

namespace App\Console\Commands;

use App\Services\RoleMigrationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ArchiveLegacyRolesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'roles:archive-legacy 
                            {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive legacy role definitions to JSON for audit purposes';

    /**
     * Execute the console command.
     */
    public function handle(RoleMigrationService $migrationService): int
    {
        $this->info('Legacy Role Archival Process');
        $this->newLine();

        // Warning message
        $this->warn('This command will archive all legacy role definitions.');
        $this->warn('Legacy roles will be exported to JSON and marked as archived in the database.');
        $this->newLine();

        // Confirmation unless --force flag is used
        if (!$this->option('force')) {
            if (!$this->confirm('Do you want to proceed with archiving legacy roles?', false)) {
                $this->comment('Archival cancelled.');
                return Command::SUCCESS;
            }
        }

        try {
            $this->info('Archiving legacy roles...');
            $this->newLine();

            // Execute archival
            $migrationService->archiveLegacyRoles();

            $this->newLine();
            $this->info('✓ Legacy roles archived successfully!');
            $this->newLine();

            // Display information about where data is stored
            $this->comment('Legacy role definitions have been:');
            $this->line('  • Exported to JSON format');
            $this->line('  • Stored in the legacy_role_migrations table');
            $this->line('  • Marked as archived in the database');
            $this->newLine();

            $this->info('You can query the legacy_role_migrations table to view archived role data.');

            Log::info('Legacy roles archived successfully via Artisan command');

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Archival failed: ' . $e->getMessage());
            $this->newLine();
            
            Log::error('Legacy role archival failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Command::FAILURE;
        }
    }
}

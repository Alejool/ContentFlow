<?php

namespace App\Console\Commands;

use App\Services\RoleMigrationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MigrateRolesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'roles:migrate 
                            {--dry-run : Run migration without making changes}
                            {--workspace= : Migrate specific workspace ID only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate legacy custom roles to simplified role structure (Owner, Admin, Editor, Viewer)';

    /**
     * Execute the console command.
     */
    public function handle(RoleMigrationService $migrationService): int
    {
        $this->info('Starting role migration to simplified structure...');
        $this->newLine();

        $dryRun = $this->option('dry-run');
        $workspaceId = $this->option('workspace');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        try {
            // Execute migration
            if ($workspaceId) {
                $this->info("Migrating workspace ID: {$workspaceId}");
                $workspace = \App\Models\Workspace::findOrFail($workspaceId);
                
                if ($dryRun) {
                    $this->comment('Dry run mode - skipping actual migration');
                    return Command::SUCCESS;
                }
                
                $result = $migrationService->migrateWorkspace($workspace);
                $this->displayWorkspaceResult($result);
            } else {
                $this->info('Migrating all workspaces...');
                
                if ($dryRun) {
                    $this->comment('Dry run mode - skipping actual migration');
                    return Command::SUCCESS;
                }
                
                $report = $migrationService->migrateAllWorkspaces();
                $this->displayMigrationReport($report);
            }

            $this->newLine();
            $this->info('✓ Migration completed successfully!');
            
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Migration failed: ' . $e->getMessage());
            Log::error('Role migration failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }

    /**
     * Display migration report for all workspaces
     */
    private function displayMigrationReport($report): void
    {
        $this->newLine();
        $this->info('=== Migration Report ===');
        $this->newLine();

        // Summary statistics
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Workspaces', $report->totalWorkspaces],
                ['Total Users Affected', $report->totalUsersAffected],
                ['Completed At', $report->completedAt->format('Y-m-d H:i:s')],
            ]
        );

        // Role mapping statistics
        if (!empty($report->roleMapping)) {
            $this->newLine();
            $this->info('Role Mapping Statistics:');
            $mappingData = [];
            foreach ($report->roleMapping as $oldRole => $data) {
                $mappingData[] = [
                    $oldRole,
                    $data['new_role'],
                    $data['count']
                ];
            }
            $this->table(
                ['Legacy Role', 'New Role', 'Users Migrated'],
                $mappingData
            );
        }

        // Errors
        if (!empty($report->errors)) {
            $this->newLine();
            $this->error('Errors encountered:');
            foreach ($report->errors as $error) {
                $this->line("  • {$error}");
            }
        }

        // Log report to file
        $logPath = storage_path('logs/role-migration-' . now()->format('Y-m-d_H-i-s') . '.json');
        file_put_contents($logPath, json_encode($report->toArray(), JSON_PRETTY_PRINT));
        $this->newLine();
        $this->comment("Full report saved to: {$logPath}");
    }

    /**
     * Display result for single workspace migration
     */
    private function displayWorkspaceResult($result): void
    {
        $this->newLine();
        $this->info("=== Workspace Migration Result ===");
        $this->newLine();

        $this->table(
            ['Metric', 'Value'],
            [
                ['Workspace ID', $result->workspaceId],
                ['Users Migrated', $result->usersMigrated],
                ['Roles Mapped', count($result->roleMapping)],
            ]
        );

        if (!empty($result->roleMapping)) {
            $this->newLine();
            $this->info('Role Mappings:');
            $mappingData = [];
            foreach ($result->roleMapping as $oldRole => $newRole) {
                $mappingData[] = [$oldRole, $newRole];
            }
            $this->table(
                ['Legacy Role', 'New Role'],
                $mappingData
            );
        }
    }
}

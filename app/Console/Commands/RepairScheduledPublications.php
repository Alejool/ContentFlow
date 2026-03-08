<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Publications\Publication;
use App\Services\Scheduling\SchedulingService;
use Illuminate\Support\Facades\DB;

class RepairScheduledPublications extends Command
{
    protected $signature = 'repair:scheduled-publications {--dry-run : Show what would be repaired without making changes} {--publication= : Repair specific publication ID}';
    protected $description = 'Repair publications that have scheduled_at but no scheduled_posts';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $publicationId = $this->option('publication');
        
        $this->info('🔍 Searching for publications with scheduling issues...');
        
        $query = Publication::whereNotNull('scheduled_at')
            ->where('status', 'scheduled')
            ->whereDoesntHave('scheduled_posts', function ($q) {
                $q->where('status', 'pending');
            });
        
        if ($publicationId) {
            $query->where('id', $publicationId);
        }
        
        $publications = $query->get();
        
        if ($publications->isEmpty()) {
            $this->info('✅ No publications need repair!');
            return 0;
        }
        
        $this->warn("Found {$publications->count()} publication(s) with issues:");
        $this->table(
            ['ID', 'Title', 'Scheduled At', 'Is Recurring', 'Scheduled Posts'],
            $publications->map(function ($pub) {
                return [
                    $pub->id,
                    substr($pub->title, 0, 40),
                    $pub->scheduled_at->format('Y-m-d H:i:s'),
                    $pub->is_recurring ? 'Yes' : 'No',
                    $pub->scheduled_posts()->count(),
                ];
            })
        );
        
        if ($dryRun) {
            $this->info("\n🔍 DRY RUN - No changes will be made");
            $this->info("Run without --dry-run to apply repairs");
            return 0;
        }
        
        if (!$this->confirm('Do you want to repair these publications?')) {
            $this->info('Cancelled.');
            return 0;
        }
        
        $schedulingService = app(SchedulingService::class);
        $repaired = 0;
        $failed = 0;
        
        foreach ($publications as $pub) {
            $this->info("\n📝 Repairing Publication #{$pub->id}: {$pub->title}");
            
            try {
                // Try to find social accounts from workspace
                $workspace = $pub->workspace;
                if (!$workspace) {
                    $this->error("  ❌ No workspace found");
                    $failed++;
                    continue;
                }
                
                $socialAccounts = $workspace->socialAccounts()
                    ->whereNull('deleted_at')
                    ->pluck('id')
                    ->toArray();
                
                if (empty($socialAccounts)) {
                    $this->error("  ❌ No social accounts found in workspace");
                    $failed++;
                    continue;
                }
                
                $this->info("  Found " . count($socialAccounts) . " social account(s)");
                
                // Create scheduled posts
                DB::transaction(function () use ($pub, $socialAccounts, $schedulingService) {
                    $schedulingService->syncSchedules(
                        $pub,
                        $socialAccounts,
                        [], // No account-specific schedules
                        true // Force recalculate
                    );
                });
                
                $pub->refresh();
                $scheduledPostsCount = $pub->scheduled_posts()->where('status', 'pending')->count();
                
                if ($scheduledPostsCount > 0) {
                    $this->info("  ✅ Created {$scheduledPostsCount} scheduled post(s)");
                    $repaired++;
                } else {
                    $this->error("  ❌ Failed to create scheduled posts");
                    $failed++;
                }
                
            } catch (\Exception $e) {
                $this->error("  ❌ Error: " . $e->getMessage());
                $failed++;
            }
        }
        
        $this->info("\n" . str_repeat('=', 50));
        $this->info("✅ Repaired: {$repaired}");
        if ($failed > 0) {
            $this->error("❌ Failed: {$failed}");
        }
        $this->info(str_repeat('=', 50));
        
        return $failed > 0 ? 1 : 0;
    }
}

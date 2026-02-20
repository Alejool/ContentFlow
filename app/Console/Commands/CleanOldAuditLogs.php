<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AuditLog;
use Illuminate\Support\Carbon;

class CleanOldAuditLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audit:clean {--days=90 : Number of days to retain logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean audit logs older than specified days (default: 90 days)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoffDate = Carbon::now()->subDays($days);

        $this->info("Cleaning audit logs older than {$days} days (before {$cutoffDate->toDateString()})...");

        $deletedCount = AuditLog::where('created_at', '<', $cutoffDate)->delete();

        $this->info("Deleted {$deletedCount} old audit log(s).");

        return 0;
    }
}


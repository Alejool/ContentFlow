<?php

namespace App\Console\Commands;

use App\Helpers\LogHelper;
use Illuminate\Console\Command;

class LogSearchCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'log:search 
                            {--trace-id= : Search by trace ID}
                            {--user-id= : Search by user ID}
                            {--workspace-id= : Search by workspace ID}
                            {--action= : Search by action}
                            {--log=laravel : Log file to search (default: laravel)}
                            {--limit=50 : Maximum number of results}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Search logs by trace ID, user ID, workspace ID, or action';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $traceId = $this->option('trace-id');
        $userId = $this->option('user-id');
        $workspaceId = $this->option('workspace-id');
        $action = $this->option('action');
        $logFile = $this->option('log');
        $limit = (int) $this->option('limit');

        if (!$traceId && !$userId && !$workspaceId && !$action) {
            $this->error('Please provide at least one search parameter: --trace-id, --user-id, --workspace-id, or --action');
            return 1;
        }

        $this->info("Searching in {$logFile}.log...");
        $this->newLine();

        $results = [];

        if ($traceId) {
            $this->line("🔍 Searching by trace_id: {$traceId}");
            $results = LogHelper::searchByTraceId($traceId, $logFile);
        } elseif ($userId) {
            $this->line("🔍 Searching by user_id: {$userId}");
            $results = LogHelper::searchByUser((int) $userId, $logFile);
        } elseif ($workspaceId) {
            $this->line("🔍 Searching by workspace_id: {$workspaceId}");
            $results = LogHelper::searchByWorkspace((int) $workspaceId, $logFile);
        } elseif ($action) {
            $this->line("🔍 Searching by action: {$action}");
            $results = LogHelper::searchByAction($action, $logFile);
        }

        if (empty($results)) {
            $this->warn('No results found.');
            return 0;
        }

        $this->info("Found " . count($results) . " results (showing first {$limit}):");
        $this->newLine();

        $displayed = 0;
        foreach ($results as $result) {
            if ($displayed >= $limit) {
                break;
            }

            if (is_array($result)) {
                $this->displayLogEntry($result);
            } else {
                $this->line($result);
            }

            $displayed++;
        }

        if (count($results) > $limit) {
            $this->newLine();
            $this->comment("Showing {$limit} of " . count($results) . " results. Use --limit to see more.");
        }

        return 0;
    }

    private function displayLogEntry(array $entry): void
    {
        $timestamp = $entry['timestamp'] ?? $entry['datetime'] ?? 'N/A';
        $level = strtoupper($entry['level'] ?? 'INFO');
        $message = $entry['message'] ?? 'N/A';
        $module = $entry['module'] ?? 'N/A';
        $action = $entry['action'] ?? 'N/A';

        $levelColor = match($level) {
            'ERROR', 'CRITICAL' => 'red',
            'WARNING' => 'yellow',
            'INFO' => 'green',
            'DEBUG' => 'blue',
            default => 'white',
        };

        $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->line("🕐 <comment>{$timestamp}</comment>");
        $this->line("📊 Level: <fg={$levelColor}>{$level}</>");
        $this->line("📦 Module: <info>{$module}</info>");
        $this->line("⚡ Action: <info>{$action}</info>");
        $this->line("💬 Message: {$message}");

        if (isset($entry['trace_id'])) {
            $this->line("🔗 Trace ID: <fg=cyan>{$entry['trace_id']}</>");
        }

        if (isset($entry['user_id'])) {
            $this->line("👤 User ID: {$entry['user_id']}");
        }

        if (isset($entry['workspace_id'])) {
            $this->line("🏢 Workspace ID: {$entry['workspace_id']}");
        }

        if (isset($entry['error'])) {
            $this->line("❌ Error: <fg=red>{$entry['error']}</>");
        }

        $this->newLine();
    }
}

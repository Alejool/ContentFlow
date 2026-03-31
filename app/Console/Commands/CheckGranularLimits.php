<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace\Workspace;
use App\Services\Subscription\GranularLimitValidator;
use Illuminate\Support\Facades\Log;

class CheckGranularLimits extends Command
{
    protected $signature = 'subscription:check-granular-limits {--workspace=}';
    protected $description = 'Check granular limits (daily, simultaneous, etc.) for workspaces';

    public function __construct(
        private GranularLimitValidator $validator
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $workspaceId = $this->option('workspace');

        if ($workspaceId) {
            $workspaces = Workspace::where('id', $workspaceId)->get();
        } else {
            $workspaces = Workspace::whereHas('subscription', function ($query) {
                $query->where('stripe_status', 'active')
                      ->orWhereNotNull('trial_ends_at');
            })->get();
        }

        if ($workspaces->isEmpty()) {
            $this->error('No workspaces found.');
            return 1;
        }

        $this->info("Checking granular limits for {$workspaces->count()} workspace(s)...\n");

        foreach ($workspaces as $workspace) {
            $this->displayWorkspaceLimits($workspace);
        }

        return 0;
    }

    private function displayWorkspaceLimits(Workspace $workspace): void
    {
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("Workspace: {$workspace->name} (ID: {$workspace->id})");
        $this->info("Plan: " . ($workspace->subscription?->plan ?? 'demo'));
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        $limits = $this->validator->getGranularLimits($workspace);

        // Publications
        $this->line("📝 PUBLICATIONS:");
        $todayCount = $this->validator->getTodayPublicationsCount($workspace);
        $dailyLimit = $limits['publications_per_day'] ?? 0;
        $this->displayLimit('Daily', $todayCount, $dailyLimit);

        $publishingCount = $this->validator->getCurrentPublishingCount($workspace);
        $simultaneousLimit = $limits['publications_simultaneous'] ?? 1;
        $this->displayLimit('Simultaneous', $publishingCount, $simultaneousLimit);

        // Campaigns
        $this->line("\n📊 CAMPAIGNS:");
        $campaignsCount = $this->validator->getActiveCampaignsCount($workspace);
        $campaignsLimit = $limits['active_campaigns'] ?? 1;
        $this->displayLimit('Active', $campaignsCount, $campaignsLimit);

        // Workflows
        $this->line("\n✅ APPROVAL WORKFLOWS:");
        $workflowsCount = $this->validator->getApprovalWorkflowsCount($workspace);
        $workflowsLimit = $limits['approval_workflows'] ?? 0;
        $this->displayLimit('Total', $workflowsCount, $workflowsLimit);

        // Exports
        $this->line("\n📤 EXPORTS:");
        $exportsCount = $this->validator->getMonthlyExportsCount($workspace);
        $exportsLimit = $limits['exports_per_month'] ?? 5;
        $this->displayLimit('This Month', $exportsCount, $exportsLimit);
        $this->line("  Max Rows: " . ($limits['export_max_rows'] ?? 1000));

        // Integrations
        $this->line("\n🔗 EXTERNAL INTEGRATIONS:");
        $discordCount = $this->validator->getExternalIntegrationsCount($workspace, 'discord');
        $discordLimit = $limits['external_integrations']['discord_webhooks'] ?? 0;
        $this->displayLimit('Discord', $discordCount, $discordLimit);

        $slackCount = $this->validator->getExternalIntegrationsCount($workspace, 'slack');
        $slackLimit = $limits['external_integrations']['slack_webhooks'] ?? 0;
        $this->displayLimit('Slack', $slackCount, $slackLimit);

        $webhookCount = $this->validator->getExternalIntegrationsCount($workspace, 'webhook');
        $webhookLimit = $limits['external_integrations']['custom_webhooks'] ?? 0;
        $this->displayLimit('Webhooks', $webhookCount, $webhookLimit);

        // API Rate Limits
        $this->line("\n🌐 API RATE LIMITS:");
        $this->line("  Per Minute: " . ($limits['api_requests_per_minute'] ?? 10));
        $this->line("  Per Hour: " . ($limits['api_requests_per_hour'] ?? 100));

        // Media Limits
        $this->line("\n🎬 MEDIA LIMITS:");
        $this->line("  Max File Size: " . ($limits['max_file_size_mb'] ?? 50) . " MB");
        $this->line("  Max Video Duration: " . ($limits['max_video_duration_minutes'] ?? 5) . " minutes");

        $this->line("\n");
    }

    private function displayLimit(string $label, int $current, int $limit): void
    {
        if ($limit === -1) {
            $this->line("  {$label}: {$current} / ∞ (unlimited)");
            return;
        }

        $percentage = $limit > 0 ? ($current / $limit) * 100 : 0;
        $color = $percentage >= 100 ? 'error' : ($percentage >= 80 ? 'warn' : 'info');

        $status = match(true) {
            $percentage >= 100 => '🔴',
            $percentage >= 80 => '🟡',
            default => '🟢',
        };

        $this->{$color}("  {$status} {$label}: {$current} / {$limit} (" . round($percentage, 1) . "%)");
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Publications\Publication;
use Illuminate\Console\Command;

class DiagnoseRecurrenceAccounts extends Command
{
    protected $signature = 'publications:diagnose-recurrence-accounts {publicationId}';
    protected $description = 'Diagnose recurrence accounts configuration for a publication';

    public function handle()
    {
        $publicationId = $this->argument('publicationId');
        $publication = Publication::with(['recurrenceSettings', 'scheduled_posts.socialAccount'])->find($publicationId);

        if (!$publication) {
            $this->error("Publication {$publicationId} not found");
            return 1;
        }

        $this->info("=== Publication #{$publication->id} ===");
        $this->line("Title: {$publication->title}");
        $this->line("Scheduled At: {$publication->scheduled_at}");
        $this->line("Is Recurring: " . ($publication->is_recurring ? 'Yes' : 'No'));
        $this->newLine();

        if ($publication->recurrenceSettings) {
            $settings = $publication->recurrenceSettings;
            $this->info("=== Recurrence Settings (from publication_recurrence_settings table) ===");
            $this->line("Type: {$settings->recurrence_type}");
            $this->line("Interval: {$settings->recurrence_interval}");
            $this->line("Days: " . json_encode($settings->recurrence_days));
            $this->line("End Date: {$settings->recurrence_end_date}");
            $this->line("Accounts: " . json_encode($settings->recurrence_accounts));
            $this->newLine();
        } else {
            $this->warn("No recurrence settings found in publication_recurrence_settings table");
            $this->newLine();
        }

        $this->info("=== Scheduled Posts ===");
        foreach ($publication->scheduled_posts as $post) {
            $this->line("Account ID: {$post->social_account_id}");
            $this->line("  Platform: {$post->socialAccount->platform}");
            $this->line("  Account Name: {$post->socialAccount->account_name}");
            $this->line("  Scheduled At: {$post->scheduled_at}");
            $this->line("  Status: {$post->status}");
            $this->newLine();
        }

        // Check if recurrence_accounts matches scheduled posts
        if ($publication->recurrenceSettings && $publication->recurrenceSettings->recurrence_accounts) {
            $recurrenceAccounts = $publication->recurrenceSettings->recurrence_accounts;
            $scheduledAccounts = $publication->scheduled_posts->pluck('social_account_id')->unique()->toArray();
            
            $this->info("=== Analysis ===");
            $this->line("Recurrence Accounts: " . implode(', ', $recurrenceAccounts));
            $this->line("Scheduled Accounts: " . implode(', ', $scheduledAccounts));
            
            $missing = array_diff($recurrenceAccounts, $scheduledAccounts);
            $extra = array_diff($scheduledAccounts, $recurrenceAccounts);
            
            if (empty($missing) && empty($extra)) {
                $this->info("✓ All recurrence accounts have scheduled posts");
            } else {
                if (!empty($missing)) {
                    $this->warn("⚠ Recurrence accounts without scheduled posts: " . implode(', ', $missing));
                }
                if (!empty($extra)) {
                    $this->warn("⚠ Scheduled accounts not in recurrence list: " . implode(', ', $extra));
                }
            }
        }

        return 0;
    }
}

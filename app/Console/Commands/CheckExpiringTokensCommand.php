<?php

namespace App\Console\Commands;

use App\Jobs\RefreshSocialTokensJob;
use App\Models\Social\SocialAccount;
use Illuminate\Console\Command;

class CheckExpiringTokensCommand extends Command
{
  protected $signature = 'social:check-tokens';
  protected $description = 'Check for expiring social media tokens and refresh them';

  public function handle(): int
  {
    $this->info('Checking for expiring tokens...');

    // Find tokens expiring within 24 hours
    $expiringAccounts = SocialAccount::where('is_active', true)
      ->whereNotNull('token_expires_at')
      ->where('token_expires_at', '<=', now()->addHours(24))
      ->get();

    $this->info("Found {$expiringAccounts->count()} accounts with expiring tokens");

    foreach ($expiringAccounts as $account) {
      $this->line("Dispatching refresh job for account {$account->id} ({$account->platform})");
      RefreshSocialTokensJob::dispatch($account);
    }

    $this->info('Token refresh jobs dispatched successfully');

    return Command::SUCCESS;
  }
}

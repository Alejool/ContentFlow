<?php

namespace App\Console\Commands;

use App\Models\Social\SocialAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Contracts\Encryption\DecryptException;

class DiagnoseCorruptedTokens extends Command
{
    protected $signature = 'tokens:diagnose 
                            {--fix : Mark corrupted accounts as inactive}
                            {--account= : Check specific account ID}';

    protected $description = 'Diagnose and optionally fix corrupted social account tokens';

    public function handle()
    {
        $this->info('Checking for corrupted tokens...');

        $query = SocialAccount::query();
        
        if ($accountId = $this->option('account')) {
            $query->where('id', $accountId);
        }

        $accounts = $query->get();
        $corrupted = [];
        $valid = 0;

        foreach ($accounts as $account) {
            $status = $this->checkAccount($account);
            
            if ($status['corrupted']) {
                $corrupted[] = $status;
                $this->error("✗ Account #{$account->id} ({$account->platform}): {$status['issue']}");
            } else {
                $valid++;
            }
        }

        $this->newLine();
        $this->info("Summary:");
        $this->info("  Valid accounts: {$valid}");
        $this->error("  Corrupted accounts: " . count($corrupted));

        if (!empty($corrupted) && $this->option('fix')) {
            $this->newLine();
            if ($this->confirm('Mark corrupted accounts as inactive?')) {
                foreach ($corrupted as $item) {
                    $account = SocialAccount::find($item['id']);
                    $account->update([
                        'is_active' => false,
                        'last_failed_at' => now(),
                        'failure_count' => $account->failure_count + 1,
                        'account_metadata' => array_merge($account->account_metadata ?? [], [
                            'reconnection_reason' => 'corrupted_token',
                            'corruption_details' => $item['issue'],
                            'diagnosed_at' => now()->toIso8601String()
                        ])
                    ]);
                    $this->info("  Marked account #{$account->id} as inactive");
                }
                $this->info('Done!');
            }
        }

        return 0;
    }

    private function checkAccount(SocialAccount $account): array
    {
        $result = [
            'id' => $account->id,
            'platform' => $account->platform,
            'corrupted' => false,
            'issue' => null
        ];

        // Check access_token
        if ($account->getRawOriginal('access_token')) {
            try {
                Crypt::decryptString($account->getRawOriginal('access_token'));
            } catch (DecryptException $e) {
                $result['corrupted'] = true;
                $result['issue'] = 'access_token decryption failed: ' . $e->getMessage();
                return $result;
            }
        }

        // Check refresh_token
        if ($account->getRawOriginal('refresh_token')) {
            try {
                Crypt::decryptString($account->getRawOriginal('refresh_token'));
            } catch (DecryptException $e) {
                $result['corrupted'] = true;
                $result['issue'] = 'refresh_token decryption failed: ' . $e->getMessage();
                return $result;
            }
        }

        return $result;
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription\Subscription;
use App\Notifications\TrialEndingNotification;
use App\Notifications\TrialEndedNotification;

class CheckTrialSubscriptions extends Command
{
    protected $signature = 'subscription:check-trials';
    protected $description = 'Check trial subscriptions and send notifications';

    public function handle(): int
    {
        $this->info('Checking trial subscriptions...');

        // Notificar trials que terminan en 3 días
        $endingSoon = Subscription::where('status', 'trialing')
            ->whereBetween('trial_ends_at', [now(), now()->addDays(3)])
            ->with('workspace.users')
            ->get();

        foreach ($endingSoon as $subscription) {
            $owner = $subscription->workspace->users()
                ->wherePivot('role_id', function($query) {
                    $query->select('id')
                        ->from('roles')
                        ->where('slug', 'owner')
                        ->limit(1);
                })
                ->first();

            if ($owner) {
                $owner->notify(new TrialEndingNotification($subscription));
            }
        }

        $this->info("Sent {$endingSoon->count()} trial ending notifications");

        // Convertir trials expirados a plan free
        $expired = Subscription::where('status', 'trialing')
            ->where('trial_ends_at', '<', now())
            ->whereNull('stripe_subscription_id')
            ->get();

        foreach ($expired as $subscription) {
            $subscription->update([
                'plan' => 'free',
                'status' => 'active',
            ]);

            $owner = $subscription->workspace->users()
                ->wherePivot('role_id', function($query) {
                    $query->select('id')
                        ->from('roles')
                        ->where('slug', 'owner')
                        ->limit(1);
                })
                ->first();

            if ($owner) {
                $owner->notify(new TrialEndedNotification($subscription));
            }
        }

        $this->info("Converted {$expired->count()} expired trials to free plan");

        // Verificar planes demo expirados
        $expiredDemos = Subscription::where('plan', 'demo')
            ->where('trial_ends_at', '<', now())
            ->get();

        foreach ($expiredDemos as $subscription) {
            $subscription->update([
                'plan' => 'free',
                'status' => 'active',
                'trial_ends_at' => null,
            ]);

            $owner = $subscription->workspace->users()
                ->wherePivot('role_id', function($query) {
                    $query->select('id')
                        ->from('roles')
                        ->where('slug', 'owner')
                        ->limit(1);
                })
                ->first();

            if ($owner) {
                $owner->notify(new TrialEndedNotification($subscription));
            }
        }

        $this->info("Converted {$expiredDemos->count()} expired demo plans to free plan");

        return Command::SUCCESS;
    }
}

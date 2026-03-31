<?php

namespace App\Services\Subscription;

use App\Jobs\Subscription\ProcessRenewalRetryJob;
use App\Models\Subscription\Subscription;
use App\Models\SystemSetting;
use App\Models\Workspace\Workspace;
use App\Notifications\Subscription\RenewalFailedNotification;
use App\Services\Payment\PaymentGatewayFactory;
use App\Services\Subscription\DTOs\RenewalResult;
use Illuminate\Support\Facades\Log;

class RenewalService
{
    public function __construct(
        private readonly GracePeriodManager $gracePeriodManager,
    ) {}

    /**
     * Process all subscriptions due for renewal (ends_at <= now() and status = active).
     */
    public function processRenewals(): void
    {
        $subscriptions = Subscription::query()
            ->where('ends_at', '<=', now())
            ->where('status', 'active')
            ->with('workspace')
            ->get();

        foreach ($subscriptions as $subscription) {
            $workspace = $subscription->workspace;

            if (! $workspace) {
                Log::warning('RenewalService: subscription has no workspace', [
                    'subscription_id' => $subscription->id,
                ]);
                continue;
            }

            Log::info('RenewalService: attempting renewal', [
                'workspace_id' => $workspace->id,
                'subscription_id' => $subscription->id,
                'ends_at' => $subscription->ends_at?->toIso8601String(),
            ]);

            $result = $this->attemptRenewal($workspace);

            if (! $result->success) {
                $retryCount = $subscription->renewal_retry_count ?? 0;
                $this->handleFailedRenewal($workspace, $retryCount);
            }
        }
    }

    /**
     * Attempt to renew a workspace subscription via its configured payment gateway.
     */
    public function attemptRenewal(Workspace $workspace): RenewalResult
    {
        $subscription = $workspace->subscription;

        if (! $subscription) {
            return new RenewalResult(
                success: false,
                gateway: null,
                errorMessage: 'No subscription found for workspace',
            );
        }

        $gatewayName = $subscription->payment_gateway ?? 'stripe';

        try {
            $gateway = PaymentGatewayFactory::make($gatewayName);

            if (! $gateway->isAvailable()) {
                return new RenewalResult(
                    success: false,
                    gateway: $gatewayName,
                    errorMessage: "Gateway {$gatewayName} is not available",
                );
            }

            // Attempt renewal via the gateway's subscription retrieval to verify it's still active
            // For gateways that manage recurring billing automatically (Stripe), the renewal
            // is handled by the gateway itself. We verify the subscription status here.
            $gatewaySubscriptionId = $subscription->stripe_id ?? $subscription->payment_id;

            if (empty($gatewaySubscriptionId)) {
                return new RenewalResult(
                    success: false,
                    gateway: $gatewayName,
                    errorMessage: 'No gateway subscription ID found',
                );
            }

            $gatewaySubscription = $gateway->getSubscription($gatewaySubscriptionId);

            if (! $gatewaySubscription) {
                return new RenewalResult(
                    success: false,
                    gateway: $gatewayName,
                    errorMessage: 'Could not retrieve subscription from gateway',
                );
            }

            $gatewayStatus = $gatewaySubscription['status'] ?? null;

            // If the gateway reports the subscription as active, update ends_at
            if (in_array($gatewayStatus, ['active', 'trialing'])) {
                $newEndsAt = isset($gatewaySubscription['current_period_end'])
                    ? \Carbon\Carbon::createFromTimestamp($gatewaySubscription['current_period_end'])
                    : now()->addMonth();

                $subscription->update([
                    'ends_at' => $newEndsAt,
                    'renewal_retry_count' => 0,
                    'last_renewal_attempt_at' => now(),
                ]);

                Log::info('RenewalService: renewal successful', [
                    'workspace_id' => $workspace->id,
                    'gateway' => $gatewayName,
                    'new_ends_at' => $newEndsAt->toIso8601String(),
                ]);

                return new RenewalResult(
                    success: true,
                    gateway: $gatewayName,
                    errorMessage: null,
                );
            }

            // Gateway reports subscription as not active (past_due, canceled, etc.)
            $subscription->update(['last_renewal_attempt_at' => now()]);

            return new RenewalResult(
                success: false,
                gateway: $gatewayName,
                errorMessage: "Gateway subscription status: {$gatewayStatus}",
            );

        } catch (\Exception $e) {
            Log::error('RenewalService: attemptRenewal failed', [
                'workspace_id' => $workspace->id,
                'gateway' => $gatewayName,
                'error' => $e->getMessage(),
            ]);

            $subscription->update(['last_renewal_attempt_at' => now()]);

            return new RenewalResult(
                success: false,
                gateway: $gatewayName,
                errorMessage: $e->getMessage(),
            );
        }
    }

    /**
     * Handle a failed renewal attempt.
     *
     * - If retryCount < max_retry_attempts: increment retry count, queue retry job,
     *   and notify the owner only on the first failure (retryCount === 0).
     * - If retryCount >= max_retry_attempts: delegate to GracePeriodManager.
     */
    public function handleFailedRenewal(Workspace $workspace, int $retryCount): void
    {
        $maxRetryAttempts = (int) SystemSetting::get('subscription.max_retry_attempts', 3);
        $retryIntervalHours = (int) SystemSetting::get('subscription.retry_interval_hours', 24);

        if ($retryCount < $maxRetryAttempts) {
            $newRetryCount = $retryCount + 1;

            $workspace->subscription()->update([
                'renewal_retry_count' => $newRetryCount,
            ]);

            ProcessRenewalRetryJob::dispatch($workspace, $newRetryCount)
                ->delay(now()->addHours($retryIntervalHours))
                ->onQueue('publishing');

            // Notify owner only on the first failure
            if ($retryCount === 0) {
                $owner = $workspace->owner();

                if ($owner) {
                    $subscription = $workspace->subscription;
                    $errorMessage = 'Renewal failed';

                    $owner->notify(new RenewalFailedNotification(
                        $workspace,
                        $retryCount,
                        $errorMessage,
                    ));
                } else {
                    Log::warning('RenewalService: workspace owner not found for notification', [
                        'workspace_id' => $workspace->id,
                    ]);
                }
            }

            Log::info('RenewalService: renewal failed, retry queued', [
                'workspace_id' => $workspace->id,
                'retry_count' => $newRetryCount,
                'retry_in_hours' => $retryIntervalHours,
            ]);
        } else {
            Log::info('RenewalService: max retry attempts reached, initiating grace period', [
                'workspace_id' => $workspace->id,
                'retry_count' => $retryCount,
                'max_retry_attempts' => $maxRetryAttempts,
            ]);

            $this->gracePeriodManager->initGracePeriod($workspace);
        }
    }
}

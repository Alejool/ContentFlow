<?php

namespace App\Listeners\Subscription;

use App\Events\Subscription\LimitReached;
use App\Events\Subscription\LimitWarning;
use App\Services\Subscription\UsageLimitsNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyUsageLimitsChanged implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private UsageLimitsNotificationService $notificationService
    ) {}

    /**
     * Handle limit reached events.
     */
    public function handleLimitReached(LimitReached $event): void
    {
        $this->notificationService->notifyLimitsUpdated(
            $event->workspace,
            "limit_reached_{$event->limitType}"
        );
    }

    /**
     * Handle limit warning events.
     */
    public function handleLimitWarning(LimitWarning $event): void
    {
        $this->notificationService->notifyLimitsUpdated(
            $event->workspace,
            "limit_warning_{$event->limitType}"
        );
    }
}
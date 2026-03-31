<?php

namespace App\Listeners\Subscription;

use App\Events\Subscription\LimitReached;
use App\Services\Subscription\LimitNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

class NotifyLimitReached implements ShouldQueue
{
    public function __construct(
        private LimitNotificationService $notificationService
    ) {}

    public function handle(LimitReached $event): void
    {
        $this->notificationService->checkAndNotify(
            $event->workspace,
            $event->limitType
        );
    }
}

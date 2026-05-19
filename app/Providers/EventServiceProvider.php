<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use App\Events\Subscription\LimitReached;
use App\Events\Subscription\LimitWarning;
use App\Events\Subscription\SubscriptionDowngraded;
use App\Events\Subscription\RenewalFailed;
use App\Events\Subscription\GracePeriodStarted;
use App\Listeners\Subscription\NotifyUsageLimitsChanged;

// Approval workflow events
use App\Events\Approval\ApprovalLevelAdvanced;
use App\Events\Approval\ApprovalTaskReassigned;
use App\Events\Approval\ContentApproved;
use App\Events\Approval\ContentRejected;
use App\Events\Approval\ContentSubmittedForApproval;
use App\Events\System\RoleChanged;
use App\Events\Approval\ApprovalRequestSubmitted;
use App\Events\Approval\ApprovalStepCompleted;

// Approval workflow listeners
use App\Listeners\Auth\InvalidatePermissionCache;
use App\Listeners\Approval\NotifyContentCreator;
use App\Listeners\Approval\NotifyNextLevelApprovers;
use App\Listeners\Approval\NotifyApproversOnSubmission;
use App\Listeners\Approval\NotifyUserOfReassignment;
use App\Listeners\Approval\NotifyFirstStepApprovers;
use App\Listeners\Approval\NotifyNextStepApprovers;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        LimitReached::class => [
            [NotifyUsageLimitsChanged::class, 'handleLimitReached'],
        ],
        LimitWarning::class => [
            [NotifyUsageLimitsChanged::class, 'handleLimitWarning'],
        ],

        // Subscription control events (listeners added in tasks 8 & 9)
        SubscriptionDowngraded::class => [],
        RenewalFailed::class => [],
        GracePeriodStarted::class => [],
        
        // Approval workflow events
        ContentSubmittedForApproval::class => [
            NotifyApproversOnSubmission::class,
        ],
        ApprovalLevelAdvanced::class => [
            NotifyNextLevelApprovers::class,
        ],
        ContentApproved::class => [
            [NotifyContentCreator::class, 'handleApproved'],
        ],
        ContentRejected::class => [
            [NotifyContentCreator::class, 'handleRejected'],
        ],
        ApprovalTaskReassigned::class => [
            NotifyUserOfReassignment::class,
        ],
        RoleChanged::class => [
            InvalidatePermissionCache::class,
        ],
        
        // New approval workflow events
        ApprovalRequestSubmitted::class => [
            NotifyFirstStepApprovers::class,
        ],
        ApprovalStepCompleted::class => [
            NotifyNextStepApprovers::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
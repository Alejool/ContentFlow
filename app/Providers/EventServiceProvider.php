<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use App\Events\Subscription\LimitReached;
use App\Events\Subscription\LimitWarning;
use App\Listeners\Subscription\NotifyUsageLimitsChanged;

// Approval workflow events
use App\Events\ApprovalLevelAdvanced;
use App\Events\ApprovalTaskReassigned;
use App\Events\ContentApproved;
use App\Events\ContentRejected;
use App\Events\ContentSubmittedForApproval;
use App\Events\RoleChanged;
use App\Events\Approval\ApprovalRequestSubmitted;
use App\Events\Approval\ApprovalStepCompleted;

// Approval workflow listeners
use App\Listeners\InvalidatePermissionCache;
use App\Listeners\NotifyContentCreator;
use App\Listeners\NotifyNextLevelApprovers;
use App\Listeners\NotifyApproversOnSubmission;
use App\Listeners\NotifyUserOfReassignment;
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
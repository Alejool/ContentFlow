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
use App\Events\RoleChanged;

// Approval workflow listeners
use App\Listeners\InvalidatePermissionCache;
use App\Listeners\NotifyContentCreator;
use App\Listeners\NotifyNextLevelApprovers;
use App\Listeners\NotifyUserOfReassignment;

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
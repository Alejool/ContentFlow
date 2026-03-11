<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Publications\HashtagLibrary;
use App\Models\Reports\ScheduledReport;
use App\Models\Publications\Publication;
use App\Models\Role\Role;
use App\Models\ApprovalWorkflow;
use App\Policies\HashtagLibraryPolicy;
use App\Policies\ScheduledReportPolicy;
use App\Policies\PublicationPolicy;
use App\Policies\RolePolicy;
use App\Policies\ApprovalWorkflowPolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        HashtagLibrary::class => HashtagLibraryPolicy::class,
        ScheduledReport::class => ScheduledReportPolicy::class,
        Publication::class => PublicationPolicy::class,
        Role::class => RolePolicy::class,
        ApprovalWorkflow::class => ApprovalWorkflowPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}

<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Publications\HashtagLibrary;
use App\Models\Reports\ScheduledReport;
use App\Models\Publications\Publication;
use App\Models\Auth\Role;
use App\Models\Approval\ApprovalWorkflow;
use App\Policies\Publication\HashtagLibraryPolicy;
use App\Policies\System\ScheduledReportPolicy;
use App\Policies\Publication\PublicationPolicy;
use App\Policies\Auth\RolePolicy;
use App\Policies\Approval\ApprovalWorkflowPolicy;

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

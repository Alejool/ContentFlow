<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Publications\HashtagLibrary;
use App\Models\Reports\ScheduledReport;
use App\Policies\HashtagLibraryPolicy;
use App\Policies\ScheduledReportPolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        HashtagLibrary::class => HashtagLibraryPolicy::class,
        ScheduledReport::class => ScheduledReportPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}

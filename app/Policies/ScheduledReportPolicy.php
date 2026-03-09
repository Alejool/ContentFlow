<?php

namespace App\Policies;

use App\Models\Reports\ScheduledReport;
use App\Models\User;

class ScheduledReportPolicy
{
    public function view(User $user, ScheduledReport $report): bool
    {
        return $user->current_workspace_id === $report->workspace_id;
    }

    public function update(User $user, ScheduledReport $report): bool
    {
        return $user->current_workspace_id === $report->workspace_id;
    }

    public function delete(User $user, ScheduledReport $report): bool
    {
        return $user->current_workspace_id === $report->workspace_id;
    }
}

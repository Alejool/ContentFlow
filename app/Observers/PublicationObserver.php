<?php

namespace App\Observers;

use App\Models\Publications\Publication;
use App\Services\Usage\UsageTrackingService;
use App\Notifications\UsageLimitWarningNotification;

class PublicationObserver
{
    public function __construct(
        private UsageTrackingService $usageTracking
    ) {}

    public function created(Publication $publication): void
    {
        $workspace = $publication->workspace;
        
        if (!$workspace) {
            return;
        }

        // Incrementar contador de publicaciones
        $this->usageTracking->incrementUsage($workspace, 'publications', 1);

        // Verificar si está cerca del límite
        $usage = $this->usageTracking->getUsageMetric($workspace, 'publications');
        
        if ($usage && $usage->isNearLimit(80)) {
            $owner = $workspace->users()
                ->wherePivot('role_id', function($query) {
                    $query->select('id')
                        ->from('roles')
                        ->where('slug', 'owner')
                        ->limit(1);
                })
                ->first();

            if ($owner) {
                $owner->notify(
                    new UsageLimitWarningNotification($workspace, 'publications', $usage)
                );
            }
        }
    }

    public function deleted(Publication $publication): void
    {
        $workspace = $publication->workspace;
        
        if (!$workspace) {
            return;
        }

        // Decrementar contador de publicaciones
        $this->usageTracking->decrementUsage($workspace, 'publications', 1);
    }
}

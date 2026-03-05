<?php

namespace App\Services\Subscription;

use App\Models\Workspace\Workspace;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class LimitNotificationService
{
    public function __construct(
        private PlanLimitValidator $validator
    ) {}

    /**
     * Check and send notifications for usage limits.
     */
    public function checkAndNotify(Workspace $workspace, string $limitType): void
    {
        $percentage = $this->validator->getUsagePercentage($workspace, $limitType);

        // Notify at 80% usage
        if ($percentage >= 80 && $percentage < 100) {
            $this->sendWarningNotification($workspace, $limitType, $percentage);
        }

        // Notify at 100% usage
        if ($percentage >= 100) {
            $this->sendLimitReachedNotification($workspace, $limitType);
        }
    }

    /**
     * Send warning notification (80% usage).
     */
    private function sendWarningNotification(Workspace $workspace, string $limitType, float $percentage): void
    {
        $owner = $workspace->owner();
        
        if (!$owner) {
            return;
        }

        $remaining = $this->validator->getRemainingUsage($workspace, $limitType);
        
        $messages = [
            'publications' => "Te quedan solo {$remaining} publicaciones este mes.",
            'social_accounts' => "Puedes conectar solo {$remaining} cuentas más.",
            'storage' => "Te quedan {$remaining}GB de almacenamiento.",
            'ai_requests' => "Te quedan {$remaining} solicitudes de IA este mes.",
            'team_members' => "Puedes agregar {$remaining} miembros más al equipo.",
        ];

        $message = $messages[$limitType] ?? "Estás cerca del límite de {$limitType}.";

        Log::info("Limit warning for workspace {$workspace->id}", [
            'workspace_id' => $workspace->id,
            'limit_type' => $limitType,
            'percentage' => $percentage,
            'remaining' => $remaining,
        ]);

        // TODO: Implement actual notification sending
        // Notification::send($owner, new LimitWarningNotification($workspace, $limitType, $message));
    }

    /**
     * Send limit reached notification (100% usage).
     */
    private function sendLimitReachedNotification(Workspace $workspace, string $limitType): void
    {
        $owner = $workspace->owner();
        
        if (!$owner) {
            return;
        }

        $upgradeMessage = $this->validator->getUpgradeMessage($workspace, $limitType);

        Log::warning("Limit reached for workspace {$workspace->id}", [
            'workspace_id' => $workspace->id,
            'limit_type' => $limitType,
            'upgrade_message' => $upgradeMessage,
        ]);

        // TODO: Implement actual notification sending
        // Notification::send($owner, new LimitReachedNotification($workspace, $limitType, $upgradeMessage));
    }

    /**
     * Send notification when plan changes.
     */
    public function notifyPlanChange(Workspace $workspace, string $oldPlan, string $newPlan, string $changeType): void
    {
        $owner = $workspace->owner();
        
        if (!$owner) {
            return;
        }

        Log::info("Plan changed for workspace {$workspace->id}", [
            'workspace_id' => $workspace->id,
            'old_plan' => $oldPlan,
            'new_plan' => $newPlan,
            'change_type' => $changeType,
        ]);

        // TODO: Implement actual notification sending
        // Notification::send($owner, new PlanChangedNotification($workspace, $oldPlan, $newPlan, $changeType));
    }
}

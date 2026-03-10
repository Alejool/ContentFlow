<?php

namespace App\Services\Subscription;

use App\Models\Workspace\Workspace;
use Illuminate\Support\Facades\Cache;

class PlanLimitValidator
{
  /**
   * Get plan limits for a workspace — works without Stripe subscription.
   */
  public function getPlanLimits(Workspace $workspace): array
  {
    $plan = $workspace->subscription?->plan ?? 'demo';
    return config("plans.{$plan}.limits", config('plans.demo.limits', []));
  }

  /**
   * Check if workspace can perform a specific action.
   */
  public function canPerformAction(Workspace $workspace, string $limitType): bool
  {
    $limits = $this->getPlanLimits($workspace);
    $totalAvailable = $this->getTotalAvailableWithAddons($workspace, $limitType, $limits);

    // -1 means unlimited
    if ($totalAvailable === -1) {
      return true;
    }

    $currentUsage = $this->getCurrentUsage($workspace, $limitType);

    return $currentUsage < $totalAvailable;
  }

  /**
   * Check if workspace can upload a file of a specific size (in bytes).
   * Returns true if current_storage + additional_bytes <= limit.
   * Includes storage addons in the calculation.
   * 
   * @param Workspace $workspace
   * @param int $additionalBytes Size of the file to upload
   * @param int $pendingBytes Optional: Size of files already being uploaded/pending
   * @return bool
   */
  public function canUploadSize(Workspace $workspace, int $additionalBytes, int $pendingBytes = 0): bool
  {
    $limits     = $this->getPlanLimits($workspace);
    $limitBytes = ($limits['storage_gb'] ?? 0) === -1
      ? -1
      : (($limits['storage_gb'] ?? 0) * 1024 * 1024 * 1024);

    if ($limitBytes === -1) {
      return true;
    }

    // Get storage addons balance
    $addonService = app(\App\Services\WorkspaceAddonService::class);
    $storageAddons = $addonService->getAddonBalance($workspace, 'storage');
    $addonStorageBytes = $storageAddons['remaining'] * 1024 * 1024 * 1024; // Convert GB to bytes

    // Total available storage = plan limit + addons
    $totalLimitBytes = $limitBytes + $addonStorageBytes;

    $currentBytes = $workspace->mediaFiles()->sum('size');

    // Consider current storage + pending uploads + this file
    return ($currentBytes + $pendingBytes + $additionalBytes) <= $totalLimitBytes;
  }
  
  /**
   * Get remaining storage space in bytes.
   * Includes storage addons in the calculation.
   * 
   * @param Workspace $workspace
   * @param int $pendingBytes Optional: Size of files already being uploaded/pending
   * @return int Remaining bytes available (-1 for unlimited)
   */
  public function getRemainingStorageBytes(Workspace $workspace, int $pendingBytes = 0): int
  {
    $limits     = $this->getPlanLimits($workspace);
    $limitBytes = ($limits['storage_gb'] ?? 0) === -1
      ? -1
      : (($limits['storage_gb'] ?? 0) * 1024 * 1024 * 1024);

    if ($limitBytes === -1) {
      return -1;
    }

    // Get storage addons balance
    $addonService = app(\App\Services\WorkspaceAddonService::class);
    $storageAddons = $addonService->getAddonBalance($workspace, 'storage');
    $addonStorageBytes = $storageAddons['remaining'] * 1024 * 1024 * 1024; // Convert GB to bytes

    // Total available storage = plan limit + addons
    $totalLimitBytes = $limitBytes + $addonStorageBytes;

    $currentBytes = $workspace->mediaFiles()->sum('size');
    $remaining = $totalLimitBytes - $currentBytes - $pendingBytes;

    return max(0, $remaining);
  }

  /**
   * Check if workspace has access to a specific feature.
   */
  public function hasFeatureAccess(Workspace $workspace, string $feature): bool
  {
    $plan     = $workspace->subscription?->plan ?? 'demo';
    $features = config("plans.{$plan}.features", []);

    if (isset($features[$feature])) {
      return (bool) $features[$feature];
    }

    return in_array($feature, $features);
  }

  /**
   * Get current usage for a specific limit type.
   */
  public function getCurrentUsage(Workspace $workspace, string $limitType): int
  {
    return match ($limitType) {
      'publications'  => $this->getPublicationsUsageForCurrentPlan($workspace),
      'social_accounts' => $this->getSocialAccountsUsage($workspace),
      'storage'       => $this->getStorageUsageBytesForCurrentPlan($workspace),
      'ai_requests'   => $this->getAiRequestsUsageForCurrentPlan($workspace),
      'team_members'  => $this->getTeamMembersUsage($workspace),
      'workspaces'    => $this->getWorkspacesUsage($workspace),
      default         => 0,
    };
  }

  /**
   * Get limit value for a specific type.
   */
  public function getLimit(array $limits, string $limitType): int
  {
    $baseLimit = match ($limitType) {
      'publications'  => $limits['publications_per_month'] ?? 0,
      'social_accounts' => $limits['social_accounts'] ?? 0,
      'storage'       => ($limits['storage_gb'] ?? 0) === -1
        ? -1
        : (($limits['storage_gb'] ?? 0) * 1024 * 1024 * 1024),
      'ai_requests'   => $limits['ai_requests_per_month'] ?? 0,
      'team_members'  => $limits['team_members'] ?? 0,
      'workspaces'    => $limits['workspaces'] ?? 0,
      // discord_channels replaces external_integrations
      'discord_channels', 'external_integrations' => $limits['discord_channels'] ?? $limits['external_integrations'] ?? 0,
      default         => 0,
    };

    return $baseLimit;
  }

  /**
   * Get usage percentage for a specific limit type.
   */
  public function getUsagePercentage(Workspace $workspace, string $limitType): float
  {
    $limits = $this->getPlanLimits($workspace);
    $totalAvailable = $this->getTotalAvailableWithAddons($workspace, $limitType, $limits);

    if ($totalAvailable === -1) {
      return 0;
    }

    if ($totalAvailable === 0) {
      return 100;
    }

    $currentUsage = $this->getCurrentUsage($workspace, $limitType);

    return min(100, ($currentUsage / $totalAvailable) * 100);
  }

  /**
   * Get remaining usage for a specific limit type.
   */
  /**
   * Get total available limit including addons
   */
  public function getTotalAvailableWithAddons(Workspace $workspace, string $limitType, array $limits): int
  {
    $baseLimit = $this->getLimit($limits, $limitType);
    
    if ($baseLimit === -1) {
      return -1; // Unlimited
    }

    // Map limit types to addon types
    $addonTypeMap = [
      'ai_requests' => 'ai_credits',
      'storage' => 'storage',
      'publications' => 'publications',
      'team_members' => 'team_members',
    ];

    $addonType = $addonTypeMap[$limitType] ?? null;
    
    if (!$addonType) {
      return $baseLimit;
    }

    // Get addon balance using WorkspaceAddonService
    $addonService = app(\App\Services\WorkspaceAddonService::class);
    $addonBalance = $addonService->getAddonBalance($workspace, $addonType);
    
    // For storage, convert GB to bytes if needed
    $addonAmount = $addonBalance['remaining'];
    if ($limitType === 'storage' && $addonAmount > 0) {
      $addonAmount = $addonAmount * 1024 * 1024 * 1024; // Convert GB to bytes
    }

    return $baseLimit + $addonAmount;
  }

  public function getRemainingUsage(Workspace $workspace, string $limitType): int
  {
    $limits = $this->getPlanLimits($workspace);
    $totalAvailable = $this->getTotalAvailableWithAddons($workspace, $limitType, $limits);

    if ($totalAvailable === -1) {
      return -1;
    }

    $currentUsage = $this->getCurrentUsage($workspace, $limitType);

    return max(0, $totalAvailable - $currentUsage);
  }

  /**
   * Check if usage is near limit (default 80%).
   */
  public function isNearLimit(Workspace $workspace, string $limitType, int $threshold = 80): bool
  {
    return $this->getUsagePercentage($workspace, $limitType) >= $threshold;
  }

  /**
   * Get upgrade message for a specific limit type.
   */
  public function getUpgradeMessage(Workspace $workspace, string $limitType): array
  {
    $plan = $workspace->subscription?->plan ?? 'demo';

    $messages = [
      'publications' => [
        'title'   => 'Límite de publicaciones alcanzado',
        'message' => 'Has alcanzado el límite de publicaciones activas/programadas de tu plan.',
        'action'  => 'Actualiza tu plan para publicar más contenido.',
      ],
      'social_accounts' => [
        'title'   => 'Límite de cuentas sociales alcanzado',
        'message' => 'Has conectado el máximo de cuentas sociales permitidas.',
        'action'  => 'Actualiza tu plan para conectar más cuentas.',
      ],
      'storage' => [
        'title'   => 'Límite de almacenamiento alcanzado',
        'message' => 'Has alcanzado el límite de almacenamiento de tu plan.',
        'action'  => 'Actualiza tu plan para obtener más espacio.',
      ],
      'ai_requests' => [
        'title'   => 'Límite de solicitudes IA alcanzado',
        'message' => 'Has usado todas tus solicitudes de IA este mes.',
        'action'  => 'Actualiza tu plan para obtener más solicitudes.',
      ],
      'team_members' => [
        'title'   => 'Límite de miembros del equipo alcanzado',
        'message' => 'Has alcanzado el máximo de miembros permitidos.',
        'action'  => 'Actualiza tu plan para agregar más miembros.',
      ],
    ];

    $message = $messages[$limitType] ?? [
      'title'   => 'Límite alcanzado',
      'message' => 'Has alcanzado un límite de tu plan actual.',
      'action'  => 'Actualiza tu plan para continuar.',
    ];

    $message['current_plan']   = $plan;
    $message['suggested_plan'] = $this->getSuggestedPlan($plan);

    return $message;
  }

  /**
   * Get suggested plan for upgrade.
   */
  private function getSuggestedPlan(string $currentPlan): string
  {
    return match ($currentPlan) {
      'free'         => 'starter',
      'demo'         => 'starter',
      'starter'      => 'professional',
      'professional' => 'enterprise',
      default        => 'professional',
    };
  }

  /**
   * Count of published + scheduled publications in workspace this month.
   * This is the real-time, source-of-truth count.
   */
  private function getPublicationsUsage(Workspace $workspace): int
  {
    return Cache::remember(
      "workspace.{$workspace->id}.posts.monthly_count",
      now()->addMinutes(2),
      fn() => $workspace->getMonthlyPostCount()
    );
  }

  /**
   * Get social accounts count.
   */
  private function getSocialAccountsUsage(Workspace $workspace): int
  {
    return Cache::remember(
      "workspace.{$workspace->id}.social_accounts.count",
      now()->addMinutes(5),
      fn() => $workspace->socialAccounts()->count()
    );
  }

  /**
   * Get storage usage in bytes (direct sum from DB).
   */
  private function getStorageUsageBytes(Workspace $workspace): int
  {
    return (int) $workspace->mediaFiles()->sum('size');
  }

  /**
   * Get AI requests usage from usage metrics (monthly counter).
   */
  private function getAiRequestsUsage(Workspace $workspace): int
  {
    $metric = $workspace->getUsageMetric('ai_requests');
    return $metric?->current_usage ?? 0;
  }

  /**
   * Get team members count.
   */
  private function getTeamMembersUsage(Workspace $workspace): int
  {
    return Cache::remember(
      "workspace.{$workspace->id}.team_members.count",
      now()->addMinutes(5),
      fn() => $workspace->users()->count()
    );
  }

  /**
   * Get workspaces count for owner.
   */
  private function getWorkspacesUsage(Workspace $workspace): int
  {
    $owner = $workspace->owner();

    if (!$owner) {
      return 0;
    }

    return Cache::remember(
      "user.{$owner->id}.workspaces.count",
      now()->addMinutes(5),
      fn() => $owner->workspaces()->count()
    );
  }

  /**
   * Clear cached usage counts for a workspace.
   */
  public function clearCache(Workspace $workspace, string $limitType): void
  {
    $keys = [
      'publications'   => "workspace.{$workspace->id}.publications.active_count",
      'social_accounts' => "workspace.{$workspace->id}.social_accounts.count",
      'team_members'   => "workspace.{$workspace->id}.team_members.count",
    ];

    if (isset($keys[$limitType])) {
      Cache::forget($keys[$limitType]);
    }
  }

  /**
   * Get storage usage in bytes since the current plan started
   */
  private function getStorageUsageBytesForCurrentPlan(Workspace $workspace): int
  {
    $planStartDate = $this->getCurrentPlanStartDate($workspace);
    
    if (!$planStartDate) {
      // Fallback to total usage if no plan start date
      return $this->getStorageUsageBytes($workspace);
    }
    
    return Cache::remember(
      "workspace.{$workspace->id}.storage.current_plan_usage",
      now()->addMinutes(5),
      fn() => (int) $workspace->mediaFiles()
        ->where('created_at', '>=', $planStartDate)
        ->sum('size')
    );
  }

  /**
   * Get publications usage since the current plan started
   */
  private function getPublicationsUsageForCurrentPlan(Workspace $workspace): int
  {
    $planStartDate = $this->getCurrentPlanStartDate($workspace);
    
    if (!$planStartDate) {
      // Fallback to monthly count if no plan start date
      return $this->getPublicationsUsage($workspace);
    }
    
    return Cache::remember(
      "workspace.{$workspace->id}.publications.current_plan_usage",
      now()->addMinutes(2),
      function() use ($workspace, $planStartDate) {
        // Count published posts since plan started
        $publishedCount = \App\Models\Social\SocialPostLog::where('workspace_id', $workspace->id)
          ->whereIn('status', ['published', 'orphaned', 'publishing'])
          ->where('published_at', '>=', $planStartDate)
          ->count();

        // Count scheduled posts since plan started (that are still scheduled)
        $scheduledCount = \App\Models\Social\ScheduledPost::where('workspace_id', $workspace->id)
          ->where('status', 'scheduled')
          ->where('created_at', '>=', $planStartDate)
          ->count();

        return $publishedCount + $scheduledCount;
      }
    );
  }

  /**
   * Get AI requests usage since the current plan started
   */
  private function getAiRequestsUsageForCurrentPlan(Workspace $workspace): int
  {
    $planStartDate = $this->getCurrentPlanStartDate($workspace);
    
    if (!$planStartDate) {
      // Fallback to total usage if no plan start date
      return $this->getAiRequestsUsage($workspace);
    }
    
    return Cache::remember(
      "workspace.{$workspace->id}.ai_requests.current_plan_usage",
      now()->addMinutes(5),
      function() use ($workspace, $planStartDate) {
        // Sum usage from all metrics since plan started
        return $workspace->usageMetrics()
          ->where('metric_type', 'ai_requests')
          ->where('period_start', '>=', $planStartDate->toDateString())
          ->sum('current_usage');
      }
    );
  }

  /**
   * Get the start date of the current plan for a workspace
   */
  private function getCurrentPlanStartDate(Workspace $workspace): ?\Carbon\Carbon
  {
    // First try to get from user's plan_started_at
    $user = $workspace->owner();
    if ($user && $user->plan_started_at) {
      return $user->plan_started_at;
    }
    
    // Fallback: get from latest subscription history
    $latestHistory = $user?->subscriptionHistory()
      ->where('is_active', true)
      ->orderBy('started_at', 'desc')
      ->first();
    
    if ($latestHistory) {
      return $latestHistory->started_at;
    }
    
    // Last fallback: use workspace creation date
    return $workspace->created_at;
  }

  /**
   * Reset usage cache when plan changes
   */
  public function clearUsageCacheForPlanChange(Workspace $workspace): void
  {
    $cacheKeys = [
      "workspace.{$workspace->id}.storage.current_plan_usage",
      "workspace.{$workspace->id}.publications.current_plan_usage", 
      "workspace.{$workspace->id}.ai_requests.current_plan_usage",
      "workspace.{$workspace->id}.posts.monthly_count",
      "workspace.{$workspace->id}.limits.usage", // Cache usado por UsageLimitsNotificationService
      "workspace.{$workspace->id}.publications.active_count",
      "workspace.{$workspace->id}.social_accounts.count",
      "workspace.{$workspace->id}.team_members.count",
    ];
    
    foreach ($cacheKeys as $key) {
      Cache::forget($key);
    }
  }
}
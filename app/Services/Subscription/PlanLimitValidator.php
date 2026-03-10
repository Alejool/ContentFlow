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
    $limit  = $this->getLimit($limits, $limitType);

    // -1 means unlimited
    if ($limit === -1) {
      return true;
    }

    $currentUsage = $this->getCurrentUsage($workspace, $limitType);

    return $currentUsage < $limit;
  }

  /**
   * Check if workspace can upload a file of a specific size (in bytes).
   * Returns true if current_storage + additional_bytes <= limit.
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

    $currentBytes = $workspace->mediaFiles()->sum('size');

    // Consider current storage + pending uploads + this file
    return ($currentBytes + $pendingBytes + $additionalBytes) <= $limitBytes;
  }
  
  /**
   * Get remaining storage space in bytes.
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

    $currentBytes = $workspace->mediaFiles()->sum('size');
    $remaining = $limitBytes - $currentBytes - $pendingBytes;

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
      'publications'  => $this->getPublicationsUsage($workspace),
      'social_accounts' => $this->getSocialAccountsUsage($workspace),
      'storage'       => $this->getStorageUsageBytes($workspace),
      'ai_requests'   => $this->getAiRequestsUsage($workspace),
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
    return match ($limitType) {
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
  }

  /**
   * Get usage percentage for a specific limit type.
   */
  public function getUsagePercentage(Workspace $workspace, string $limitType): float
  {
    $limits = $this->getPlanLimits($workspace);
    $limit  = $this->getLimit($limits, $limitType);

    if ($limit === -1) {
      return 0;
    }

    if ($limit === 0) {
      return 100;
    }

    $currentUsage = $this->getCurrentUsage($workspace, $limitType);

    return min(100, ($currentUsage / $limit) * 100);
  }

  /**
   * Get remaining usage for a specific limit type.
   */
  public function getRemainingUsage(Workspace $workspace, string $limitType): int
  {
    $limits = $this->getPlanLimits($workspace);
    $limit  = $this->getLimit($limits, $limitType);

    if ($limit === -1) {
      return -1;
    }

    $currentUsage = $this->getCurrentUsage($workspace, $limitType);

    return max(0, $limit - $currentUsage);
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
}

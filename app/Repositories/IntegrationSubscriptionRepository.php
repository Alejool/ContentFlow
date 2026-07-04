<?php

namespace App\Repositories;

use App\Models\Auth\Role;
use App\Models\Integrations\IntegrationDeliveryLog;
use App\Models\Integrations\IntegrationEventSubscription;
use App\Models\Workspace\Workspace;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Reused Eloquent queries for integration event subscriptions and their
 * delivery logs. No business logic.
 */
class IntegrationSubscriptionRepository
{
    public function resolveWorkspace(string $idOrSlug): Workspace
    {
        return Workspace::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();
    }

    /** Workspace role slug for a user, or null when not a member. */
    public function workspaceRoleSlug(Workspace $workspace, int $userId): ?string
    {
        $pivot = $workspace->users()->where('users.id', $userId)->first()?->pivot;

        return $pivot ? Role::find($pivot->role_id)?->slug : null;
    }

    /** Subscriptions grouped by channel type. */
    public function groupedForWorkspace(int $workspaceId): Collection
    {
        return IntegrationEventSubscription::query()
            ->forWorkspace($workspaceId)
            ->orderBy('channel_type')
            ->orderBy('event_type')
            ->get()
            ->groupBy('channel_type');
    }

    public function create(int $workspaceId, array $attributes): IntegrationEventSubscription
    {
        return IntegrationEventSubscription::create([
            'workspace_id' => $workspaceId,
            ...$attributes,
        ]);
    }

    public function findForWorkspace(int $workspaceId, int $id): IntegrationEventSubscription
    {
        return IntegrationEventSubscription::where('workspace_id', $workspaceId)->findOrFail($id);
    }

    public function deliveryLogs(int $workspaceId, int $perPage): LengthAwarePaginator
    {
        return IntegrationDeliveryLog::query()
            ->where('workspace_id', $workspaceId)
            ->with('subscription')
            ->latest()
            ->paginate($perPage);
    }
}

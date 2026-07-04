<?php

namespace App\Repositories;

use App\Models\Publications\PublicationLock;
use Illuminate\Support\Collection;

/**
 * Reused Eloquent queries for publication edit-locks.
 * No business logic — query construction only.
 */
class PublicationLockRepository
{
    public function deleteExpired(): void
    {
        PublicationLock::where('expires_at', '<', now())->delete();
    }

    /** Active locks for a workspace, with locking user eager-loaded. */
    public function activeForWorkspace(int $workspaceId): Collection
    {
        return PublicationLock::whereHas('publication', fn ($q) => $q->where('workspace_id', $workspaceId))
            ->where('expires_at', '>', now())
            ->with('user:id,name')
            ->get();
    }

    public function forPublication(int $publicationId): ?PublicationLock
    {
        return PublicationLock::where('publication_id', $publicationId)->first();
    }

    public function forPublicationAndUser(int $publicationId, int $userId): ?PublicationLock
    {
        return PublicationLock::where('publication_id', $publicationId)
            ->where('user_id', $userId)
            ->first();
    }

    public function upsert(int $publicationId, array $attributes): PublicationLock
    {
        return PublicationLock::updateOrCreate(
            ['publication_id' => $publicationId],
            $attributes
        );
    }
}

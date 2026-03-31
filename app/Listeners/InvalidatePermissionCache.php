<?php

namespace App\Listeners;

use App\Events\RoleChanged;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Redis;

class InvalidatePermissionCache implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(RoleChanged $event): void
    {
        // Extract user and workspace from metadata
        $userId = $event->metadata['user_id'] ?? null;
        $workspaceId = $event->metadata['workspace_id'] ?? null;

        if (!$userId || !$workspaceId) {
            return;
        }

        // Clear all permission caches for this user in this workspace
        $this->clearUserPermissionCache($userId, $workspaceId);
    }

    /**
     * Clear all permission cache keys for a user in a workspace
     */
    protected function clearUserPermissionCache(int $userId, int $workspaceId): void
    {
        // Pattern to match all permission cache keys for this user and workspace
        $pattern = "permission:user:{$userId}:workspace:{$workspaceId}:*";
        
        // Get all matching keys
        $keys = Redis::keys($pattern);
        
        // Delete all matching keys
        if (!empty($keys)) {
            Redis::del($keys);
        }

        // Also clear the aggregated permissions cache
        $aggregatedKey = "permissions:user:{$userId}:workspace:{$workspaceId}";
        Redis::del($aggregatedKey);
    }
}

<?php

namespace App\Repositories;

use App\Models\Publications\Publication;
use App\Models\Social\ScheduledPost;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialPostLog;
use Illuminate\Support\Collection;

/**
 * Reused read queries for publications, their scheduled posts and post logs.
 * No business logic — query construction only.
 */
class PublicationRepository
{
    public function findInWorkspace(int $workspaceId, int $id): Publication
    {
        return Publication::where('workspace_id', $workspaceId)->findOrFail($id);
    }

    /** Workspace publications with pending-schedule counts (for stats). */
    public function forStats(int $workspaceId): Collection
    {
        return Publication::withoutGlobalScopes()
            ->where('workspace_id', $workspaceId)
            ->withCount(['scheduled_posts as pending_schedules_count' => fn ($q) => $q->where('status', 'pending')])
            ->get();
    }

    /** IDs of active (non-deleted) social accounts in a workspace. */
    public function activeSocialAccountIds(int $workspaceId): array
    {
        return SocialAccount::where('workspace_id', $workspaceId)
            ->whereNull('deleted_at')
            ->pluck('id')
            ->toArray();
    }

    /** Latest post-log row per social account for a publication. */
    public function latestLogsPerAccount(int $publicationId): Collection
    {
        return SocialPostLog::where('publication_id', $publicationId)
            ->select('social_account_id', 'status', 'retry_count', 'is_retrying')
            ->whereIn('id', function ($query) use ($publicationId) {
                $query->selectRaw('MAX(id)')
                    ->from('social_post_logs')
                    ->where('publication_id', $publicationId)
                    ->groupBy('social_account_id');
            })
            ->get();
    }

    /** Account IDs with a pending original (non-recurring) scheduled post. */
    public function scheduledAccountIds(int $publicationId, array $excludeAccountIds): array
    {
        return ScheduledPost::where('publication_id', $publicationId)
            ->where('status', 'pending')
            ->where('is_recurring_instance', false)
            ->whereNotIn('social_account_id', $excludeAccountIds)
            ->pluck('social_account_id')
            ->unique()
            ->values()
            ->toArray();
    }

    /** Recurring scheduled posts grouped by account. */
    public function recurringScheduledPosts(int $publicationId): Collection
    {
        return ScheduledPost::where('publication_id', $publicationId)
            ->where('is_recurring_instance', true)
            ->orderBy('social_account_id')
            ->orderBy('scheduled_at')
            ->get();
    }

    /** Published logs for recurring scheduled posts. */
    public function publishedRecurringLogs(int $publicationId): Collection
    {
        return SocialPostLog::where('publication_id', $publicationId)
            ->where('status', 'published')
            ->whereIn('scheduled_post_id', function ($query) use ($publicationId) {
                $query->select('id')
                    ->from('scheduled_posts')
                    ->where('publication_id', $publicationId)
                    ->where('is_recurring_instance', true);
            })
            ->get();
    }
}

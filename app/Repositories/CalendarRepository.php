<?php

namespace App\Repositories;

use App\Models\Calendar\BulkOperationHistory;
use App\Models\Social\ScheduledPost;
use App\Models\User\UserCalendarEvent;
use Illuminate\Support\Collection;

/**
 * Reused Eloquent queries for the calendar (scheduled posts, user events,
 * bulk-operation history). No business logic — query construction only.
 */
class CalendarRepository
{
    /**
     * Scheduled posts for a workspace within an optional range, filtered by
     * status/platform/campaign. Publication + relations eager-loaded.
     *
     * @param array{start:?\Carbon\Carbon,end:?\Carbon\Carbon,statuses:array,platforms:array,campaigns:array} $filters
     */
    public function scheduledPosts(int $workspaceId, array $filters): Collection
    {
        $query = ScheduledPost::where('workspace_id', $workspaceId)
            ->with([
                'publication' => fn ($q) => $q->with([
                    'user:id,name,photo_url',
                    'mediaFiles' => fn ($mq) => $mq->select('media_files.id', 'media_files.file_path', 'media_files.file_type'),
                    'campaigns:id,name',
                ]),
            ]);

        if ($filters['start'] && $filters['end']) {
            $query->whereBetween('scheduled_at', [$filters['start'], $filters['end']]);
        } else {
            $query->whereMonth('scheduled_at', now()->month)
                ->whereYear('scheduled_at', now()->year);
        }

        if (!empty($filters['statuses'])) {
            $query->whereIn('status', $filters['statuses']);
        }

        if (!empty($filters['platforms'])) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters['platforms'] as $platform) {
                    $q->orWhereRaw('LOWER(platform) = ?', [strtolower($platform)]);
                }
            });
        }

        if (!empty($filters['campaigns'])) {
            $query->whereHas('publication.campaigns', fn ($q) => $q->whereIn('campaigns.id', $filters['campaigns']));
        }

        return $query->get();
    }

    /** Public or own user calendar events for a workspace within a range. */
    public function userEvents(int $workspaceId, int $userId, $start, $end): Collection
    {
        return UserCalendarEvent::where('workspace_id', $workspaceId)
            ->where(fn ($q) => $q->where('is_public', true)->orWhere('user_id', $userId))
            ->whereBetween('start_date', [$start, $end])
            ->with('user:id,name,photo_url')
            ->get();
    }

    public function findScheduledPost(int $workspaceId, $id): ?ScheduledPost
    {
        return ScheduledPost::where('workspace_id', $workspaceId)->find($id);
    }

    public function findUserEvent(int $workspaceId, int $userId, $id): ?UserCalendarEvent
    {
        return UserCalendarEvent::where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->find($id);
    }

    public function createBulkHistory(array $attributes): BulkOperationHistory
    {
        return BulkOperationHistory::create($attributes);
    }

    public function lastBulkOperation(int $userId, int $workspaceId): ?BulkOperationHistory
    {
        return BulkOperationHistory::where('user_id', $userId)
            ->where('workspace_id', $workspaceId)
            ->latest()
            ->first();
    }
}

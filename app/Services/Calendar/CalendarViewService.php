<?php

namespace App\Services\Calendar;

use App\Models\User;
use App\Repositories\CalendarRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Calendar board assembly and drag/drop + bulk reschedule logic for the API.
 * Controller stays thin; all Eloquent goes through CalendarRepository.
 */
class CalendarViewService
{
    private const PLATFORM_COLORS = [
        'facebook' => '#2563EB',
        'instagram' => '#DB2777',
        'tiktok' => '#000000',
        'twitter' => '#1F2937',
        'x' => '#1F2937',
        'youtube' => '#DC2626',
        'linkedin' => '#1D4ED8',
    ];

    public function __construct(private CalendarRepository $repo)
    {
    }

    /**
     * Combined calendar events (scheduled posts + user events) for the range.
     */
    public function eventsForRange(int $workspaceId, int $userId, array $raw, string $clientTz): Collection
    {
        $start = $this->parseToUtc($raw['start'] ?? null, $clientTz);
        $end = $this->parseToUtc($raw['end'] ?? null, $clientTz);

        $filters = [
            'start' => $start,
            'end' => $end,
            'statuses' => $this->splitCsv($raw['statuses'] ?? null),
            'platforms' => array_map('strtolower', $this->splitCsv($raw['platforms'] ?? null)),
            'campaigns' => array_map('intval', $this->splitCsv($raw['campaigns'] ?? null)),
        ];

        $events = $this->repo->scheduledPosts($workspaceId, $filters)
            ->filter(fn ($post) => $post->publication && $post->publication->workspace_id === $workspaceId)
            ->map(fn ($post) => $this->mapScheduledPost($post))
            ->values();

        $userEvents = $this->repo->userEvents(
            $workspaceId,
            $userId,
            $start ?? now()->startOfMonth()->setTimezone('UTC'),
            $end ?? now()->endOfMonth()->setTimezone('UTC'),
        )->map(fn ($event) => $this->mapUserEvent($event));

        return $events->concat($userEvents);
    }

    /**
     * Reschedule a single post/user-event (drag & drop).
     *
     * @return array{ok: bool, status?: int, error?: string, model?: mixed, type?: string}
     */
    public function reschedule(string $type, $id, string $rawDate, User $user, int $workspaceId, string $clientTz): array
    {
        $newDate = $this->parseToUtc($rawDate, $clientTz) ?? Carbon::parse($rawDate);

        if ($type === 'post') {
            $model = $this->repo->findScheduledPost($workspaceId, $id);
            if (!$model) {
                return ['ok' => false, 'status' => 404, 'error' => 'Scheduled post not found or does not belong to your workspace'];
            }
            if (!$user->hasPermission('manage-content', $workspaceId)) {
                return ['ok' => false, 'status' => 403, 'error' => 'Unauthorized'];
            }
            $model->update(['scheduled_at' => $newDate]);
            $model->load('publication.user:id,name,photo_url');
        } elseif ($type === 'user_event') {
            $model = $this->repo->findUserEvent($workspaceId, $user->id, $id);
            if (!$model) {
                return ['ok' => false, 'status' => 404, 'error' => 'User event not found or does not belong to your workspace'];
            }
            $duration = $model->end_date ? $model->start_date->diffInSeconds($model->end_date) : null;
            $model->update([
                'start_date' => $newDate,
                'end_date' => $duration ? $newDate->copy()->addSeconds($duration) : null,
            ]);
            $model->load('user:id,name,photo_url');
        } else {
            return ['ok' => false, 'status' => 400, 'error' => 'Invalid type'];
        }

        $this->bumpPublicationsCache($workspaceId);

        return ['ok' => true, 'model' => $model, 'type' => $type];
    }

    /**
     * Move/delete multiple events, recording history for undo.
     *
     * @return array{ok: bool, status?: int, error?: string, result?: array}
     */
    public function bulkUpdate(array $eventIds, string $operation, string $rawDate, User $user, int $workspaceId, string $clientTz): array
    {
        if (!$user->hasPermission('manage-content', $workspaceId)) {
            return ['ok' => false, 'status' => 403, 'error' => 'Unauthorized'];
        }

        $newDate = $this->parseToUtc($rawDate, $clientTz) ?? Carbon::parse($rawDate);
        $successful = [];
        $failed = [];
        $previousState = [];

        foreach ($eventIds as $eventId) {
            try {
                $parts = explode('_', $eventId);
                $type = $parts[0];
                $resourceId = end($parts);

                if ($type === 'post') {
                    $model = $this->repo->findScheduledPost($workspaceId, $resourceId);
                    if (!$model) {
                        throw new \Exception('Scheduled post not found or does not belong to your workspace');
                    }
                    $previousState[] = [
                        'id' => $eventId,
                        'type' => 'post',
                        'resource_id' => $resourceId,
                        'scheduled_at' => $model->scheduled_at->toIso8601String(),
                    ];
                    $this->applyBulkOp($model, $operation, ['scheduled_at' => $newDate]);
                    $successful[] = $eventId;
                } elseif ($type === 'user') {
                    $model = $this->repo->findUserEvent($workspaceId, $user->id, $resourceId);
                    if (!$model) {
                        throw new \Exception('User event not found or does not belong to your workspace');
                    }
                    $duration = $model->end_date ? $model->start_date->diffInSeconds($model->end_date) : null;
                    $previousState[] = [
                        'id' => $eventId,
                        'type' => 'user_event',
                        'resource_id' => $resourceId,
                        'start_date' => $model->start_date->toIso8601String(),
                        'end_date' => $model->end_date ? $model->end_date->toIso8601String() : null,
                    ];
                    $this->applyBulkOp($model, $operation, [
                        'start_date' => $newDate,
                        'end_date' => $duration ? $newDate->copy()->addSeconds($duration) : null,
                    ]);
                    $successful[] = $eventId;
                }
            } catch (\Exception $e) {
                $failed[] = ['id' => $eventId, 'error' => $e->getMessage()];
            }
        }

        if (!empty($successful)) {
            $this->repo->createBulkHistory([
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'operation_type' => $operation,
                'event_ids' => $eventIds,
                'previous_state' => $previousState,
                'new_state' => ['new_date' => $newDate->toIso8601String(), 'operation' => $operation],
                'successful_count' => count($successful),
                'failed_count' => count($failed),
                'error_details' => $failed,
            ]);
        }

        $this->bumpPublicationsCache($workspaceId);

        return ['ok' => true, 'result' => [
            'successful' => $successful,
            'failed' => $failed,
            'total' => count($eventIds),
            'successful_count' => count($successful),
            'failed_count' => count($failed),
        ]];
    }

    /**
     * Undo the most recent bulk operation (within 5 minutes).
     *
     * @return array{ok: bool, status?: int, error?: string, result?: array}
     */
    public function undoLastBulk(User $user, int $workspaceId): array
    {
        if (!$user->hasPermission('manage-content', $workspaceId)) {
            return ['ok' => false, 'status' => 403, 'error' => 'Unauthorized'];
        }

        $lastOperation = $this->repo->lastBulkOperation($user->id, $workspaceId);
        if (!$lastOperation) {
            return ['ok' => false, 'status' => 404, 'error' => 'No operation to undo'];
        }
        if ($lastOperation->created_at->diffInMinutes(now()) > 5) {
            return ['ok' => false, 'status' => 400, 'error' => 'Operation too old to undo'];
        }

        $successful = [];
        $failed = [];
        $total = count($lastOperation->previous_state);

        foreach ($lastOperation->previous_state as $state) {
            try {
                if ($state['type'] === 'post') {
                    $model = $this->repo->findScheduledPost($workspaceId, $state['resource_id']);
                    if (!$model) {
                        throw new \Exception('Scheduled post not found or does not belong to your workspace');
                    }
                    $model->update(['scheduled_at' => Carbon::parse($state['scheduled_at'])]);
                    $successful[] = $state['id'];
                } elseif ($state['type'] === 'user_event') {
                    $model = $this->repo->findUserEvent($workspaceId, $user->id, $state['resource_id']);
                    if (!$model) {
                        throw new \Exception('User event not found or does not belong to your workspace');
                    }
                    $model->update([
                        'start_date' => Carbon::parse($state['start_date']),
                        'end_date' => $state['end_date'] ? Carbon::parse($state['end_date']) : null,
                    ]);
                    $successful[] = $state['id'];
                }
            } catch (\Exception $e) {
                $failed[] = ['id' => $state['id'], 'error' => $e->getMessage()];
            }
        }

        $lastOperation->delete();
        $this->bumpPublicationsCache($workspaceId);

        return ['ok' => true, 'result' => [
            'successful' => $successful,
            'failed' => $failed,
            'total' => $total,
            'successful_count' => count($successful),
            'failed_count' => count($failed),
        ]];
    }

    // ── Internals ─────────────────────────────────────────────────────────

    private function applyBulkOp($model, string $operation, array $moveAttrs): void
    {
        if ($operation === 'move') {
            $model->update($moveAttrs);
        } elseif ($operation === 'delete') {
            $model->delete();
        }
    }

    private function mapScheduledPost($post): array
    {
        $pub = $post->publication;
        $latestLog = $post->postLogs()->latest()->first();
        $campaignNames = $pub->campaigns->pluck('name')->toArray();
        $displayStatus = $post->status === 'pending' ? 'scheduled' : $post->status;
        $platform = strtolower($post->platform);

        return [
            'id' => "post_{$post->id}",
            'resourceId' => $post->id,
            'publicationId' => $pub->id,
            'type' => 'post',
            'title' => $pub->title,
            'start' => $post->scheduled_at ? $post->scheduled_at->copy()->setTimezone('UTC')->toIso8601String() : null,
            'status' => $displayStatus,
            'color' => $this->platformColor($platform),
            'platform' => $platform,
            'campaign' => $campaignNames[0] ?? null,
            'user' => $pub->user ? [
                'id' => $pub->user->id,
                'name' => $pub->user->name,
                'photo_url' => $pub->user->photo_url,
            ] : null,
            'extendedProps' => [
                'slug' => '/content',
                'thumbnail' => $pub->mediaFiles->first()?->file_path,
                'platform' => $platform,
                'platforms' => [$platform],
                'campaigns' => $campaignNames,
                'publication_id' => $pub->id,
                'post_id' => $post->post_id,
                'post_url' => $latestLog?->post_url,
                'error_message' => $latestLog?->error_message,
            ],
        ];
    }

    private function mapUserEvent($event): array
    {
        return [
            'id' => "user_event_{$event->id}",
            'resourceId' => $event->id,
            'type' => 'user_event',
            'title' => $event->title,
            'start' => $event->start_date ? $event->start_date->copy()->setTimezone('UTC')->toIso8601String() : null,
            'end' => $event->end_date ? $event->end_date->copy()->setTimezone('UTC')->toIso8601String() : null,
            'status' => 'event',
            'color' => $event->color,
            'user' => $event->user ? [
                'id' => $event->user->id,
                'name' => $event->user->name,
                'photo_url' => $event->user->photo_url,
            ] : null,
            'extendedProps' => [
                'description' => $event->description,
                'is_public' => $event->is_public,
                'remind_at' => $event->remind_at ? $event->remind_at->copy()->setTimezone('UTC')->toIso8601String() : null,
                'user_name' => $event->user?->name,
                'created_at' => $event->created_at ? $event->created_at->copy()->setTimezone('UTC')->toIso8601String() : null,
            ],
        ];
    }

    private function platformColor(string $platform): string
    {
        return self::PLATFORM_COLORS[$platform] ?? '#6B7280';
    }

    private function splitCsv(?string $value): array
    {
        return $value ? explode(',', $value) : [];
    }

    private function parseToUtc(?string $value, string $clientTz): ?Carbon
    {
        if (!$value) {
            return null;
        }
        try {
            return Carbon::parse($value, $clientTz)->setTimezone('UTC');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function bumpPublicationsCache(int $workspaceId): void
    {
        try {
            cache()->increment("publications:{$workspaceId}:version");
        } catch (\Exception $e) {
            cache()->put("publications:{$workspaceId}:version", time(), now()->addDays(7));
        }
    }
}

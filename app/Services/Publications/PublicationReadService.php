<?php

namespace App\Services\Publications;

use App\Repositories\PublicationRepository;

/**
 * Read-side aggregation for publications (dashboard stats, per-platform
 * publish state). Controller stays thin; all Eloquent via the repository.
 */
class PublicationReadService
{
    public function __construct(private PublicationRepository $repo)
    {
    }

    /** Status counts for the workspace dashboard. */
    public function stats(int $workspaceId): array
    {
        $stats = [
            'draft' => 0,
            'published' => 0,
            'publishing' => 0,
            'failed' => 0,
            'pending_review' => 0,
            'approved' => 0,
            'scheduled' => 0,
        ];

        $publications = $this->repo->forStats($workspaceId);

        foreach ($publications as $pub) {
            $status = $pub->status;

            if ($status === 'publishing' || $status === 'publishi') {
                $stats['publishing']++;
                if ($status === 'publishi') {
                    $pub->update(['status' => 'publishing']); // heal truncated status
                }
            } elseif ($status === 'published' || $status === 'publis') {
                $stats['published']++;
                if ($status === 'publis') {
                    $pub->update(['status' => 'published']);
                }
            } elseif ($status === 'failed') {
                $stats['failed']++;
            } elseif (!empty($pub->scheduled_at) || $pub->pending_schedules_count > 0) {
                $stats['scheduled']++;
            } elseif (isset($stats[$status])) {
                $stats[$status]++;
            } else {
                $stats['draft']++;
            }
        }

        $stats['total'] = count($publications);

        return $stats;
    }

    public function emptyStats(): array
    {
        return [
            'draft' => 0,
            'published' => 0,
            'publishing' => 0,
            'failed' => 0,
            'pending_review' => 0,
            'approved' => 0,
            'scheduled' => 0,
            'total' => 0,
        ];
    }

    /**
     * Per-platform publish/scheduling state for a publication.
     */
    public function publishedPlatforms(int $workspaceId, int $publicationId): array
    {
        $this->repo->findInWorkspace($workspaceId, $publicationId);

        $activeAccountIds = $this->repo->activeSocialAccountIds($workspaceId);

        $statusGroups = ['published' => [], 'failed' => [], 'publishing' => [], 'removed_platforms' => []];
        $retryInfo = [];

        foreach ($this->repo->latestLogsPerAccount($publicationId) as $log) {
            // Account gone/disconnected: only surface if it was published elsewhere.
            if (!in_array($log->social_account_id, $activeAccountIds)) {
                if (in_array($log->status, ['published', 'success', 'removed_on_platform'])) {
                    $statusGroups['removed_platforms'][] = $log->social_account_id;
                }
                continue;
            }

            $status = $log->status === 'removed_on_platform' ? 'removed_platforms' : $log->status;
            if ($status === 'pending') {
                $status = 'publishing';
            }

            if (isset($statusGroups[$status])) {
                $statusGroups[$status][] = $log->social_account_id;
            }

            if ($log->is_retrying || $log->retry_count > 0) {
                $retryInfo[$log->social_account_id] = [
                    'retry_count' => $log->retry_count,
                    'is_retrying' => $log->is_retrying,
                    'retry_status' => sprintf('%d/3', $log->is_retrying ? $log->retry_count + 1 : $log->retry_count),
                ];
            }
        }

        $publishedAccountIds = array_merge($statusGroups['published'], $statusGroups['removed_platforms']);

        $recurringPosts = $this->repo->recurringScheduledPosts($publicationId)
            ->groupBy('social_account_id')
            ->map(fn ($posts) => $posts->map(fn ($post) => [
                'id' => $post->id,
                'scheduled_at' => $post->scheduled_at,
                'status' => $post->status,
                'social_account_id' => $post->social_account_id,
            ]))
            ->toArray();

        $publishedRecurringPosts = $this->repo->publishedRecurringLogs($publicationId)
            ->groupBy('social_account_id')
            ->map(fn ($logs) => $logs->map(fn ($log) => [
                'id' => $log->id,
                'published_at' => $log->published_at,
                'post_url' => $log->post_url,
                'social_account_id' => $log->social_account_id,
                'scheduled_post_id' => $log->scheduled_post_id,
            ]))
            ->toArray();

        return [
            'published_platforms' => array_values(array_unique($statusGroups['published'])),
            'failed_platforms' => array_values(array_unique($statusGroups['failed'])),
            'publishing_platforms' => array_values(array_unique($statusGroups['publishing'])),
            'removed_platforms' => array_values(array_unique($statusGroups['removed_platforms'])),
            'scheduled_platforms' => $this->repo->scheduledAccountIds($publicationId, $publishedAccountIds),
            'retry_info' => $retryInfo,
            'recurring_posts' => $recurringPosts,
            'published_recurring_posts' => $publishedRecurringPosts,
        ];
    }
}

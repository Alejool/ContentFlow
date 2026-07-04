<?php

namespace App\Repositories;

use App\Models\Campaigns\Campaign;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Complex / reused Eloquent queries for campaigns.
 * No business logic — query construction only.
 */
class CampaignRepository
{
    private const LIST_RELATIONS = [
        'user',
        'publications',
        'publications.analytics',
        'publications.socialPostLogs',
        'publications.socialPostLogs.socialAccount',
        'publications.mediaFiles',
    ];

    /**
     * Find a campaign scoped to a workspace or fail.
     */
    public function findForWorkspace(int|string $id, int $workspaceId, array $with = []): Campaign
    {
        return Campaign::when($with, fn (Builder $q) => $q->with($with))
            ->where('workspace_id', $workspaceId)
            ->findOrFail($id);
    }

    /**
     * Whether a campaign name already exists in a workspace.
     */
    public function nameExists(string $name, int $workspaceId): bool
    {
        return Campaign::where('workspace_id', $workspaceId)
            ->where('name', $name)
            ->exists();
    }

    /**
     * Paginated, filtered campaign list with the relations the index view needs.
     */
    public function paginateForWorkspace(int $workspaceId, array $filters, int $perPage): Paginator
    {
        $query = Campaign::where('workspace_id', $workspaceId)->with([
            'user' => fn ($q) => $q->select('id', 'name', 'email', 'photo_url'),
            'publications' => fn ($q) => $q->select('publications.id', 'publications.title', 'publications.status', 'publications.created_at'),
            'publications.analytics',
            'publications.socialPostLogs' => fn ($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'published_at'),
            'publications.socialPostLogs.socialAccount' => fn ($q) => $q->select('id', 'platform', 'account_name'),
            'publications.mediaFiles' => fn ($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name'),
        ]);

        $this->applyStatusFilter($query, $filters['status'] ?? null);

        if (!empty($filters['search'])) {
            $query->where('name', 'LIKE', '%' . $filters['search'] . '%');
        }

        if (!empty($filters['date_start']) && !empty($filters['date_end'])) {
            $query->byDateRange($filters['date_start'], $filters['date_end']);
        }

        return $query->orderBy('updated_at', 'desc')->orderBy('id', 'desc')->paginate($perPage);
    }

    private function applyStatusFilter(Builder $query, ?string $status): void
    {
        if (!$status || $status === 'all') {
            return;
        }

        $query->where('status', $status);

        match ($status) {
            'active' => $query->active(),
            'inactive' => $query->inactive(),
            'completed' => $query->completed(),
            'deleted' => $query->deleted(),
            'paused' => $query->paused(),
            default => null,
        };
    }

    public function showRelations(): array
    {
        return [
            'publications' => fn ($q) => $q->select('publications.id', 'publications.title', 'publications.status', 'publications.created_at'),
            'publications.mediaFiles' => fn ($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name'),
            'publications.socialPostLogs' => fn ($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'published_at'),
            'publications.socialPostLogs.socialAccount' => fn ($q) => $q->select('id', 'platform', 'account_name'),
        ];
    }
}

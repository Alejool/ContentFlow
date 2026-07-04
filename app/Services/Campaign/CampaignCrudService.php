<?php

namespace App\Services\Campaign;

use App\DTOs\Campaign\CreateCampaignDTO;
use App\DTOs\Campaign\UpdateCampaignDTO;
use App\Models\Campaigns\Campaign;
use App\Repositories\CampaignRepository;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Support\Facades\Auth;

/**
 * Campaign CRUD business logic: create/update/duplicate/delete,
 * publication sync, aggregate stats and cache invalidation.
 */
class CampaignCrudService
{
    public function __construct(private CampaignRepository $campaigns)
    {
    }

    public function listWithStats(int $workspaceId, array $filters, int $perPage): Paginator
    {
        $campaigns = $this->campaigns->paginateForWorkspace($workspaceId, $filters, $perPage);

        $campaigns->getCollection()->transform(function (Campaign $campaign) {
            $analytics = $campaign->publications->flatMap->analytics;
            $campaign->stats = [
                'views' => $analytics->sum('views'),
                'clicks' => $analytics->sum('clicks'),
                'engagement' => $analytics->sum('total_engagement')
                    ?? ($analytics->sum('likes') + $analytics->sum('comments')),
            ];
            return $campaign;
        });

        return $campaigns;
    }

    public function find(int|string $id, int $workspaceId): Campaign
    {
        return $this->campaigns->findForWorkspace($id, $workspaceId, $this->campaigns->showRelations());
    }

    public function findScoped(int|string $id, int $workspaceId): Campaign
    {
        return $this->campaigns->findForWorkspace($id, $workspaceId);
    }

    public function create(CreateCampaignDTO $dto, int $workspaceId): Campaign
    {
        $campaign = Campaign::create([
            'user_id' => Auth::id(),
            'workspace_id' => $workspaceId,
            ...$dto->toAttributes(),
        ]);

        if (!empty($dto->publicationIds)) {
            $campaign->publications()->attach($this->orderedSync($dto->publicationIds));
        }

        $this->clearCache($workspaceId);

        return $campaign->load('publications');
    }

    /**
     * @return array{ok: bool, campaign?: Campaign, error?: string}
     */
    public function update(Campaign $campaign, UpdateCampaignDTO $dto, int $workspaceId): array
    {
        if ($dto->name !== null && $dto->name !== $campaign->name) {
            $hasPublished = $campaign->publications()->where('status', 'published')->exists();
            if ($hasPublished) {
                return ['ok' => false, 'error' => __('messages.campaign.cannot_change_name')];
            }
        }

        $campaign->update($dto->attributes);

        if ($dto->hasPublicationIds()) {
            $campaign->publications()->sync($this->orderedSync($dto->publicationIds));
        }

        $this->clearCache($workspaceId);

        return ['ok' => true, 'campaign' => $campaign->load('publications')];
    }

    public function delete(Campaign $campaign, int $workspaceId): void
    {
        $campaign->delete();
        $this->clearCache($workspaceId);
    }

    public function duplicate(Campaign $campaign, int $workspaceId): Campaign
    {
        $baseName = $campaign->name;
        $counter = 1;
        $newName = $baseName . ' ' . $counter;
        while ($this->campaigns->nameExists($newName, $workspaceId)) {
            $counter++;
            $newName = $baseName . ' ' . $counter;
        }

        $copy = Campaign::create([
            'user_id' => Auth::id(),
            'workspace_id' => $workspaceId,
            'name' => $newName,
            'description' => $campaign->description,
            'status' => $campaign->status,
            'start_date' => $campaign->start_date,
            'end_date' => $campaign->end_date,
            'goal' => $campaign->goal,
            'budget' => $campaign->budget,
        ]);

        $this->clearCache($workspaceId);

        return $copy;
    }

    public function addPublications(Campaign $campaign, array $publicationIds): Campaign
    {
        $currentMax = $campaign->publications()->max('order') ?? 0;
        foreach (array_values($publicationIds) as $index => $publicationId) {
            $campaign->publications()->attach($publicationId, ['order' => $currentMax + $index + 1]);
        }
        return $campaign->load('publications');
    }

    public function removePublications(Campaign $campaign, array $publicationIds): Campaign
    {
        $campaign->publications()->detach($publicationIds);
        return $campaign->load('publications');
    }

    /**
     * Build a sync map { publicationId => ['order' => n] } preserving order.
     */
    private function orderedSync(array $publicationIds): array
    {
        $sync = [];
        foreach (array_values($publicationIds) as $index => $publicationId) {
            $sync[$publicationId] = ['order' => $index + 1];
        }
        return $sync;
    }

    public function clearCache(?int $workspaceId): void
    {
        if (!$workspaceId) {
            return;
        }

        foreach (["campaigns:{$workspaceId}:version", "publications:{$workspaceId}:version"] as $key) {
            try {
                cache()->increment($key);
            } catch (\Exception $e) {
                cache()->put($key, time(), now()->addDays(7));
            }
        }

        if (config('cache.default') === 'redis') {
            try {
                $pattern = "campaigns:{$workspaceId}:*";
                $keys = cache()->getRedis()->keys(config('cache.prefix') . $pattern);
                foreach ($keys as $key) {
                    cache()->forget(str_replace(config('cache.prefix'), '', $key));
                }
            } catch (\Exception $e) {
                // Silently fail — version bump above already invalidates reads.
            }
        }
    }
}

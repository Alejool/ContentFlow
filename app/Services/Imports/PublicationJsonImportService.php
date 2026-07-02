<?php

namespace App\Services\Imports;

use App\Models\Campaigns\Campaign;
use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\Publication;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Bulk import of publications and campaigns from a JSON payload.
 *
 * Accepted structure (both keys optional, at least one required):
 * {
 *   "publications": [ { ...publication } ],
 *   "campaigns":    [ { ...campaign, "publications": [ { ...publication } ] } ]
 * }
 *
 * Initially image-oriented: media entries must be image URLs and
 * content_type is limited to image-based types.
 */
class PublicationJsonImportService
{
    public const SUPPORTED_CONTENT_TYPES = ['post', 'story', 'carousel'];
    public const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    protected array $errors = [];
    protected int $successCount = 0;
    protected int $failedCount = 0;
    protected array $createdPublicationIds = [];
    protected array $createdCampaignIds = [];

    public function import(array $payload, User $user): array
    {
        $this->errors = [];
        $this->successCount = 0;
        $this->failedCount = 0;
        $this->createdPublicationIds = [];
        $this->createdCampaignIds = [];

        $workspaceId = $user->current_workspace_id ?? $user->workspaces()->first()?->id;

        $publications = $payload['publications'] ?? [];
        $campaigns = $payload['campaigns'] ?? [];

        if (!is_array($publications) || !is_array($campaigns) || (empty($publications) && empty($campaigns))) {
            $this->errors[] = [
                'path' => 'root',
                'errors' => ['El JSON debe contener al menos una lista "publications" o "campaigns" con elementos.'],
            ];
            $this->failedCount++;

            return $this->result();
        }

        foreach (array_values($publications) as $index => $item) {
            $this->importPublicationItem($item, "publications[{$index}]", $user, $workspaceId);
        }

        foreach (array_values($campaigns) as $index => $item) {
            $this->importCampaignItem($item, "campaigns[{$index}]", $user, $workspaceId);
        }

        return $this->result();
    }

    protected function importPublicationItem(mixed $item, string $path, User $user, int $workspaceId): ?Publication
    {
        if (!is_array($item)) {
            $this->fail($path, ['El elemento debe ser un objeto JSON.']);

            return null;
        }

        $validator = Validator::make($item, $this->publicationRules());

        $mediaErrors = $this->validateImageMedia($item['media'] ?? []);

        if ($validator->fails() || !empty($mediaErrors)) {
            $this->fail($path, array_merge($validator->errors()->all(), $mediaErrors));

            return null;
        }

        try {
            $publication = DB::transaction(fn() => $this->createPublication($item, $user, $workspaceId));

            $this->successCount++;
            $this->createdPublicationIds[] = $publication->id;

            return $publication;
        } catch (\Exception $e) {
            $this->fail($path, [$e->getMessage()]);

            return null;
        }
    }

    protected function importCampaignItem(mixed $item, string $path, User $user, int $workspaceId): void
    {
        if (!is_array($item)) {
            $this->fail($path, ['El elemento debe ser un objeto JSON.']);

            return;
        }

        $validator = Validator::make($item, $this->campaignRules());

        if ($validator->fails()) {
            $this->fail($path, $validator->errors()->all());

            return;
        }

        // Validate nested publications before creating anything so the
        // campaign is not persisted with a partially failed batch.
        $nested = array_values($item['publications'] ?? []);
        $nestedErrors = [];

        foreach ($nested as $index => $pubItem) {
            if (!is_array($pubItem)) {
                $nestedErrors["{$path}.publications[{$index}]"] = ['El elemento debe ser un objeto JSON.'];
                continue;
            }

            $pubValidator = Validator::make($pubItem, $this->publicationRules());
            $mediaErrors = $this->validateImageMedia($pubItem['media'] ?? []);

            if ($pubValidator->fails() || !empty($mediaErrors)) {
                $nestedErrors["{$path}.publications[{$index}]"] = array_merge(
                    $pubValidator->errors()->all(),
                    $mediaErrors
                );
            }
        }

        if (!empty($nestedErrors)) {
            foreach ($nestedErrors as $nestedPath => $errors) {
                $this->fail($nestedPath, $errors);
            }
            $this->fail($path, ['La campaña no se creó porque una o más publicaciones anidadas son inválidas.']);

            return;
        }

        try {
            DB::transaction(function () use ($item, $nested, $user, $workspaceId) {
                $campaign = $this->createCampaign($item, $user, $workspaceId);

                $this->createdCampaignIds[] = $campaign->id;

                foreach ($nested as $order => $pubItem) {
                    $publication = $this->createPublication($pubItem, $user, $workspaceId);
                    $campaign->publications()->attach($publication->id, ['order' => $order]);

                    $this->successCount++;
                    $this->createdPublicationIds[] = $publication->id;
                }
            });

            $this->successCount++; // the campaign itself
        } catch (\Exception $e) {
            $this->fail($path, [$e->getMessage()]);
        }
    }

    protected function publicationRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'content_type' => 'nullable|in:' . implode(',', self::SUPPORTED_CONTENT_TYPES),
            'status' => 'nullable|in:draft,scheduled,published,pending_review',
            'scheduled_at' => 'nullable|date|required_if:status,scheduled',
            'hashtags' => 'nullable|array',
            'hashtags.*' => 'string|max:100',
            'description' => 'nullable|string',
            'url' => 'nullable|url',
            'media' => 'nullable|array',
            'media.*' => 'url',
        ];
    }

    protected function campaignRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,completed,paused',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'goal' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'publications' => 'nullable|array',
        ];
    }

    /**
     * Initial scope: only image media is supported.
     */
    protected function validateImageMedia(mixed $media): array
    {
        if (empty($media) || !is_array($media)) {
            return [];
        }

        $errors = [];

        foreach ($media as $index => $url) {
            if (!is_string($url)) {
                continue; // url rule already reports it
            }

            $extension = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));

            if (!in_array($extension, self::IMAGE_EXTENSIONS)) {
                $errors[] = "media[{$index}]: solo se admiten imágenes (" . implode(', ', self::IMAGE_EXTENSIONS) . ').';
            }
        }

        return $errors;
    }

    protected function createPublication(array $item, User $user, int $workspaceId): Publication
    {
        $status = $item['status'] ?? 'draft';

        $data = [
            'user_id' => $user->id,
            'workspace_id' => $workspaceId,
            'title' => $item['title'],
            'slug' => Str::slug($item['title']) . '-' . Str::random(6),
            'body' => $item['body'],
            'content_type' => $item['content_type'] ?? 'post',
            'description' => $item['description'] ?? null,
            'url' => $item['url'] ?? null,
        ];

        if (!empty($item['scheduled_at'])) {
            $data['scheduled_at'] = Carbon::parse($item['scheduled_at']);

            if ($status === 'draft') {
                $status = 'scheduled';
            }
        }

        $data['status'] = $status;
        $data['publish_date'] = $status === 'published' ? now() : null;

        if (!empty($item['hashtags'])) {
            $data['hashtags'] = array_map(
                fn(string $tag) => str_starts_with($tag, '#') ? $tag : '#' . $tag,
                array_map('trim', $item['hashtags'])
            );
        }

        $publication = Publication::create($data);

        foreach (array_values($item['media'] ?? []) as $order => $url) {
            $mediaFile = MediaFile::create([
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'file_name' => basename(parse_url($url, PHP_URL_PATH) ?? $url),
                'file_path' => $url,
                'file_type' => 'image',
                'size' => 0,
                'mime_type' => $this->imageMimeFromUrl($url),
            ]);

            $publication->mediaFiles()->attach($mediaFile->id, ['order' => $order]);
        }

        return $publication;
    }

    protected function createCampaign(array $item, User $user, int $workspaceId): Campaign
    {
        $data = [
            'user_id' => $user->id,
            'workspace_id' => $workspaceId,
            'name' => $item['name'],
            'description' => $item['description'] ?? null,
            'status' => $item['status'] ?? 'active',
            'goal' => $item['goal'] ?? null,
            'budget' => $item['budget'] ?? null,
        ];

        if (!empty($item['start_date'])) {
            $data['start_date'] = Carbon::parse($item['start_date']);
        }

        if (!empty($item['end_date'])) {
            $data['end_date'] = Carbon::parse($item['end_date']);
        }

        return Campaign::create($data);
    }

    protected function imageMimeFromUrl(string $url): string
    {
        $extension = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION));

        return match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'application/octet-stream',
        };
    }

    protected function fail(string $path, array $errors): void
    {
        $this->errors[] = ['path' => $path, 'errors' => $errors];
        $this->failedCount++;
    }

    protected function result(): array
    {
        return [
            'success_count' => $this->successCount,
            'failed_count' => $this->failedCount,
            'total' => $this->successCount + $this->failedCount,
            'publication_ids' => $this->createdPublicationIds,
            'campaign_ids' => $this->createdCampaignIds,
            'errors' => $this->errors,
        ];
    }
}

<?php

namespace App\Services\Preview;

use App\Models\Publications\Publication;

class PlatformPreviewService
{
    public function generatePreview(Publication $publication, string $platform): array
    {
        return match ($platform) {
            'facebook' => $this->facebookPreview($publication),
            'instagram' => $this->instagramPreview($publication),
            'twitter' => $this->twitterPreview($publication),
            'linkedin' => $this->linkedinPreview($publication),
            'tiktok' => $this->tiktokPreview($publication),
            default => $this->genericPreview($publication),
        };
    }

    protected function facebookPreview(Publication $publication): array
    {
        return [
            'platform' => 'facebook',
            'text' => $this->truncateText($publication->body, 63206),
            'hashtags' => $this->formatHashtags($publication->hashtags),
            'media' => $this->getMediaPreviews($publication, 'facebook'),
            'limits' => ['text' => 63206, 'images' => 10, 'video' => 1],
        ];
    }

    protected function instagramPreview(Publication $publication): array
    {
        return [
            'platform' => 'instagram',
            'text' => $this->truncateText($publication->body, 2200),
            'hashtags' => $this->formatHashtags($publication->hashtags, 30),
            'media' => $this->getMediaPreviews($publication, 'instagram'),
            'limits' => ['text' => 2200, 'hashtags' => 30, 'images' => 10, 'video' => 1],
        ];
    }

    protected function twitterPreview(Publication $publication): array
    {
        return [
            'platform' => 'twitter',
            'text' => $this->truncateText($publication->body, 280),
            'hashtags' => $this->formatHashtags($publication->hashtags),
            'media' => $this->getMediaPreviews($publication, 'twitter'),
            'limits' => ['text' => 280, 'images' => 4, 'video' => 1],
        ];
    }

    protected function linkedinPreview(Publication $publication): array
    {
        return [
            'platform' => 'linkedin',
            'text' => $this->truncateText($publication->body, 3000),
            'hashtags' => $this->formatHashtags($publication->hashtags),
            'media' => $this->getMediaPreviews($publication, 'linkedin'),
            'limits' => ['text' => 3000, 'images' => 9, 'video' => 1],
        ];
    }

    protected function tiktokPreview(Publication $publication): array
    {
        return [
            'platform' => 'tiktok',
            'text' => $this->truncateText($publication->body, 2200),
            'hashtags' => $this->formatHashtags($publication->hashtags),
            'media' => $this->getMediaPreviews($publication, 'tiktok'),
            'limits' => ['text' => 2200, 'video' => 1],
        ];
    }

    protected function genericPreview(Publication $publication): array
    {
        return [
            'platform' => 'generic',
            'text' => $publication->body,
            'hashtags' => $this->formatHashtags($publication->hashtags),
            'media' => $this->getMediaPreviews($publication, 'generic'),
        ];
    }

    protected function truncateText(?string $text, int $limit): string
    {
        if (!$text || strlen($text) <= $limit) {
            return $text ?? '';
        }
        return substr($text, 0, $limit - 3) . '...';
    }

    protected function formatHashtags($hashtags, ?int $limit = null): array
    {
        if (!$hashtags) {
            return [];
        }

        $tags = is_array($hashtags) ? $hashtags : explode(' ', $hashtags);
        $tags = array_filter($tags);

        if ($limit) {
            $tags = array_slice($tags, 0, $limit);
        }

        return array_map(fn($tag) => str_starts_with($tag, '#') ? $tag : "#{$tag}", $tags);
    }

    protected function getMediaPreviews(Publication $publication, string $platform): array
    {
        return $publication->mediaFiles->map(function ($media) use ($platform) {
            return [
                'id' => $media->id,
                'type' => $media->type,
                'url' => $media->url,
                'thumbnail' => $media->thumbnail_url,
                'compatible' => $this->isMediaCompatible($media, $platform),
            ];
        })->toArray();
    }

    protected function isMediaCompatible($media, string $platform): bool
    {
        $compatibility = [
            'facebook' => ['image', 'video'],
            'instagram' => ['image', 'video'],
            'twitter' => ['image', 'video', 'gif'],
            'linkedin' => ['image', 'video'],
            'tiktok' => ['video'],
        ];

        return in_array($media->type, $compatibility[$platform] ?? []);
    }
}

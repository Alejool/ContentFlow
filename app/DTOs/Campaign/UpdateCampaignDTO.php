<?php

namespace App\DTOs\Campaign;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Typed input for CampaignCrudService::update().
 *
 * Only keys present in the request are applied, so the DTO carries the
 * raw validated payload for a partial update plus decoded convenience fields.
 */
class UpdateCampaignDTO
{
    public function __construct(
        public readonly array $attributes,
        public readonly ?string $name,
        public readonly ?array $publicationIds,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            attributes: $data,
            name: $data['name'] ?? null,
            publicationIds: array_key_exists('publication_ids', $data) ? ($data['publication_ids'] ?? []) : null,
        );
    }

    public static function fromRequest(FormRequest $request): self
    {
        return self::fromArray($request->validated());
    }

    public function hasPublicationIds(): bool
    {
        return $this->publicationIds !== null;
    }
}

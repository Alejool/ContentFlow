<?php

namespace App\DTOs\Campaign;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Typed input for CampaignCrudService::create().
 */
class CreateCampaignDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $description = null,
        public readonly string $status = 'active',
        public readonly ?string $startDate = null,
        public readonly ?string $endDate = null,
        public readonly ?string $goal = null,
        public readonly int|float|null $budget = null,
        public readonly array $publicationIds = [],
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            description: $data['description'] ?? null,
            status: $data['status'] ?? 'active',
            startDate: $data['start_date'] ?? null,
            endDate: $data['end_date'] ?? null,
            goal: $data['goal'] ?? null,
            budget: $data['budget'] ?? null,
            publicationIds: $data['publication_ids'] ?? [],
        );
    }

    public static function fromRequest(FormRequest $request): self
    {
        return self::fromArray($request->validated());
    }

    /**
     * Attributes for Campaign::create() (workspace_id/user_id set by the service).
     */
    public function toAttributes(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'start_date' => $this->startDate,
            'end_date' => $this->endDate,
            'goal' => $this->goal,
            'budget' => $this->budget,
        ];
    }
}

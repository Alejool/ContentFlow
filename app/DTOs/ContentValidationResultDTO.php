<?php

namespace App\DTOs;

class ContentValidationResultDTO
{
    public function __construct(
        public bool $isValid,
        public array $errors = [],
        public array $warnings = [],
        public array $recommendations = [],
        public ?string $detectedType = null,
        public array $platformResults = [],
        public ?array $mediaInfo = null
    ) {}

    public function toArray(): array
    {
        return [
            'is_valid' => $this->isValid,
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'recommendations' => $this->recommendations,
            'detected_type' => $this->detectedType,
            'platform_results' => $this->platformResults,
            'media_info' => $this->mediaInfo,
        ];
    }

    public function hasErrors(): bool
    {
        return !empty($this->errors);
    }

    public function hasWarnings(): bool
    {
        return !empty($this->warnings);
    }

    public function hasRecommendations(): bool
    {
        return !empty($this->recommendations);
    }

    public function getCompatiblePlatforms(): array
    {
        return array_filter($this->platformResults, fn($result) => $result['is_compatible']);
    }

    public function getIncompatiblePlatforms(): array
    {
        return array_filter($this->platformResults, fn($result) => !$result['is_compatible']);
    }
}

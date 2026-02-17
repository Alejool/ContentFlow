<?php

namespace App\DTOs;

class PlatformValidationResultDTO
{
    public function __construct(
        public string $platform,
        public bool $isCompatible,
        public array $errors = [],
        public array $warnings = [],
        public ?string $recommendedType = null,
        public ?string $message = null
    ) {}

    public function toArray(): array
    {
        return [
            'platform' => $this->platform,
            'is_compatible' => $this->isCompatible,
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'recommended_type' => $this->recommendedType,
            'message' => $this->message,
        ];
    }
}

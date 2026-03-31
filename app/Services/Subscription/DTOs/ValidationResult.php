<?php

namespace App\Services\Subscription\DTOs;

use Carbon\Carbon;

readonly class ValidationResult
{
    public function __construct(
        public bool $isValid,
        public bool $requiresDowngrade,
        public ?string $reason,
        public ?Carbon $gracePeriodEndsAt,
        public bool $hasError = false,
        public ?string $errorMessage = null,
    ) {}
}

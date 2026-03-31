<?php

namespace App\Services\Subscription\DTOs;

readonly class RenewalResult
{
    public function __construct(
        public bool $success,
        public ?string $gateway,
        public ?string $errorMessage,
    ) {}
}

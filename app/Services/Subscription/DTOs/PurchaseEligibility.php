<?php

namespace App\Services\Subscription\DTOs;

readonly class PurchaseEligibility
{
    public function __construct(
        public bool $canPurchase,
        public ?string $reason,
        public ?string $errorCode,
    ) {}
}

<?php

namespace App\DTOs;

class SanitizationResult
{
    public function __construct(
        public string $content,
        public bool $wasModified
    ) {}
}

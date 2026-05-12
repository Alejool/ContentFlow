<?php

namespace App\DTOs\Content;

class SanitizationResult
{
    public function __construct(
        public string $content,
        public bool $wasModified
    ) {}
}

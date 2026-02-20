<?php

namespace App\Services;

class ValidationResult
{
    public function __construct(
        public bool $success,
        public ?string $message = null,
        public ?string $detectedMimeType = null
    ) {}
    
    public static function success(string $mimeType): self
    {
        return new self(true, null, $mimeType);
    }
    
    public static function failed(string $message): self
    {
        return new self(false, $message);
    }
}

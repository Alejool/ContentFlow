<?php

namespace App\DTOs;

class PlatformConfigurationDTO
{
    public function __construct(
        public int $accountId,
        public string $platform,
        public string $accountName,
        public string $type, // 'reel', 'feed', 'short', 'standard', 'story'
        public bool $isCompatible,
        public array $appliedSettings = [],
        public ?string $thumbnailUrl = null,
        public array $quality = [],
        public array $format = [],
        public bool $canChangeType = true,
        public array $availableTypes = [],
        public ?string $incompatibilityReason = null,
        public ?string $suggestion = null,
        public array $warnings = []
    ) {}

    public function toArray(): array
    {
        return [
            'account_id' => $this->accountId,
            'platform' => $this->platform,
            'account_name' => $this->accountName,
            'type' => $this->type,
            'is_compatible' => $this->isCompatible,
            'applied_settings' => $this->appliedSettings,
            'thumbnail_url' => $this->thumbnailUrl,
            'quality' => $this->quality,
            'format' => $this->format,
            'can_change_type' => $this->canChangeType,
            'available_types' => $this->availableTypes,
            'incompatibility_reason' => $this->incompatibilityReason,
            'suggestion' => $this->suggestion,
            'warnings' => $this->warnings,
        ];
    }

    public static function fromValidationResult(
        int $accountId,
        string $platform,
        string $accountName,
        array $validationResult,
        array $mediaInfo,
        ?string $detectedType
    ): self {
        $isCompatible = $validationResult['is_compatible'] ?? false;
        $type = $detectedType ?? 'standard';
        
        // Determinar tipos disponibles según plataforma
        $availableTypes = self::getAvailableTypes($platform, $mediaInfo);
        
        // Determinar si se puede cambiar el tipo
        $canChangeType = count($availableTypes) > 1;

        return new self(
            accountId: $accountId,
            platform: $platform,
            accountName: $accountName,
            type: $type,
            isCompatible: $isCompatible,
            appliedSettings: [],
            thumbnailUrl: null,
            quality: self::buildQualityInfo($mediaInfo),
            format: self::buildFormatInfo($mediaInfo),
            canChangeType: $canChangeType,
            availableTypes: $availableTypes,
            incompatibilityReason: !empty($validationResult['errors']) ? implode(', ', $validationResult['errors']) : null,
            suggestion: $validationResult['recommended_type'] ?? null,
            warnings: $validationResult['warnings'] ?? []
        );
    }

    protected static function getAvailableTypes(string $platform, array $mediaInfo): array
    {
        if ($mediaInfo['type'] !== 'video') {
            return ['feed'];
        }

        return match($platform) {
            'instagram' => ['feed', 'reel', 'story'],
            'facebook' => ['feed', 'reel', 'story'],
            'youtube' => ['standard', 'short'],
            'tiktok' => ['video'],
            'twitter' => ['tweet'],
            'linkedin' => ['post'],
            default => ['standard'],
        };
    }

    protected static function buildQualityInfo(array $mediaInfo): array
    {
        return [
            'resolution' => isset($mediaInfo['width'], $mediaInfo['height']) 
                ? "{$mediaInfo['width']}x{$mediaInfo['height']}" 
                : 'Unknown',
            'aspect_ratio' => $mediaInfo['aspect_ratio'] ?? 'Unknown',
            'duration' => $mediaInfo['duration'] ?? null,
            'size_mb' => isset($mediaInfo['size']) 
                ? round($mediaInfo['size'] / (1024 * 1024), 2) 
                : null,
        ];
    }

    protected static function buildFormatInfo(array $mediaInfo): array
    {
        return [
            'extension' => strtoupper($mediaInfo['extension'] ?? 'Unknown'),
            'mime_type' => $mediaInfo['mime_type'] ?? 'Unknown',
            'type' => $mediaInfo['type'] ?? 'Unknown',
        ];
    }
}

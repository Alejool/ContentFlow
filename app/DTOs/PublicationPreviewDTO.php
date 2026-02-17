<?php

namespace App\DTOs;

class PublicationPreviewDTO
{
    public function __construct(
        public int $publicationId,
        public array $platformConfigurations = [], // PlatformConfigurationDTO[]
        public array $mediaInfo = [],
        public bool $allCompatible = true,
        public array $globalWarnings = [],
        public array $optimizationSuggestions = [],
        public ?string $mainThumbnail = null,
        public ?string $detectedType = null
    ) {}

    public function toArray(): array
    {
        return [
            'publication_id' => $this->publicationId,
            'platform_configurations' => array_map(
                fn($config) => $config instanceof PlatformConfigurationDTO ? $config->toArray() : $config,
                $this->platformConfigurations
            ),
            'media_info' => $this->mediaInfo,
            'all_compatible' => $this->allCompatible,
            'global_warnings' => $this->globalWarnings,
            'optimization_suggestions' => $this->optimizationSuggestions,
            'main_thumbnail' => $this->mainThumbnail,
            'detected_type' => $this->detectedType,
        ];
    }

    public function addPlatformConfiguration(PlatformConfigurationDTO $config): void
    {
        $this->platformConfigurations[] = $config;
        
        if (!$config->isCompatible) {
            $this->allCompatible = false;
        }
    }

    public function getCompatiblePlatforms(): array
    {
        return array_filter(
            $this->platformConfigurations,
            fn($config) => $config instanceof PlatformConfigurationDTO && $config->isCompatible
        );
    }

    public function getIncompatiblePlatforms(): array
    {
        return array_filter(
            $this->platformConfigurations,
            fn($config) => $config instanceof PlatformConfigurationDTO && !$config->isCompatible
        );
    }

    public function hasWarnings(): bool
    {
        if (!empty($this->globalWarnings)) {
            return true;
        }

        foreach ($this->platformConfigurations as $config) {
            if ($config instanceof PlatformConfigurationDTO && !empty($config->warnings)) {
                return true;
            }
        }

        return false;
    }
}

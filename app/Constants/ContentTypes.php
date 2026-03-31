<?php

namespace App\Constants;

class ContentTypes
{
    /**
     * Tipos de contenido disponibles
     */
    public const POST = 'post';
    public const REEL = 'reel';
    public const STORY = 'story';
    public const CAROUSEL = 'carousel';
    public const POLL = 'poll';

    /**
     * Plataformas compatibles por tipo de contenido
     * IMPORTANTE: Debe coincidir con resources/js/Constants/contentTypes.ts
     */
    public const POST_COMPATIBLE_PLATFORMS = ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest', 'tiktok'];
    public const REEL_COMPATIBLE_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook'];
    public const STORY_COMPATIBLE_PLATFORMS = ['instagram', 'facebook', 'pinterest'];
    public const CAROUSEL_COMPATIBLE_PLATFORMS = ['instagram', 'facebook', 'twitter'];
    public const POLL_COMPATIBLE_PLATFORMS = ['twitter'];

    /**
     * Obtener todas las plataformas compatibles con un tipo de contenido
     * 
     * @param string $contentType El tipo de contenido (post, reel, story, carousel, poll)
     * @return array Lista de plataformas compatibles
     */
    public static function getCompatiblePlatforms(string $contentType): array
    {
        return match ($contentType) {
            self::POST => self::POST_COMPATIBLE_PLATFORMS,
            self::REEL => self::REEL_COMPATIBLE_PLATFORMS,
            self::STORY => self::STORY_COMPATIBLE_PLATFORMS,
            self::CAROUSEL => self::CAROUSEL_COMPATIBLE_PLATFORMS,
            self::POLL => self::POLL_COMPATIBLE_PLATFORMS,
            default => []
        };
    }

    /**
     * Verificar si una plataforma es compatible con un tipo de contenido
     * 
     * @param string $platform Nombre de la plataforma (instagram, twitter, etc.)
     * @param string $contentType Tipo de contenido (post, reel, story, carousel, poll)
     * @return bool True si la plataforma soporta el tipo de contenido
     */
    public static function isPlatformCompatible(string $platform, string $contentType): bool
    {
        $compatiblePlatforms = self::getCompatiblePlatforms($contentType);
        return in_array(strtolower($platform), $compatiblePlatforms, true);
    }

    /**
     * Obtener los tipos de contenido soportados por una plataforma
     * 
     * @param string $platform Nombre de la plataforma
     * @return array Lista de tipos de contenido soportados
     */
    public static function getSupportedContentTypes(string $platform): array
    {
        $platform = strtolower($platform);
        $supportedTypes = [];

        foreach ([self::POST, self::REEL, self::STORY, self::CAROUSEL, self::POLL] as $contentType) {
            if (self::isPlatformCompatible($platform, $contentType)) {
                $supportedTypes[] = $contentType;
            }
        }

        return $supportedTypes;
    }
}
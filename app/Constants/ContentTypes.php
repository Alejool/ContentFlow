<?php

namespace App\Constants;

class ContentTypes
{
    /**
     * Plataformas compatibles con reels/shorts
     */
    public const REEL_COMPATIBLE_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook'];

    /**
     * Tipos de contenido disponibles
     */
    public const POST = 'post';
    public const REEL = 'reel';
    public const STORY = 'story';
    public const CAROUSEL = 'carousel';
    public const POLL = 'poll';

    /**
     * Obtener todas las plataformas compatibles con un tipo de contenido
     */
    public static function getCompatiblePlatforms(string $contentType): array
    {
        return match ($contentType) {
            self::REEL => self::REEL_COMPATIBLE_PLATFORMS,
            default => []
        };
    }
}
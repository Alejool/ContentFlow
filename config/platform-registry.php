<?php

/**
 * Configuración Centralizada de Plataformas Sociales - FASE 1
 * 
 * FUENTE ÚNICA DE VERDAD para todas las configuraciones de redes sociales.
 * Todos los módulos (backend y frontend) deben consumir esta configuración.
 * 
 * Estructura:
 * - Platform Registry: Define todas las plataformas
 * - Content Types: Tipos de contenido por plataforma
 * - Media Specifications: Límites técnicos
 * - Publishing Rules: Reglas específicas
 * - Capabilities: Por rol/plan
 * - API Limits: Rate limiting
 * - Feature Flags: Funcionalidades
 */

return [
    'version' => '1.0.0',
    'last_updated' => '2026-05-25',
    
    /*
    |--------------------------------------------------------------------------
    | REGISTRY: Definición de Plataformas
    |--------------------------------------------------------------------------
    */
    'platforms' => [
        'facebook' => [
            'id' => 1,
            'key' => 'facebook',
            'name' => 'Facebook',
            'active' => true,
            'provider' => 'meta',
            'color' => 'bg-blue-600',
            'priority' => 100,
        ],
        'instagram' => [
            'id' => 2,
            'key' => 'instagram',
            'name' => 'Instagram',
            'active' => true,
            'provider' => 'meta',
            'color' => 'bg-pink-600',
            'priority' => 100,
        ],
        'threads' => [
            'id' => 3,
            'key' => 'threads',
            'name' => 'Threads',
            'active' => false,
            'provider' => 'meta',
            'color' => 'bg-gray-900',
            'priority' => 50,
        ],
        'youtube' => [
            'id' => 4,
            'key' => 'youtube',
            'name' => 'YouTube',
            'active' => true,
            'provider' => 'google',
            'color' => 'bg-red-600',
            'priority' => 100,
        ],
        'twitter' => [
            'id' => 5,
            'key' => 'twitter',
            'name' => 'X (Twitter)',
            'active' => true,
            'provider' => 'elon',
            'color' => 'bg-gray-900',
            'priority' => 100,
        ],
        'linkedin' => [
            'id' => 6,
            'key' => 'linkedin',
            'name' => 'LinkedIn',
            'active' => false,
            'provider' => 'linkedin',
            'color' => 'bg-blue-700',
            'priority' => 75,
        ],
        'tiktok' => [
            'id' => 7,
            'key' => 'tiktok',
            'name' => 'TikTok',
            'active' => true,
            'provider' => 'bytedance',
            'color' => 'bg-black',
            'priority' => 100,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | CONTENT TYPES: Tipos de contenido permitidos
    |--------------------------------------------------------------------------
    */
    'content_types' => [
        'post' => [
            'label' => 'Post',
            'description' => 'Publicación estándar con texto, imágenes o videos',
            'platforms' => ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'],
            'media_required' => false,
            'media_min' => 0,
            'media_max' => 10,
            'media_types' => ['image', 'video'],
        ],
        'reel' => [
            'label' => 'Reel / Short',
            'description' => 'Video corto vertical (90s máximo)',
            'platforms' => ['facebook', 'instagram', 'youtube', 'tiktok'],
            'media_required' => true,
            'media_min' => 1,
            'media_max' => 1,
            'media_types' => ['video'],
        ],
        'story' => [
            'label' => 'Story',
            'description' => 'Historia efímera (desaparece en 24 horas)',
            'platforms' => ['facebook', 'instagram'],
            'media_required' => true,
            'media_min' => 1,
            'media_max' => 1,
            'media_types' => ['image', 'video'],
        ],
        'carousel' => [
            'label' => 'Carrusel',
            'description' => 'Múltiples imágenes o videos en secuencia',
            'platforms' => ['facebook', 'instagram', 'twitter', 'linkedin'],
            'media_required' => true,
            'media_min' => 2,
            'media_max' => 10,
            'media_types' => ['image', 'video'],
        ],
        'poll' => [
            'label' => 'Encuesta',
            'description' => 'Encuesta con opciones de votación',
            'platforms' => ['twitter', 'facebook', 'linkedin'],
            'media_required' => false,
            'media_min' => 0,
            'media_max' => 4,
            'media_types' => ['image'],
        ],
        'community' => [
            'label' => 'Comunidad',
            'description' => 'Publicación en sección de comunidad (YouTube)',
            'platforms' => ['youtube'],
            'media_required' => false,
            'media_min' => 0,
            'media_max' => 10,
            'media_types' => ['image', 'video', 'poll'],
        ],
        'thread' => [
            'label' => 'Hilo',
            'description' => 'Múltiples posts conectados en secuencia',
            'platforms' => ['twitter', 'threads'],
            'media_required' => false,
            'media_min' => 0,
            'media_max' => 25,
            'media_types' => ['image', 'video'],
        ],
    ],
];

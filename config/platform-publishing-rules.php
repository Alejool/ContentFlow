<?php

/**
 * Reglas de Publicación por Plataforma
 * 
 * Define restricciones y reglas específicas de cada plataforma:
 * - Combinaciones de medios permitidas
 * - Requisitos de verificación
 * - Restricciones por tipo de contenido
 * - Límites de texto
 * - Restricciones de hashtags
 * - URLs permitidas
 * - Contenido prohibido
 */

return [
    'facebook' => [
        'text' => [
            'max_length' => 63206,
            'min_length' => 1,
            'hashtags_allowed' => true,
            'mentions_allowed' => true,
            'urls_allowed' => true,
        ],
        'media' => [
            'multiple_videos_allowed' => true,
            'multiple_images_allowed' => true,
            'mixed_media_allowed' => true,
            'max_images_per_post' => 10,
            'max_videos_per_post' => 10,
        ],
        'restrictions' => [
            'requires_verification' => false,
            'min_account_age_days' => 0,
            'cooldown_seconds' => 0,
        ],
    ],

    'instagram' => [
        'text' => [
            'max_length' => 2200,
            'min_length' => 1,
            'hashtags_allowed' => true,
            'max_hashtags' => 30,
            'mentions_allowed' => true,
            'urls_allowed' => false, // Solo en bio
        ],
        'media' => [
            'multiple_videos_allowed' => false,
            'multiple_images_allowed' => true,
            'mixed_media_allowed' => false,
            'max_images_per_carousel' => 10,
            'max_images_per_post' => 1, // Para post individual
        ],
        'restrictions' => [
            'requires_verification' => false,
            'min_account_age_days' => 0,
            'cooldown_seconds' => 0,
        ],
        'content_type_rules' => [
            'reel' => [
                'media_required' => true,
                'multiple_videos_allowed' => false,
                'text_required' => false,
            ],
            'story' => [
                'media_required' => true,
                'max_duration_seconds' => 60,
            ],
            'carousel' => [
                'min_items' => 2,
                'max_items' => 10,
            ],
        ],
    ],

    'youtube' => [
        'text' => [
            'title_max_length' => 100,
            'description_max_length' => 5000,
            'hashtags_allowed' => true,
            'mentions_allowed' => true,
            'urls_allowed' => true,
        ],
        'media' => [
            'multiple_videos_allowed' => false,
            'video_required' => true,
            'thumbnail_required' => false, // Auto-generated si no se proporciona
        ],
        'restrictions' => [
            'requires_verification' => false,
            'min_account_age_days' => 0,
            'requires_phone_verification_for_long_videos' => true,
            'unverified_max_duration_seconds' => 900, // 15 minutos
            'verified_max_duration_seconds' => 43200, // 12 horas
        ],
        'content_type_rules' => [
            'standard' => [
                'min_duration_seconds' => 30,
                'recommended_duration_seconds' => 600, // 10 minutos
            ],
            'short' => [
                'max_duration_seconds' => 60,
                'aspect_ratio' => '9:16',
            ],
        ],
    ],

    'twitter' => [
        'text' => [
            'max_length' => 280,
            'min_length' => 1,
            'hashtags_allowed' => true,
            'mentions_allowed' => true,
            'urls_allowed' => true,
            'urls_count_as_characters' => 23, // Los URLs se cuentan como 23 caracteres
        ],
        'media' => [
            'multiple_videos_allowed' => false,
            'multiple_images_allowed' => true,
            'mixed_media_allowed' => false, // No puedes mezclar videos e imágenes
            'max_images_per_post' => 4,
            'video_and_images_forbidden' => true,
        ],
        'restrictions' => [
            'requires_verification' => false, // Para videos largos sí
            'min_account_age_days' => 0,
            'unverified_max_video_duration' => 140, // 2:20
            'verified_max_video_duration' => 7200, // 2 horas
            'premium_max_video_duration' => 7200, // 2 horas (mismo que verified)
        ],
        'content_type_rules' => [
            'thread' => [
                'min_posts' => 2,
                'max_posts' => 25,
                'sequential' => true,
            ],
            'poll' => [
                'min_options' => 2,
                'max_options' => 4,
                'poll_duration_hours_options' => [1, 6, 12, 24],
            ],
        ],
    ],

    'tiktok' => [
        'text' => [
            'caption_max_length' => 2200,
            'caption_required' => false,
            'hashtags_allowed' => true,
            'max_hashtags' => 150, // TikTok es muy permisivo
            'mentions_allowed' => true,
            'urls_allowed' => false, // En caption no, solo en bio
        ],
        'media' => [
            'video_required' => true,
            'multiple_videos_allowed' => false,
            'images_allowed' => false,
        ],
        'restrictions' => [
            'requires_verification' => false,
            'min_account_age_days' => 0,
            'cooldown_seconds' => 0,
        ],
        'content_type_rules' => [
            'post' => [
                'min_duration_seconds' => 3,
                'max_duration_seconds' => 600, // 10 minutos
                'aspect_ratio' => '9:16',
            ],
        ],
        'features' => [
            'supports_duets' => true,
            'supports_stitches' => true,
            'supports_sounds' => true,
            'supports_effects' => true,
        ],
    ],

    'linkedin' => [
        'text' => [
            'max_length' => 3000,
            'min_length' => 1,
            'hashtags_allowed' => true,
            'mentions_allowed' => true,
            'urls_allowed' => true,
        ],
        'media' => [
            'multiple_videos_allowed' => false,
            'multiple_images_allowed' => true,
            'mixed_media_allowed' => false,
            'max_images_per_post' => 10,
        ],
        'restrictions' => [
            'requires_verification' => false,
            'min_account_age_days' => 0,
            'professional_content_recommended' => true,
        ],
    ],

    'threads' => [
        'text' => [
            'max_length' => 500,
            'min_length' => 1,
            'hashtags_allowed' => true,
            'mentions_allowed' => true,
            'urls_allowed' => true,
        ],
        'media' => [
            'images_allowed' => true,
            'videos_allowed' => true,
            'multiple_images_allowed' => true,
            'max_images_per_post' => 10,
        ],
        'restrictions' => [
            'requires_verification' => false,
            'min_account_age_days' => 0,
        ],
    ],

    // Reglas globales
    'global' => [
        'content_prohibited' => [
            'hate_speech' => true,
            'violence' => true,
            'misinformation' => true,
            'spam' => true,
            'adult_content' => 'depends_on_platform', // Algunos permiten, otros no
        ],
        'restricted_by_all_platforms' => [
            'illegal_content' => true,
            'child_exploitation' => true,
            'copyright_infringement' => true,
            'terms_of_service_violation' => true,
        ],
    ],
];

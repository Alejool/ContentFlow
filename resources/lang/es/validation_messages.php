<?php

return [
    'errors' => [
        'format_not_supported' => 'Formato no compatible: :format (requerido: :required)',
        'size_exceeded' => 'Tamaño excedido: :size MB (máximo: :max MB)',
        'duration_exceeded' => 'Duración excedida: :duration (máximo: :max)',
        'duration_too_short' => 'Duración muy corta: :duration (mínimo: :min)',
        'width_too_small' => 'Ancho mínimo: :width px (requerido: :min px)',
        'width_too_large' => 'Ancho excedido: :width px (máximo: :max px)',
        'height_too_small' => 'Alto mínimo: :height px (requerido: :min px)',
        'height_too_large' => 'Alto excedido: :height px (máximo: :max px)',
        'aspect_ratio_invalid' => 'Relación de aspecto no compatible: :ratio (requerido: :required)',
        'platform_not_configured' => 'Plataforma no configurada',
        'content_type_not_supported' => 'Tipo de contenido ":type" no soportado',
        'file_not_found' => 'No se pudo encontrar el archivo',
        'analysis_failed' => 'No se pudo analizar el archivo multimedia',
    ],

    'warnings' => [
        'duration_not_optimal' => 'Duración: :duration (recomendado: :recommended para mejor alcance)',
        'aspect_ratio_not_optimal' => 'Relación de aspecto: :ratio (recomendado: :recommended)',
        'resolution_not_optimal' => 'Resolución: :resolution (recomendado: :recommended)',
        'size_large' => 'Archivo grande: :size MB (considera optimizar)',
        'format_alternative' => 'Formato :format funciona, pero :recommended es más compatible',
    ],

    'recommendations' => [
        'ideal_for_platforms' => 'Este contenido es ideal para: :platforms',
        'better_as_reel' => 'Formato vertical perfecto para Reels/Shorts',
        'better_as_standard' => 'Formato horizontal óptimo para video estándar',
        'consider_trimming' => 'Considera recortar a :duration para mejor alcance en :platform',
        'consider_cropping' => 'Considera ajustar a :ratio para :platform',
        'optimize_for_mobile' => 'Contenido optimizado para visualización móvil',
        'optimize_for_desktop' => 'Contenido optimizado para visualización en escritorio',
    ],

    'types' => [
        'reel' => 'Reel',
        'short' => 'Short',
        'standard' => 'Video estándar',
        'feed' => 'Feed',
        'story' => 'Historia',
    ],

    'platforms' => [
        'facebook' => 'Facebook',
        'instagram' => 'Instagram',
        'tiktok' => 'TikTok',
        'youtube' => 'YouTube',
        'twitter' => 'Twitter',
        'linkedin' => 'LinkedIn',
    ],

    'summary' => [
        'ready_to_publish' => 'Listo para publicar',
        'compatible_with' => 'Compatible con :platforms',
        'not_compatible_with' => 'No compatible con :platforms',
        'has_warnings' => 'Compatible con advertencias',
        'validation_complete' => 'Validación completada',
        'no_media_attached' => 'No hay archivos multimedia adjuntos',
    ],

    'media_info' => [
        'format' => 'Formato',
        'duration' => 'Duración',
        'resolution' => 'Resolución',
        'aspect_ratio' => 'Relación de aspecto',
        'size' => 'Tamaño',
        'fps' => 'FPS',
        'bitrate' => 'Bitrate',
    ],
];

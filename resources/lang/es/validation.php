<?php

return [
    // Existing validation messages...
    
    // Publishing validation messages
    'content_type_not_supported' => 'El tipo de contenido ":type" no es compatible con :platform. Tipos soportados: :supported',
    'polls_not_supported_youtube' => 'Las encuestas no son compatibles con YouTube. Selecciona Twitter o Facebook para encuestas.',
    'poll_minimum_options' => 'Las encuestas requieren al menos 2 opciones.',
    'poll_maximum_options' => 'Las encuestas pueden tener máximo 4 opciones.',
    'poll_duration_twitter' => 'La duración de la encuesta en Twitter debe estar entre 5 minutos y 7 días. Duración actual: :duration horas.',
    'youtube_requires_video' => 'YouTube requiere archivos de video. No se pueden publicar imágenes.',
    'tiktok_requires_video' => 'TikTok requiere archivos de video. No se pueden publicar imágenes.',
    'poll_recommendation' => 'Las encuestas funcionan mejor en: :platforms',
    'reel_recommendation' => 'Los reels/videos cortos son ideales para: :platforms',
    
    // Carousel validation messages
    'carousel_min_media' => 'El contenido de carrusel requiere al menos 2 archivos multimedia.',
    'instagram_carousel_max_media' => 'Los carruseles de Instagram no pueden tener más de 10 archivos multimedia. Cantidad actual: :count.',
    'instagram_carousel_mixed_media' => 'Los carruseles de Instagram con imágenes y videos mezclados pueden no mostrarse de manera óptima.',
    'facebook_carousel_max_media' => 'Los carruseles de Facebook no pueden tener más de 10 archivos multimedia. Cantidad actual: :count.',
    'facebook_carousel_mixed_media' => 'Facebook no permite mezclar imágenes y videos en el mismo carrusel. Por favor usa solo imágenes o solo videos.',
    'linkedin_carousel_max_media' => 'Los carruseles de LinkedIn no pueden tener más de 9 archivos multimedia. Cantidad actual: :count.',
    'twitter_carousel_mixed_media' => 'Twitter/X no permite combinar videos e imágenes en la misma publicación.',
];
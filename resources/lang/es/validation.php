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
];
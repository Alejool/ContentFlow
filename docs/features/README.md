# Documentación de Funcionalidades

Guías de características específicas del sistema ContentFlow.

## Funcionalidades Documentadas

- **REEL_GENERATOR.md** - Generador automático de Reels
- **SUBSCRIPTION_SYSTEM.md** - Sistema de suscripciones y planes

## Generador de Reels

Sistema para generar videos cortos optimizados para redes sociales.

### Características
- Generación automática de reels
- Optimización para Instagram, TikTok y YouTube Shorts
- Procesamiento con FFmpeg
- Efectos y filtros personalizables

### Uso Básico
```php
use App\Services\ReelGeneratorService;

$reelService = app(ReelGeneratorService::class);
$reel = $reelService->generate($video, [
    'platform' => 'instagram',
    'duration' => 60
]);
```

## Sistema de Suscripciones

Gestión de planes, límites y facturación con Stripe.

### Características
- Múltiples planes de suscripción
- Límites por funcionalidad
- Integración con Stripe
- Portal de facturación
- Períodos de prueba

### Verificar Límites
```php
use App\Services\SubscriptionService;

$canPublish = auth()->user()->can('publish-content');
$hasReachedLimit = auth()->user()->hasReachedLimit('publications');
```

Ver documentación individual de cada funcionalidad para más detalles.

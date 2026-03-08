# Optimización de Colas de Publicación

## Problema Resuelto

Cuando muchos usuarios publican videos grandes simultáneamente, se formaban colas largas y algunos usuarios esperaban mucho tiempo.

## Soluciones Implementadas

### 1. **Múltiples Supervisores de Horizon**

Ahora tenemos 3 supervisores separados en lugar de 1:

- **`publishing-heavy`**: Dedicado a publicaciones de videos
  - Producción: hasta 8 workers simultáneos
  - Local: hasta 2 workers
  - Timeout: 35 minutos

- **`notifications-fast`**: Para notificaciones y emails
  - Producción: hasta 15 workers
  - Local: hasta 3 workers
  - Timeout: 1 minuto

- **`general`**: Para tareas generales
  - Producción: hasta 8 workers
  - Local: hasta 2 workers
  - Timeout: 5 minutos

### 2. **Rate Limiting por Workspace**

Implementado en `app/Jobs/Middleware/RateLimitPublishing.php`:
- Máximo 3 publicaciones simultáneas por workspace
- Si se alcanza el límite, el job se libera y se reintenta en 30 segundos
- Evita que un workspace acapare todos los workers

### 3. **Priorización por Tamaño de Archivo**

Implementado en `PublishPublicationAction`:
- Archivos < 50MB: Prioridad alta (se procesan primero)
- Archivos 50-200MB: Prioridad normal
- Archivos > 200MB: Prioridad baja

### 4. **Notificaciones de Posición en Cola**

Nueva notificación `PublicationQueuedNotification`:
- Informa al usuario su posición en la cola
- Muestra tiempo estimado de espera
- Solo se envía si hay cola (no molesta cuando no hay espera)

### 5. **Prevención de Reintentos Duplicados**

Modificaciones en `PublishToSocialMedia` y `PlatformPublishService`:
- Verifica si una plataforma ya fue publicada exitosamente
- No reintenta plataformas que ya tuvieron éxito
- Solo reintenta las plataformas que fallaron

### 6. **Monitoreo de Cola**

Nuevo comando `php artisan queue:monitor-publishing`:
- Muestra el tamaño actual de la cola
- Alerta si hay más de 20 jobs esperando
- Alerta crítica si hay más de 50 jobs
- Muestra estadísticas de workers activos

## Configuración Recomendada

### Variables de Entorno

```env
# Horizon
HORIZON_NAME="ContentFlow"
HORIZON_PATH=horizon

# Redis para colas
REDIS_QUEUE_CONNECTION=default
REDIS_QUEUE=default
REDIS_QUEUE_RETRY_AFTER=2100
```

### Escalar en Producción

Si necesitas más capacidad, ajusta en `config/horizon.php`:

```php
'production' => [
    'publishing-heavy' => [
        'maxProcesses' => 15, // Aumentar de 8 a 15
        'minProcesses' => 3,
    ],
    // ...
],
```

### Monitoreo Continuo

Agrega al cron (en `app/Console/Kernel.php`):

```php
$schedule->command('queue:monitor-publishing')
    ->everyFiveMinutes()
    ->withoutOverlapping();
```

## Comandos Útiles

```bash
# Ver el dashboard de Horizon
php artisan horizon

# Monitorear la cola manualmente
php artisan queue:monitor-publishing

# Ver jobs fallidos
php artisan horizon:failed

# Limpiar jobs completados antiguos
php artisan horizon:clear

# Reiniciar Horizon después de cambios
php artisan horizon:terminate
```

## Métricas a Monitorear

1. **Tamaño de la cola**: Debe estar < 20 normalmente
2. **Tiempo de espera promedio**: Debe estar < 10 minutos
3. **Tasa de éxito**: Debe estar > 95%
4. **Workers activos**: Deben escalar según la carga

## Troubleshooting

### Cola muy larga (> 50 jobs)

1. Verificar que Horizon esté corriendo: `php artisan horizon:status`
2. Aumentar `maxProcesses` temporalmente
3. Verificar logs: `tail -f storage/logs/laravel.log`

### Jobs atascados

1. Ver jobs en progreso: Horizon dashboard
2. Terminar jobs zombies: `php artisan horizon:terminate`
3. Reiniciar: `php artisan horizon`

### Rate limit muy restrictivo

Ajustar en `app/Jobs/Middleware/RateLimitPublishing.php`:

```php
$maxConcurrent = 5; // Aumentar de 3 a 5
```

## Próximas Mejoras

- [ ] Implementar cola de prioridad dinámica basada en suscripción del usuario
- [ ] Agregar métricas a Prometheus/Grafana
- [ ] Implementar auto-scaling de workers basado en carga
- [ ] Agregar notificaciones Slack para alertas de cola

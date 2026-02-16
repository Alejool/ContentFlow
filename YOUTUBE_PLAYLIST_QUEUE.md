# Sistema de Colas de YouTube Playlists

## Problema Resuelto
El sistema de playlists de YouTube no se estaba ejecutando porque:
1. El namespace del modelo estaba incorrecto en el comando
2. No había un worker de colas ejecutándose
3. El procesamiento no estaba optimizado con Jobs

## Cambios Realizados

### 1. Creado Job: `ProcessYouTubePlaylistItem`
- Procesa items de playlist de forma asíncrona
- Maneja reintentos automáticos (3 intentos)
- Backoff progresivo: 1min, 5min, 15min

### 2. Actualizado: `PlatformPublishService`
- Ahora despacha el Job en lugar de encolar comando
- Delay de 2 minutos después de publicar video

### 3. Simplificado: `ProcessYouTubePlaylistQueue`
- Solo despacha jobs pendientes
- No procesa directamente

## Cómo Ejecutar

### Opción 1: Worker de Colas (RECOMENDADO)
```bash
php artisan queue:work --queue=default --tries=3
```

### Opción 2: Comando Manual (para testing)
```bash
php artisan youtube:process-playlist-queue
```

### Opción 3: Scheduler (ya configurado)
El comando se ejecuta automáticamente cada 5 minutos si tienes el scheduler corriendo:
```bash
php artisan schedule:work
```

## Verificar Estado

### Ver items pendientes:
```sql
SELECT * FROM youtube_playlist_queue WHERE status = 'pending';
```

### Ver items fallidos:
```sql
SELECT * FROM youtube_playlist_queue WHERE status = 'failed';
```

### Ver logs:
```bash
tail -f storage/logs/laravel.log | grep -i playlist
```

## Flujo Completo

1. Usuario publica video a YouTube con campaña
2. Se crea registro en `youtube_playlist_queue` con status='pending'
3. Job `ProcessYouTubePlaylistItem` se despacha con delay de 2 minutos
4. Worker procesa el job:
   - Busca o crea la playlist
   - Agrega el video a la playlist
   - Marca como 'completed' o 'failed'
5. Si falla, reintenta automáticamente hasta 3 veces

## Troubleshooting

### Los videos no se agregan a playlists
1. Verificar que el worker esté corriendo: `ps aux | grep "queue:work"`
2. Verificar registros pendientes: `SELECT COUNT(*) FROM youtube_playlist_queue WHERE status='pending'`
3. Revisar logs de errores: `tail -f storage/logs/laravel.log`

### Worker no procesa jobs
1. Verificar configuración de colas en `.env`: `QUEUE_CONNECTION=database`
2. Ejecutar migraciones: `php artisan migrate`
3. Limpiar cache: `php artisan config:clear`

### Reprocesar items fallidos
```bash
php artisan tinker
>>> App\Models\Youtube\YouTubePlaylistQueue::where('status', 'failed')->update(['status' => 'pending', 'retry_count' => 0]);
>>> exit
php artisan youtube:process-playlist-queue
```

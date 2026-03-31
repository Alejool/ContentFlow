# Guía de Sistema de Logs

## 📋 Canales de Logs Disponibles

Los logs están organizados por contexto para facilitar la búsqueda:

- `laravel` - Log general de la aplicación
- `publications` - Todo relacionado con publicaciones
- `jobs` - Trabajos en segundo plano (queues)
- `auth` - Autenticación y seguridad
- `social` - Integraciones con redes sociales
- `errors` - Solo errores críticos

Cada canal guarda logs diarios con rotación automática (se mantienen 30-90 días según el canal).

## 🔧 Uso del Helper de Logs

### En tu código PHP:

```php
use App\Helpers\LogHelper;

// Logs de publicaciones
LogHelper::publicationInfo('Publicación creada', [
    'publication_id' => $publication->id,
    'title' => $publication->title
]);

LogHelper::publicationError('Error al publicar', [
    'publication_id' => $publication->id,
    'error' => $exception->getMessage()
]);

// Logs de jobs
LogHelper::jobInfo('Job iniciado', [
    'job_id' => $this->job->uuid(),
    'publication_id' => $this->publicationId
]);

// Logs de autenticación
LogHelper::auth('info', 'Usuario inició sesión', [
    'email' => $user->email
]);

// Logs de redes sociales
LogHelper::social('error', 'Error al conectar con Facebook', [
    'account_id' => $account->id
]);
```

### Contexto Automático

El helper agrega automáticamente:
- `user_id` - ID del usuario autenticado
- `user_email` - Email del usuario
- `workspace_id` - Workspace actual
- `ip` - Dirección IP
- `url` - URL de la petición
- `method` - Método HTTP
- `timestamp` - Fecha y hora ISO 8601

## 🔍 Buscar en Logs

### Comando básico:
```bash
php artisan logs:search "error"
```

### Buscar en canal específico:
```bash
php artisan logs:search "publication" --channel=publications
```

### Buscar por usuario:
```bash
php artisan logs:search "error" --user=123
```

### Buscar en fecha específica:
```bash
php artisan logs:search "failed" --channel=jobs --date=2024-02-21
```

### Buscar por nivel:
```bash
php artisan logs:search "timeout" --level=error --lines=100
```

### Combinación de filtros:
```bash
php artisan logs:search "publish" --channel=publications --user=5 --level=error --date=2024-02-21
```

## 📊 Ver Estadísticas

### Estadísticas del log actual:
```bash
php artisan logs:stats --channel=publications
```

### Estadísticas de fecha específica:
```bash
php artisan logs:stats --channel=jobs --date=2024-02-21
```

Muestra:
- Cantidad de logs por nivel (ERROR, WARNING, INFO, DEBUG)
- Usuarios únicos que aparecen en los logs
- Publicaciones únicas mencionadas
- Tamaño del archivo

## 📁 Ubicación de Logs

Los archivos se guardan en `storage/logs/`:

```
storage/logs/
├── laravel-2024-02-21.log
├── publications-2024-02-21.log
├── jobs-2024-02-21.log
├── auth-2024-02-21.log
├── social-2024-02-21.log
└── errors-2024-02-21.log
```

##  Ejemplos Prácticos

### Encontrar todos los errores de un usuario:
```bash
php artisan logs:search "error" --user=123 --level=error
```

### Ver qué pasó con una publicación específica:
```bash
php artisan logs:search "publication_id\":456" --channel=publications
```

### Revisar jobs fallidos de hoy:
```bash
php artisan logs:search "failed" --channel=jobs --level=error
```

### Ver intentos de login fallidos:
```bash
php artisan logs:search "failed" --channel=auth --level=error
```

## 🎯 Mejores Prácticas

1. **Usa el canal apropiado**: No pongas todo en el log general
2. **Incluye IDs relevantes**: publication_id, user_id, job_id, etc.
3. **Niveles apropiados**:
   - `info` - Operaciones normales
   - `warning` - Algo inusual pero no crítico
   - `error` - Errores que requieren atención
   - `debug` - Información detallada para desarrollo

4. **Contexto útil**: Agrega información que ayude a reproducir el problema

## 🧹 Limpieza Automática

Los logs se rotan automáticamente:
- Logs generales: 14 días
- Publications, jobs, social: 30 días
- Auth: 90 días (por seguridad)
- Errors: 60 días

Puedes cambiar esto en `config/logging.php` modificando el valor `days`.

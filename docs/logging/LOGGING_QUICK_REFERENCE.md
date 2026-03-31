# 🚀 Referencia Rápida de Logs

## Comandos Disponibles

### Ver logs disponibles
```bash
php artisan logs:list
php artisan logs:list --channel=publications
```

### Buscar en logs
```bash
# Búsqueda básica
php artisan logs:search "término"

# Por canal
php artisan logs:search "error" --channel=publications

# Por usuario
php artisan logs:search "error" --user=123

# Por fecha
php artisan logs:search "failed" --date=2024-02-21

# Por nivel
php artisan logs:search "timeout" --level=error

# Combinado
php artisan logs:search "publish" --channel=jobs --user=5 --level=error --lines=100
```

### Ver estadísticas
```bash
php artisan logs:stats --channel=publications
php artisan logs:stats --channel=jobs --date=2024-02-21
```

## Uso en Código

### Importar
```php
use App\Helpers\LogHelper;
```

### Logs por Canal

```php
// Publicaciones
LogHelper::publicationInfo('Message', ['publication_id' => 123]);
LogHelper::publicationError('Error', ['publication_id' => 123]);

// Jobs
LogHelper::jobInfo('Job started', ['job_id' => 'uuid']);
LogHelper::jobError('Job failed', ['error' => $e->getMessage()]);

// Autenticación
LogHelper::auth('info', 'Login attempt', ['email' => $email]);

// Redes Sociales
LogHelper::social('error', 'Facebook error', ['account_id' => 456]);

// Solo errores críticos
LogHelper::error('Critical error', ['context' => 'data']);
```

### Contexto Automático Incluido
- `user_id` - Usuario autenticado
- `user_email` - Email del usuario
- `workspace_id` - Workspace actual
- `ip` - Dirección IP
- `url` - URL de la petición
- `method` - Método HTTP (GET, POST, etc.)
- `timestamp` - Fecha y hora ISO 8601

## Canales Disponibles

| Canal | Archivo | Retención | Uso |
|-------|---------|-----------|-----|
| `laravel` | `laravel-YYYY-MM-DD.log` | 14 días | General |
| `publications` | `publications-YYYY-MM-DD.log` | 30 días | Publicaciones |
| `jobs` | `jobs-YYYY-MM-DD.log` | 30 días | Trabajos en cola |
| `auth` | `auth-YYYY-MM-DD.log` | 90 días | Autenticación |
| `social` | `social-YYYY-MM-DD.log` | 30 días | Redes sociales |
| `errors` | `errors-YYYY-MM-DD.log` | 60 días | Solo errores |

## Niveles de Log

- `debug` - Información detallada para desarrollo
- `info` - Operaciones normales
- `warning` - Algo inusual pero no crítico
- `error` - Errores que requieren atención

## Ejemplos Rápidos

### Encontrar errores de un usuario
```bash
php artisan logs:search "error" --user=123 --level=error
```

### Ver qué pasó con una publicación
```bash
php artisan logs:search "publication_id\":456" --channel=publications
```

### Jobs fallidos de hoy
```bash
php artisan logs:search "failed" --channel=jobs --level=error
```

### Intentos de login fallidos
```bash
php artisan logs:search "failed" --channel=auth
```

### Errores de Facebook
```bash
php artisan logs:search "facebook" --channel=social --level=error
```

## Ubicación de Archivos

```
storage/logs/
├── laravel-2024-02-21.log
├── publications-2024-02-21.log
├── jobs-2024-02-21.log
├── auth-2024-02-21.log
├── social-2024-02-21.log
└── errors-2024-02-21.log
```

## Tips

1. Usa el canal apropiado para cada tipo de log
2. Incluye IDs relevantes (publication_id, user_id, job_id)
3. El contexto de usuario se agrega automáticamente
4. Los errores críticos van automáticamente al canal `errors`
5. Los logs se rotan automáticamente por fecha

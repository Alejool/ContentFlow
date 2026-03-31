# Documentación de Logging

Sistema de logs estructurado y monitoreo de Intellipost.

## Documentos Disponibles

- **LOGGING_GUIDE.md** - Guía completa del sistema de logging
- **LOGGING_QUICK_REFERENCE.md** - Referencia rápida de comandos
- **LOGGING_EXAMPLES_OUTPUT.md** - Ejemplos de salida de logs
- **LOGGING_MIGRATION_EXAMPLE.md** - Cómo migrar logs antiguos
- **LOGGING_TROUBLESHOOTING.md** - Solución de problemas

## Canales de Log

- `publications` - Logs de publicaciones
- `jobs` - Logs de trabajos en segundo plano
- `social` - Logs de integraciones sociales
- `errors` - Solo errores críticos
- `auth` - Logs de autenticación

## Comandos Útiles

### Buscar en Logs
```bash
docker-compose exec app php artisan logs:search "error" --channel=publications
```

### Ver Estadísticas
```bash
docker-compose exec app php artisan logs:stats --channel=publications
```

### Limpiar Logs Antiguos
```bash
docker-compose exec app php artisan logs:clean --days=30
```

## Uso de LogHelper

```php
use App\Helpers\LogHelper;

// Log de publicación
LogHelper::publicationInfo('Publication created', [
    'publication_id' => $publication->id
]);

// Log de error
LogHelper::publicationError('Failed to publish', [
    'publication_id' => $publication->id,
    'error' => $e->getMessage()
]);
```

Ver [LOGGING_GUIDE.md](./LOGGING_GUIDE.md) para documentación completa.

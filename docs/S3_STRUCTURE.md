# Estructura Organizada de Archivos en S3

## Descripción General

Este documento describe la nueva estructura jerárquica de archivos en AWS S3, diseñada para mejorar la organización, escalabilidad y gestión de archivos del sistema.

## Estructura de Directorios

### 1. Avatares de Usuario
```
avatars/{user_id}/{timestamp}.{extension}
```

**Ejemplo:**
```
avatars/123/1678901234.png
avatars/456/1678901235.jpg
```

**Características:**
- Organizado por ID de usuario
- Un directorio por usuario
- Nombres de archivo con timestamp para evitar colisiones
- Independiente del workspace (los avatares son globales al usuario)

---

### 2. Publicaciones
```
workspaces/{workspace_id}/users/{user_id}/publications/{uuid}.{extension}
```

**Ejemplo:**
```
workspaces/1/users/123/publications/a1b2c3d4-e5f6-7890-abcd-ef1234567890.mp4
workspaces/2/users/456/publications/f9e8d7c6-b5a4-3210-fedc-ba0987654321.jpg
```

**Características:**
- Jerarquía: Workspace → Usuario → Publicaciones
- UUID único para cada archivo
- Facilita la gestión de cuotas por workspace
- Permite auditoría y análisis por usuario

---

### 3. Derivatives (Imágenes Optimizadas, Thumbnails)
```
workspaces/{workspace_id}/users/{user_id}/publications/{publication_id}/derivatives/{type}/{filename}
```

**Tipos de derivatives:**
- `thumbnails/` - Miniaturas de videos
- `optimized/` - Imágenes optimizadas (WebP, AVIF, diferentes tamaños)

**Ejemplos:**
```
workspaces/1/users/123/publications/45/derivatives/thumbnails/thumb_1678901234.jpg
workspaces/1/users/123/publications/45/derivatives/optimized/image_medium.webp
workspaces/2/users/456/publications/78/derivatives/optimized/image_large.avif
```

**Características:**
- Agrupados por publicación
- Separados por tipo de derivative
- Facilita la limpieza cuando se elimina una publicación
- Mejora el rendimiento de consultas

---

### 4. Reels (Videos Cortos)
```
workspaces/{workspace_id}/users/{user_id}/reels/{folder}/{uuid}_{filename}
```

**Ejemplo:**
```
workspaces/1/users/123/reels/instagram/a1b2c3d4-e5f6-7890-abcd-ef1234567890_clip.mp4
workspaces/1/users/123/reels/tiktok/f9e8d7c6-b5a4-3210-fedc-ba0987654321_short.mp4
```

**Características:**
- Organizados por plataforma (folder)
- UUID para evitar colisiones
- Jerarquía similar a publicaciones

---

### 5. Archivos Temporales
```
workspaces/{workspace_id}/users/{user_id}/temp/{filename}
```

**Ejemplo:**
```
workspaces/1/users/123/temp/upload_1678901234.tmp
workspaces/2/users/456/temp/processing_video.mp4
```

**Características:**
- Archivos temporales durante procesamiento
- Deben limpiarse periódicamente
- Organizados por workspace y usuario para facilitar limpieza

---

### 6. Branding de Workspace
```
workspaces/{workspace_id}/branding/{filename}
```

**Ejemplo:**
```
workspaces/1/branding/logo_1.png
workspaces/1/branding/favicon_1.ico
workspaces/2/branding/logo_2.svg
```

**Características:**
- Solo para workspaces con plan Enterprise
- Logos y favicons personalizados
- Un directorio por workspace

---

## Servicio Centralizado: S3PathService

### Ubicación
```
app/Services/Storage/S3PathService.php
```

### Métodos Principales

#### Avatares
```php
S3PathService::avatarPath(int $userId, string $extension): string
```

#### Publicaciones
```php
S3PathService::publicationPath(int $workspaceId, int $userId, string $extension): string
```

#### Derivatives
```php
S3PathService::derivativePath(int $workspaceId, int $userId, int $publicationId, string $type, string $filename): string
S3PathService::thumbnailPath(int $workspaceId, int $userId, int $publicationId, string $filename): string
S3PathService::optimizedImagePath(int $workspaceId, int $userId, int $publicationId, string $filename): string
```

#### Reels
```php
S3PathService::reelPath(int $workspaceId, int $userId, string $folder, string $filename): string
```

#### Temporales
```php
S3PathService::tempPath(int $workspaceId, int $userId, string $filename): string
```

#### Branding
```php
S3PathService::workspaceBrandingPath(int $workspaceId, string $filename): string
```

#### Utilidades
```php
S3PathService::parsePathInfo(string $path): ?array
S3PathService::userWorkspacePrefix(int $workspaceId, int $userId): string
S3PathService::publicationsPrefix(int $workspaceId, int $userId): string
```

---

## Migración de Archivos Existentes

### Comando Artisan

```bash
# Simular migración (dry-run)
docker-compose exec app php artisan storage:migrate-s3-structure --dry-run

# Migrar todos los archivos
docker-compose exec app php artisan storage:migrate-s3-structure

# Migrar solo avatares
docker-compose exec app php artisan storage:migrate-s3-structure --type=avatars

# Migrar con límite
docker-compose exec app php artisan storage:migrate-s3-structure --limit=100

# Migrar tipos específicos
docker-compose exec app php artisan storage:migrate-s3-structure --type=publications
docker-compose exec app php artisan storage:migrate-s3-structure --type=derivatives
docker-compose exec app php artisan storage:migrate-s3-structure --type=branding
```

### Proceso de Migración

1. **Backup**: Hacer backup de la base de datos antes de migrar
2. **Dry-run**: Ejecutar con `--dry-run` para verificar
3. **Migración por lotes**: Usar `--limit` para migrar en lotes pequeños
4. **Verificación**: Comprobar que los archivos se movieron correctamente
5. **Limpieza**: Los archivos antiguos se eliminan automáticamente después de copiar

---

## Ventajas de la Nueva Estructura

### 1. Organización
- Jerarquía clara y lógica
- Fácil de navegar y entender
- Separación por workspace y usuario

### 2. Escalabilidad
- Mejor distribución de archivos
- Evita directorios con millones de archivos
- Facilita el sharding futuro

### 3. Gestión de Cuotas
- Fácil calcular uso por workspace
- Fácil calcular uso por usuario
- Facilita implementación de límites

### 4. Seguridad
- Mejor control de acceso por workspace
- Facilita políticas de IAM específicas
- Auditoría más clara

### 5. Mantenimiento
- Limpieza más eficiente
- Fácil identificar archivos huérfanos
- Mejor gestión de lifecycle policies

### 6. Performance
- Mejor distribución de carga en S3
- Queries más eficientes
- Menos colisiones de nombres

---

## Políticas de Lifecycle Recomendadas

### Archivos Temporales
```json
{
  "Rules": [
    {
      "Id": "DeleteTempFiles",
      "Status": "Enabled",
      "Prefix": "workspaces/",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 7
      }
    }
  ]
}
```

### Derivatives Antiguos
```json
{
  "Rules": [
    {
      "Id": "TransitionOldDerivatives",
      "Status": "Enabled",
      "Prefix": "workspaces/",
      "Filter": {
        "Prefix": "derivatives/"
      },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

---

## Consideraciones de Implementación

### 1. Compatibilidad Retroactiva
- El sistema soporta ambas estructuras durante la migración
- Los modelos detectan automáticamente el formato de URL
- La migración es gradual y no disruptiva

### 2. URLs Públicas
- Todas las URLs se generan dinámicamente
- No hay URLs hardcodeadas en el código
- Fácil cambiar de bucket o CDN

### 3. CDN Integration
- La estructura es compatible con CloudFront
- Facilita configuración de cache por tipo
- Permite invalidaciones selectivas

### 4. Backup y Disaster Recovery
- Estructura facilita backups selectivos
- Fácil restaurar workspace específico
- Mejor granularidad en recuperación

---

## Ejemplos de Uso

### Crear Nueva Publicación
```php
use App\Services\Storage\S3PathService;

$user = auth()->user();
$extension = $file->getClientOriginalExtension();

$path = S3PathService::publicationPath(
    $user->current_workspace_id,
    $user->id,
    $extension
);

Storage::disk('s3')->put($path, $fileContent);
```

### Generar Thumbnail
```php
$filename = 'thumb_' . time() . '.jpg';

$path = S3PathService::thumbnailPath(
    $mediaFile->workspace_id,
    $mediaFile->user_id,
    $mediaFile->publication_id,
    $filename
);

Storage::disk('s3')->put($path, $thumbnailContent);
```

### Listar Archivos de Usuario
```php
$prefix = S3PathService::userWorkspacePrefix($workspaceId, $userId);
$files = Storage::disk('s3')->files($prefix);
```

---

## Monitoreo y Métricas

### Métricas Recomendadas
- Tamaño total por workspace
- Tamaño total por usuario
- Número de archivos por tipo
- Tasa de crecimiento
- Archivos temporales no limpiados

### CloudWatch Metrics
```bash
# Tamaño por workspace
aws s3 ls s3://bucket/workspaces/{workspace_id}/ --recursive --summarize

# Contar archivos por tipo
aws s3 ls s3://bucket/workspaces/{workspace_id}/users/{user_id}/publications/ --recursive | wc -l
```

---

## Troubleshooting

### Archivo no encontrado después de migración
1. Verificar que la migración se completó
2. Comprobar logs de migración
3. Verificar que la URL en BD se actualizó
4. Comprobar permisos de S3

### Performance lento
1. Verificar que no hay directorios con millones de archivos
2. Considerar usar CloudFront
3. Revisar políticas de lifecycle
4. Optimizar queries de listado

### Espacio en disco
1. Ejecutar limpieza de archivos temporales
2. Revisar archivos huérfanos
3. Implementar lifecycle policies
4. Considerar compresión de derivatives

---

## Referencias

- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
- [S3 Performance Guidelines](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html)
- [Laravel Storage Documentation](https://laravel.com/docs/filesystem)

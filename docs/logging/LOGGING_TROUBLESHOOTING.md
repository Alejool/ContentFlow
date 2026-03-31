# 🔧 Troubleshooting - Sistema de Logs

## Problemas Comunes y Soluciones

### 1. No se crean los archivos de log separados

**Problema:** Los logs siguen yendo solo a `laravel.log`

**Solución:**
```bash
# Verificar que los canales estén configurados
php artisan config:clear
php artisan cache:clear

# Verificar permisos de escritura
# En Windows:
icacls storage\logs /grant Users:F /T

# En Linux/Mac:
chmod -R 775 storage/logs
chown -R www-data:www-data storage/logs
```

### 2. Error "Class LogHelper not found"

**Problema:** No encuentra la clase LogHelper

**Solución:**
```bash
# Regenerar autoload
composer dump-autoload

# Verificar que el archivo existe
dir app\Helpers\LogHelper.php  # Windows
ls app/Helpers/LogHelper.php   # Linux/Mac
```

### 3. Los comandos artisan no aparecen

**Problema:** `php artisan logs:search` no existe

**Solución:**
```bash
# Limpiar cache de comandos
php artisan clear-compiled
php artisan optimize:clear

# Verificar que los comandos existen
dir app\Console\Commands\SearchLogs.php
dir app\Console\Commands\LogStats.php
dir app\Console\Commands\ListLogs.php

# Listar comandos disponibles
php artisan list logs
```

### 4. No se agrega contexto automático

**Problema:** Los logs no incluyen user_id, ip, etc.

**Causa:** Probablemente estás usando `Log::` directamente en lugar de `LogHelper::`

**Solución:**
```php
// ❌ Incorrecto
Log::info('Message', ['data' => 'value']);

// ✅ Correcto
use App\Helpers\LogHelper;
LogHelper::publicationInfo('Message', ['data' => 'value']);
```

### 5. Logs muy grandes / Disco lleno

**Problema:** Los archivos de log ocupan mucho espacio

**Solución:**
```bash
# Ver tamaño de logs
php artisan logs:list

# Ajustar retención en config/logging.php
# Cambiar el valor 'days' para cada canal

# Limpiar logs antiguos manualmente
# Windows:
forfiles /p storage\logs /s /m *.log /d -30 /c "cmd /c del @path"

# Linux/Mac:
find storage/logs -name "*.log" -mtime +30 -delete
```

### 6. Búsqueda no encuentra resultados

**Problema:** `logs:search` no encuentra logs que sabes que existen

**Soluciones:**

```bash
# 1. Verificar que estás buscando en el canal correcto
php artisan logs:list  # Ver canales disponibles

# 2. Buscar sin filtros primero
php artisan logs:search "término" --channel=publications

# 3. Verificar la fecha si usas --date
php artisan logs:search "término" --channel=publications --date=2024-02-21

# 4. Buscar en todos los canales
php artisan logs:search "término" --channel=laravel
php artisan logs:search "término" --channel=publications
php artisan logs:search "término" --channel=jobs
```

### 7. Errores de permisos al escribir logs

**Problema:** "Permission denied" al escribir logs

**Solución Windows:**
```bash
# Dar permisos completos a la carpeta logs
icacls storage\logs /grant Users:F /T
icacls storage\logs /grant IIS_IUSRS:F /T
```

**Solución Linux/Mac:**
```bash
# Dar permisos correctos
sudo chmod -R 775 storage/logs
sudo chown -R www-data:www-data storage/logs

# O si usas otro usuario web
sudo chown -R nginx:nginx storage/logs
```

### 8. Logs en formato incorrecto

**Problema:** Los logs no se ven en formato JSON

**Causa:** Estás usando el canal incorrecto o hay un problema de configuración

**Solución:**
```bash
# Verificar configuración
php artisan config:show logging

# Limpiar cache
php artisan config:clear

# Verificar que usas LogHelper correctamente
```

### 9. Búsqueda muy lenta

**Problema:** `logs:search` tarda mucho tiempo

**Soluciones:**

```bash
# 1. Limitar número de resultados
php artisan logs:search "término" --lines=20

# 2. Buscar en fecha específica
php artisan logs:search "término" --date=2024-02-21

# 3. Usar canal específico
php artisan logs:search "término" --channel=publications

# 4. Limpiar logs antiguos
find storage/logs -name "*.log" -mtime +30 -delete
```

### 10. No se rotan los logs diariamente

**Problema:** Solo hay un archivo `publications.log` sin fecha

**Causa:** El canal no está configurado como 'daily'

**Solución:**
```php
// En config/logging.php, verificar que tenga:
'publications' => [
    'driver' => 'daily',  // ← Debe ser 'daily', no 'single'
    'path' => storage_path('logs/publications.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'days' => 30,
],
```

## 🔍 Comandos de Diagnóstico

### Verificar configuración actual
```bash
php artisan config:show logging
```

### Ver todos los logs disponibles
```bash
php artisan logs:list
```

### Ver estadísticas de un canal
```bash
php artisan logs:stats --channel=publications
```

### Probar que LogHelper funciona
```php
// Crear un archivo test.php en la raíz
<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Helpers\LogHelper;

LogHelper::publicationInfo('Test log', ['test' => true]);
echo "Log escrito correctamente\n";
```

```bash
php test.php
# Luego verificar:
php artisan logs:search "Test log" --channel=publications
```

## 📞 Obtener Ayuda

Si ninguna solución funciona:

1. Verificar permisos de `storage/logs`
2. Revisar `storage/logs/laravel.log` para errores
3. Ejecutar `php artisan config:clear && php artisan cache:clear`
4. Verificar que todos los archivos existen:
   - `app/Helpers/LogHelper.php`
   - `app/Console/Commands/SearchLogs.php`
   - `app/Console/Commands/LogStats.php`
   - `app/Console/Commands/ListLogs.php`
5. Ejecutar `composer dump-autoload`

## 🐛 Reportar Problemas

Si encuentras un bug, incluye:
- Comando exacto que ejecutaste
- Mensaje de error completo
- Salida de `php artisan logs:list`
- Salida de `php artisan config:show logging`
- Sistema operativo y versión de PHP

# Guía Completa de Docker para ContentFlow

Esta guía proporciona información detallada sobre el uso de Docker en el proyecto ContentFlow.

## Tabla de Contenidos

1. [Contexto del Entorno](#contexto-del-entorno)
2. [Comandos y Ejecución](#comandos-y-ejecución)
3. [Entornos y Configuración](#entornos-y-configuración)
4. [Monitoreo y Health Checks](#monitoreo-y-health-checks)
5. [Backup y Restauración](#backup-y-restauración)
6. [Optimización y Performance](#optimización-y-performance)
7. [Debugging Avanzado](#debugging-avanzado)
8. [Gestión de Colas y Workers](#gestión-de-colas-y-workers)
9. [Seguridad](#seguridad)
10. [CI/CD y Automatización](#cicd-y-automatización)
11. [Networking](#networking-y-comunicación-entre-servicios)
12. [Troubleshooting Específico](#problemas-comunes-del-proyecto)

---

## Contexto del Entorno

- **Entorno de Desarrollo**: Docker con Docker Compose
- **Sistema Operativo Host**: Windows
- **Contenedores Principales**:
  - PHP/Laravel (aplicación principal)
  - MySQL (base de datos)
  - Redis (caché y colas)
  - Nginx (servidor web)

---

## Comandos y Ejecución

### Comandos Artisan y Composer
Todos los comandos de Laravel/PHP deben ejecutarse DENTRO del contenedor:

```bash
# Comandos Artisan
docker-compose exec app php artisan [comando]

# Composer
docker-compose exec app composer [comando]

# Ejemplos:
docker-compose exec app php artisan migrate
docker-compose exec app php artisan queue:work
docker-compose exec app composer install
```

### Comandos NPM/Node
Los comandos de Node.js también deben ejecutarse en el contenedor apropiado:

```bash
docker-compose exec app npm [comando]
# o si hay un contenedor específico de node:
docker-compose exec node npm [comando]
```

### Acceso a la Base de Datos
Para acceder a MySQL:

```bash
docker-compose exec mysql mysql -u root -p
```

### Logs y Debugging
Para ver logs de los contenedores:

```bash
docker-compose logs -f [servicio]
docker-compose logs -f app
```

---

## Entornos y Configuración

### Archivos de Entorno
- `.env` - Configuración local (fuera de Docker)
- `.env.docker` - Variables para contenedores Docker
- `.env.docker.example` - Plantilla para Docker
- `.env.example.reels` - Configuración específica para Reels
- `.env.security.example` - Variables de seguridad
- `.env.subscription.example` - Configuración de suscripciones

### Archivos de Configuración Docker
- `docker-compose.yml` - Configuración de servicios para producción
- `docker-compose.dev.yml` - Configuración para desarrollo
- `Dockerfile` - Imagen de la aplicación
- `Dockerfile.dev` - Imagen para desarrollo
- `.dockerignore` - Archivos excluidos de la imagen
- `.dockerignore.dev` - Exclusiones para desarrollo

### Cambiar entre Entornos

```bash
# Desarrollo local
cp .env.docker .env

# Usar configuración de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# Producción
cp .env.production .env
docker-compose up -d
```

### Volúmenes y Persistencia
Los archivos del proyecto están montados como volúmenes, por lo que los cambios en el código se reflejan inmediatamente sin necesidad de reconstruir la imagen.

---

## Monitoreo y Health Checks

### Verificar Estado de Servicios

```bash
# Estado general
docker-compose ps

# Uso de recursos
docker stats

# Health check específico
docker-compose exec app php artisan health:check
```

### Verificar Conectividad

```bash
# Ping entre contenedores
docker-compose exec app ping mysql
docker-compose exec app ping redis

# Verificar puertos
docker-compose port app 80
docker-compose port mysql 3306

# Ver configuración de red
docker network inspect contentflow_default
```

### Monitoreo de Logs en Tiempo Real

```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f app

# Con filtro
docker-compose logs -f app | grep ERROR

# Últimas 100 líneas
docker-compose logs --tail=100 app
```

---

## Backup y Restauración

### Backup de Base de Datos

```bash
# Crear backup manual
docker-compose exec mysql mysqldump -u root -p contentflow > backup_$(date +%Y%m%d).sql

# Backup automático con script
docker-compose exec mysql sh -c 'mysqldump -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE' > backup.sql

# Backup con compresión
docker-compose exec mysql sh -c 'mysqldump -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE | gzip' > backup_$(date +%Y%m%d).sql.gz
```

### Restaurar Base de Datos

```bash
# Desde archivo SQL
docker-compose exec -T mysql mysql -u root -p contentflow < backup.sql

# Desde archivo comprimido
gunzip < backup.sql.gz | docker-compose exec -T mysql mysql -u root -p contentflow
```

### Backup de Archivos

```bash
# Storage y uploads
docker-compose exec app tar -czf /tmp/storage_backup.tar.gz storage/app/public
docker cp $(docker-compose ps -q app):/tmp/storage_backup.tar.gz ./backups/

# Backup completo de volúmenes
docker run --rm -v contentflow_storage:/data -v $(pwd)/backups:/backup alpine tar czf /backup/storage_backup.tar.gz -C /data .
```

### Restaurar Archivos

```bash
# Restaurar storage
docker cp ./backups/storage_backup.tar.gz $(docker-compose ps -q app):/tmp/
docker-compose exec app tar -xzf /tmp/storage_backup.tar.gz -C /
```

---

## Optimización y Performance

### Cache de Aplicación

```bash
# Optimizar para producción
docker-compose exec app php artisan optimize
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
docker-compose exec app php artisan event:cache

# Limpiar todo el cache
docker-compose exec app php artisan optimize:clear
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan route:clear
docker-compose exec app php artisan view:clear
```

### Optimización de Composer

```bash
# Autoload optimizado
docker-compose exec app composer dump-autoload -o

# Instalación sin dev dependencies (producción)
docker-compose exec app composer install --no-dev --optimize-autoloader

# Actualizar dependencias
docker-compose exec app composer update --optimize-autoloader
```

### Limpieza de Docker

```bash
# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volúmenes huérfanos
docker volume prune

# Limpiar contenedores detenidos
docker container prune

# Limpieza completa del sistema
docker system prune -a --volumes

# Ver espacio usado por Docker
docker system df
```

### Optimización de Imágenes

```bash
# Construir con cache
docker-compose build

# Construir sin cache (más lento pero más limpio)
docker-compose build --no-cache

# Construir con parallel
docker-compose build --parallel
```

---

## Debugging Avanzado

### Xdebug (si está configurado)

```bash
# Habilitar Xdebug
docker-compose exec app php -d xdebug.mode=debug artisan [comando]

# Verificar configuración de Xdebug
docker-compose exec app php -i | grep xdebug
```

### Inspeccionar Contenedor

```bash
# Acceso shell al contenedor
docker-compose exec app bash
docker-compose exec app sh

# Ver procesos dentro del contenedor
docker-compose exec app ps aux

# Ver variables de entorno
docker-compose exec app env

# Inspeccionar configuración del contenedor
docker inspect $(docker-compose ps -q app)
```

### Análisis de Logs

```bash
# Logs en tiempo real con filtro
docker-compose logs -f app | grep ERROR
docker-compose logs -f app | grep -i exception

# Últimas 100 líneas
docker-compose logs --tail=100 app

# Logs de Laravel dentro del contenedor
docker-compose exec app tail -f storage/logs/laravel.log

# Logs con timestamp
docker-compose logs -f --timestamps app

# Exportar logs a archivo
docker-compose logs app > logs_$(date +%Y%m%d).txt
```

### Debugging de Red

```bash
# Ver todas las redes
docker network ls

# Inspeccionar red del proyecto
docker network inspect contentflow_default

# Ver IP de un contenedor
docker-compose exec app hostname -i

# Probar conectividad
docker-compose exec app curl http://nginx
docker-compose exec app nc -zv mysql 3306
```

---

## Gestión de Colas y Workers

### Queue Workers

```bash
# Iniciar worker
docker-compose exec app php artisan queue:work

# Worker con intentos limitados
docker-compose exec app php artisan queue:work --tries=3

# Worker con timeout
docker-compose exec app php artisan queue:work --timeout=60

# Worker para cola específica
docker-compose exec app php artisan queue:work --queue=high,default

# Reiniciar workers después de cambios
docker-compose exec app php artisan queue:restart

# Ver trabajos en cola
docker-compose exec app php artisan queue:monitor

# Ver trabajos fallidos
docker-compose exec app php artisan queue:failed

# Reintentar trabajos fallidos
docker-compose exec app php artisan queue:retry all
docker-compose exec app php artisan queue:retry [id]

# Limpiar trabajos fallidos
docker-compose exec app php artisan queue:flush
```

### Horizon (si está instalado)

```bash
# Iniciar Horizon
docker-compose exec app php artisan horizon

# Terminar Horizon
docker-compose exec app php artisan horizon:terminate

# Pausar Horizon
docker-compose exec app php artisan horizon:pause

# Continuar Horizon
docker-compose exec app php artisan horizon:continue

# Ver estado de Horizon
docker-compose exec app php artisan horizon:status
```

### Monitoreo de Colas

```bash
# Ver estadísticas de colas
docker-compose exec app php artisan queue:monitor redis:default,redis:high

# Limpiar trabajos antiguos
docker-compose exec app php artisan queue:prune-failed --hours=48
```

---

## Seguridad

### Tokens y Secrets

- **NUNCA** commitear archivos `.env*` con credenciales reales
- Usar `.env.example` como plantilla
- Rotar secrets regularmente
- Usar variables de entorno para información sensible

### Permisos Seguros

```bash
# Permisos recomendados para Laravel
docker-compose exec app chmod -R 755 storage bootstrap/cache
docker-compose exec app chmod -R 644 storage/logs/*.log

# Propietario correcto
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache

# Verificar permisos
docker-compose exec app ls -la storage/
```

### Actualización de Dependencias

```bash
# Verificar vulnerabilidades en Composer
docker-compose exec app composer audit

# Actualizar dependencias de seguridad
docker-compose exec app composer update --with-dependencies

# Verificar vulnerabilidades en NPM
docker-compose exec app npm audit

# Corregir vulnerabilidades automáticamente
docker-compose exec app npm audit fix
```

### Hardening de Contenedores

```bash
# Ejecutar contenedores como usuario no-root
# (configurar en Dockerfile)

# Limitar recursos del contenedor
# (configurar en docker-compose.yml)
# mem_limit: 512m
# cpus: 0.5

# Usar secrets de Docker para información sensible
docker secret create db_password ./db_password.txt
```

---

## CI/CD y Automatización

### Scripts Útiles

Crear archivo `scripts/docker-deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Deteniendo contenedores..."
docker-compose down

echo "Actualizando imágenes..."
docker-compose pull

echo "Construyendo imágenes..."
docker-compose build --no-cache

echo "Iniciando contenedores..."
docker-compose up -d

echo "Esperando a que los servicios estén listos..."
sleep 10

echo "Ejecutando migraciones..."
docker-compose exec -T app php artisan migrate --force

echo "Optimizando aplicación..."
docker-compose exec -T app php artisan optimize

echo "Reiniciando workers..."
docker-compose exec -T app php artisan queue:restart

echo "Despliegue completado!"
```

### Testing en Docker

```bash
# Tests unitarios
docker-compose exec app php artisan test

# Tests en paralelo
docker-compose exec app php artisan test --parallel

# Tests con coverage
docker-compose exec app php artisan test --coverage

# PHPUnit específico
docker-compose exec app ./vendor/bin/phpunit --filter=NombreTest

# Tests de un archivo específico
docker-compose exec app php artisan test tests/Feature/PublicationTest.php

# Tests con base de datos en memoria
docker-compose exec app php artisan test --env=testing
```

### Automatización con Scripts Batch (Windows)

Crear archivo `scripts/docker-test.bat`:

```batch
@echo off
echo Ejecutando tests...
docker-compose exec app php artisan test
if %errorlevel% neq 0 exit /b %errorlevel%
echo Tests completados exitosamente!
```

---

## Networking y Comunicación entre Servicios

### Red de Docker

```bash
# Listar redes
docker network ls

# Inspeccionar red del proyecto
docker network inspect contentflow_default

# Ver IPs de contenedores
docker-compose exec app hostname -i
docker-compose exec mysql hostname -i

# Crear red personalizada
docker network create contentflow_network
```

### Comunicación entre Servicios

En Laravel, usar nombres de servicio como hosts en `.env.docker`:

```env
DB_HOST=mysql
DB_PORT=3306

REDIS_HOST=redis
REDIS_PORT=6379

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

**Importante**: No usar `localhost` dentro de contenedores, usar el nombre del servicio definido en `docker-compose.yml`.

### URLs y Puertos

Desde el host (Windows):
- Aplicación web: `http://localhost` o `http://localhost:8000`
- Base de datos: `localhost:3306`
- Redis: `localhost:6379`

Desde dentro de contenedores:
- Base de datos: `mysql:3306`
- Redis: `redis:6379`
- Nginx: `nginx:80`

### Resolución de DNS

```bash
# Ver resolución DNS dentro del contenedor
docker-compose exec app cat /etc/hosts
docker-compose exec app cat /etc/resolv.conf

# Probar resolución
docker-compose exec app nslookup mysql
docker-compose exec app ping -c 3 redis
```

---

## Problemas Comunes del Proyecto

### Publicaciones y Reels

```bash
# Verificar configuración de Reels
docker-compose exec app php artisan config:show reels

# Diagnosticar publicaciones
docker-compose exec app php artisan diagnose:publication [id]

# Verificar FFmpeg
docker-compose exec app php artisan check:ffmpeg

# Limpiar publicaciones fallidas
docker-compose exec app php artisan clean:failed-publications

# Verificar estado de publicaciones programadas
docker-compose exec app php artisan check:publication-status

# Diagnosticar generación de Reels
docker-compose exec app php artisan diagnose:reel-generation
docker-compose exec app php artisan diagnose:reels
```

### Tokens y OAuth

```bash
# Verificar tokens expirados
docker-compose exec app php artisan check:expiring-tokens

# Diagnosticar tokens corruptos
docker-compose exec app php artisan diagnose:corrupted-tokens

# Limpiar tokens expirados
docker-compose exec app php artisan tokens:clean
```

### Suscripciones Stripe

```bash
# Configurar portal de billing
docker-compose exec app php artisan configure:stripe-billing-portal

# Diagnosticar portal
docker-compose exec app php artisan diagnose:billing-portal

# Diagnosticar planes activos
docker-compose exec app php artisan diagnose:active-plans

# Verificar límites de uso
docker-compose exec app php artisan check:usage-limits

# Aplicar cambios de plan programados
docker-compose exec app php artisan apply:scheduled-plan-changes

# Verificar suscripciones de prueba
docker-compose exec app php artisan check:trial-subscriptions
```

### Calendario y Eventos

```bash
# Limpiar eventos duplicados
docker-compose exec app php artisan clean:duplicate-external-calendar-events

# Limpiar eventos huérfanos
docker-compose exec app php artisan clean:orphaned-external-calendar-events

# Verificar configuración de recurrencia
docker-compose exec app php artisan check:recurrence-settings

# Diagnosticar recurrencia
docker-compose exec app php artisan diagnose:recurrence
docker-compose exec app php artisan diagnose:recurring-posts
```

### Auditoría y Logs

```bash
# Limpiar logs antiguos
docker-compose exec app php artisan clean:old-audit-logs

# Ver logs de auditoría
docker-compose exec app php artisan audit:show

# Exportar logs
docker-compose exec app php artisan logs:export
```

---

## Reinicio y Reconstrucción

### Reiniciar Servicios

```bash
# Reiniciar todos los servicios
docker-compose restart

# Reiniciar servicio específico
docker-compose restart app
docker-compose restart mysql

# Reinicio suave (sin downtime)
docker-compose up -d --no-deps --build app
```

### Reconstruir Imágenes

```bash
# Después de cambios en Dockerfile
docker-compose down
docker-compose build
docker-compose up -d

# Reconstruir sin cache
docker-compose build --no-cache

# Reconstruir servicio específico
docker-compose build app
```

### Limpiar y Empezar de Cero

```bash
# Detener y eliminar contenedores, redes y volúmenes
docker-compose down -v

# Reconstruir sin cache
docker-compose build --no-cache

# Iniciar servicios
docker-compose up -d

# Ejecutar migraciones
docker-compose exec app php artisan migrate:fresh --seed
```

---

## Reglas Generales

1. **NUNCA** sugerir comandos que se ejecuten directamente en el host si requieren PHP, Composer, o Artisan
2. **SIEMPRE** prefija los comandos con `docker-compose exec app` para comandos de Laravel
3. **VERIFICAR** que los servicios estén corriendo antes de ejecutar comandos: `docker-compose ps`
4. **CONSIDERAR** el contexto de red de Docker al configurar conexiones entre servicios
5. **RECORDAR** que las variables de entorno deben estar en `.env.docker` para el entorno Docker
6. **USAR** nombres de servicio (no localhost) para comunicación entre contenedores
7. **MANTENER** los volúmenes para persistencia de datos importantes
8. **MONITOREAR** el uso de recursos con `docker stats`
9. **HACER BACKUP** regular de base de datos y archivos importantes
10. **DOCUMENTAR** cualquier cambio en la configuración de Docker

---

## Troubleshooting Común

### Contenedor no inicia
```bash
# Verificar logs
docker-compose logs app

# Ver estado
docker-compose ps

# Verificar configuración
docker-compose config
```

### Base de datos no conecta
```bash
# Verificar que MySQL esté corriendo
docker-compose ps mysql

# Probar conexión
docker-compose exec app php artisan tinker
>>> DB::connection()->getPdo();

# Verificar variables de entorno
docker-compose exec app env | grep DB_
```

### Permisos denegados
```bash
# Ajustar permisos
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
docker-compose exec app chmod -R 775 storage bootstrap/cache
```

### Puerto ocupado
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :80
netstat -ano | findstr :3306

# Cambiar puerto en docker-compose.yml o detener el servicio conflictivo
```

### Contenedor se reinicia constantemente
```bash
# Ver logs para identificar el error
docker-compose logs --tail=50 app

# Verificar health checks
docker inspect $(docker-compose ps -q app) | grep -A 10 Health
```

### Espacio en disco lleno
```bash
# Ver uso de espacio
docker system df

# Limpiar recursos no usados
docker system prune -a --volumes
```

### Performance lenta
```bash
# Verificar uso de recursos
docker stats

# Optimizar cache de Laravel
docker-compose exec app php artisan optimize

# Verificar logs de errores
docker-compose logs app | grep -i error
```

---

## Referencias Adicionales

- [Documentación oficial de Docker](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Laravel Docker Best Practices](https://laravel.com/docs/deployment)
- [Documentación de seguridad del proyecto](./SECURITY_OVERVIEW.md)
- [Guía de logging](./LOGGING_GUIDE.md)

---

**Última actualización**: Marzo 2026

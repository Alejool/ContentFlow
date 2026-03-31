# Documentación de Infraestructura

Guías de Docker, deployment y optimización de infraestructura.

## Documentos Disponibles

- **DOCKER_GUIDE.md** - Guía completa de Docker y Docker Compose
- **QUEUE_OPTIMIZATION.md** - Optimización de colas y workers

## Docker

### Comandos Esenciales
```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Ejecutar comandos Artisan
docker-compose exec app php artisan migrate

# Reiniciar servicios
docker-compose restart app
```

### Servicios Disponibles
- `app` - Aplicación Laravel/PHP
- `mysql` - Base de datos MySQL
- `redis` - Cache y colas
- `nginx` - Servidor web

## Colas y Workers

### Horizon
```bash
# Iniciar Horizon
docker-compose exec app php artisan horizon

# Ver estado
docker-compose exec app php artisan horizon:status

# Reiniciar workers
docker-compose exec app php artisan queue:restart
```

### Monitoreo
```bash
# Monitorear cola
docker-compose exec app php artisan queue:monitor-publishing

# Ver jobs fallidos
docker-compose exec app php artisan queue:failed
```

## Optimización

### Cache
```bash
# Optimizar para producción
docker-compose exec app php artisan optimize

# Limpiar cache
docker-compose exec app php artisan optimize:clear
```

### Backup
```bash
# Backup de base de datos
docker-compose exec mysql mysqldump -u root -p contentflow > backup.sql

# Backup de archivos
docker-compose exec app tar -czf storage_backup.tar.gz storage/
```

Ver [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) para documentación completa.

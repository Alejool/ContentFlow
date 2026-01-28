# Docker Quick Reference

## Start Services
```bash
docker-compose up -d
```

## Stop Services
```bash
docker-compose down
```

## View Logs
```bash
docker-compose logs -f
```

## Run Artisan Commands
```bash
docker-compose exec app php artisan [command]
```

## Access Application
- **Web**: http://localhost
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Redis Commander**: http://localhost:8081

## Common Tasks

### Fresh Install
```bash
docker-compose exec app php artisan migrate:fresh --seed
```

### Clear Cache
```bash
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
```

### Access PostgreSQL
```bash
docker-compose exec pgsql psql -U contenflow -d ContentFlow
```

### Rebuild Everything
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

For detailed documentation, see [docker/README.md](docker/README.md)

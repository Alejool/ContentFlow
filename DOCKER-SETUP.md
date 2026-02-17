# 🐳 Configuración Docker - ContentFlow

## Problema Resuelto

El error **502 Bad Gateway** ocurría porque ambos entornos (dev y prod) usaban los mismos nombres de contenedores y volúmenes. Ahora cada entorno tiene sus propios recursos aislados.

## Diferencias entre Entornos

### 🔧 Desarrollo (docker-compose.dev.yml)
- Usa `Dockerfile.dev` con hot-reload (`--watch`)
- Contenedores: `contentflow_*_dev`
- Volúmenes: `contentflow_*_dev`
- Red: `contentflow_network_dev`
- Vite en modo desarrollo (puerto 5173)
- Opcache deshabilitado para cambios en tiempo real

### 🚀 Producción (docker-compose.yml)
- Usa `Dockerfile` optimizado
- Contenedores: `contentflow_*_prod`
- Volúmenes: `contentflow_*_prod`
- Red: `contentflow_network_prod`
- Assets pre-compilados
- Opcache habilitado

## Uso Rápido

### Windows
```cmd
# Levantar desarrollo
docker-switch.bat dev

# Levantar producción
docker-switch.bat prod
```

### Linux/Mac
```bash
# Dar permisos (solo primera vez)
chmod +x docker-switch.sh

# Levantar desarrollo
./docker-switch.sh dev

# Levantar producción
./docker-switch.sh prod
```

## Comandos Manuales

### Desarrollo
```bash
# Bajar todo
docker-compose down
docker-compose -f docker-compose.dev.yml down

# Levantar dev
docker-compose -f docker-compose.dev.yml up -d --build
```

### Producción
```bash
# Bajar todo
docker-compose down
docker-compose -f docker-compose.dev.yml down

# Levantar prod
docker-compose up -d --build
```

## Puertos

| Servicio | Puerto |
|----------|--------|
| Nginx | 80 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Reverb WebSocket | 8081 |
| Redis Commander | 8082 |
| Vite (solo dev) | 5173 |

## Verificar Estado

```bash
# Ver contenedores activos
docker ps

# Ver logs
docker-compose logs -f app
docker-compose -f docker-compose.dev.yml logs -f app

# Entrar al contenedor
docker exec -it contentflow_app_dev sh
docker exec -it contentflow_app_prod sh
```

## Limpiar Todo

```bash
# Bajar contenedores y eliminar volúmenes
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v

# Limpiar imágenes huérfanas
docker image prune -f
```

## Notas Importantes

1. Ambos entornos pueden coexistir sin conflictos
2. Los datos de PostgreSQL y Redis están separados por entorno
3. El código fuente se monta como volumen en ambos casos
4. En dev, los cambios de código se reflejan automáticamente con `--watch`

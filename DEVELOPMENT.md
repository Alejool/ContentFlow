# ContentFlow - Guía de Desarrollo

## 🚀 Inicio Rápido

### Opción 1: Comando único
```bash
make dev-setup
```

### Opción 2: Paso a paso
```bash
# 1. Iniciar servicios
make dev-up

# 2. Instalar dependencias
make dev-install

# 3. Configurar aplicación
make dev-artisan cmd="key:generate"
make dev-migrate

# 4. Ver URLs disponibles
make dev-urls
```

## 🔧 Comandos Principales

### Gestión de Servicios
```bash
make dev-up          # Iniciar todos los servicios
make dev-down        # Detener todos los servicios
make dev-restart     # Reiniciar servicios principales
make dev-status      # Ver estado de contenedores
make dev-logs        # Ver logs en tiempo real
```

### Desarrollo
```bash
make dev-shell       # Acceder al contenedor
make dev-artisan cmd="migrate"     # Ejecutar Artisan
make dev-composer cmd="require package"  # Composer
make dev-npm cmd="install"         # NPM
make dev-tinker      # Laravel Tinker
```

### Base de Datos
```bash
make dev-migrate     # Ejecutar migraciones
make dev-fresh       # Recrear DB con seeders (⚠️ destructivo)
make dev-psql        # Conectar a PostgreSQL
```

### Testing
```bash
make dev-test                    # Todos los tests
make dev-test filter="UserTest"  # Test específico
make dev-coverage               # Con coverage
```

## 🌐 URLs de Desarrollo

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Aplicación** | http://localhost | App principal |
| **Vite HMR** | http://localhost:5173 | Hot Module Replacement |
| **WebSocket** | ws://localhost:8081 | Reverb WebSockets |
| **Redis Commander** | http://localhost:8082 | UI de Redis (con `--profile tools`) |
| **Mailpit** | http://localhost:8025 | Captura de emails (con `--profile tools`) |

### Herramientas de Desarrollo
```bash
# Iniciar herramientas adicionales
make dev-tools-up

# Detener herramientas
make dev-tools-down
```

## 🔄 Diferencias con Producción

### Dockerfile.dev vs Dockerfile
- **Desarrollo**: Xdebug disponible, errores visibles, OPcache con revalidación
- **Producción**: Optimizado, sin debugging, OPcache sin revalidación

### docker-compose.dev.yml vs docker-compose.yml
- **Desarrollo**: Mailpit para emails, Redis Commander siempre disponible
- **Producción**: Servicios optimizados, herramientas en `--profile tools`

### Configuración PHP
- **Dev**: `display_errors=On`, `opcache.validate_timestamps=1`
- **Prod**: `display_errors=Off`, `opcache.validate_timestamps=0`

## 🔀 Cambiar Entre Entornos

### Usando Makefile
```bash
make switch-to-dev   # Cambiar a desarrollo
make switch-to-prod  # Cambiar a producción
```

### Usando script
```bash
bash scripts/switch-env.sh dev   # Desarrollo
bash scripts/switch-env.sh prod  # Producción
```

## 🐛 Debugging

### Habilitar Xdebug
1. Descomenta las líneas de Xdebug en `Dockerfile.dev`
2. Reconstruye la imagen:
   ```bash
   make dev-rebuild
   ```
3. Configura tu IDE para escuchar en puerto 9003

### Ver Logs Detallados
```bash
make dev-logs-app     # Solo aplicación
make dev-logs-queue   # Solo colas
make dev-logs-reverb  # Solo WebSockets
```

### Octane Hot Reload
El contenedor `app` usa `--watch` automáticamente. Los cambios en PHP se reflejan sin reiniciar.

Para recargar manualmente:
```bash
make dev-octane-reload
```

## 📧 Emails en Desarrollo

Mailpit captura todos los emails enviados:
- **Web UI**: http://localhost:8025
- **SMTP**: localhost:1025

Configuración en `.env.docker.dev`:
```env
MAIL_HOST=mailpit
MAIL_PORT=1025
```

## 🗄️ Base de Datos

### Conexión Directa
```bash
# Desde el host
psql -h localhost -U contenflow -d ContentFlow

# Desde contenedor
make dev-psql
```

### Datos Compartidos
Los volúmenes de PostgreSQL y Redis son compartidos entre dev y prod:
- `contentflow_pgsql_data_shared`
- `contentflow_redis_data_shared`

## ⚡ Performance Tips

### Volúmenes Nombrados
Las dependencias usan volúmenes nombrados para mejor performance en Windows:
- `cf_vendor_dev` - Composer packages
- `cf_node_modules_dev` - NPM packages
- `cf_public_build_dev` - Assets compilados

### Bind Mounts
Solo el código fuente usa bind mounts para hot-reload inmediato.

## 🔧 Troubleshooting

### Contenedor no inicia
```bash
make dev-logs-app
```

### Permisos de archivos
```bash
make dev-fix-permissions
```

### Limpiar y empezar de cero
```bash
make dev-down
make dev-rebuild
make dev-setup
```

### Puerto ocupado
Si el puerto 80 está ocupado:
```bash
# Editar docker-compose.dev.yml
ports:
  - "8080:80"  # Usar puerto 8080
```

## 📁 Estructura de Archivos Dev

```
├── docker-compose.dev.yml     # Orquestación desarrollo
├── Dockerfile.dev             # Imagen multi-stage dev
├── .env.docker.dev           # Variables de entorno dev
├── docker/php/php_dev.ini    # Configuración PHP dev
└── scripts/
    ├── switch-env.sh         # Cambiar entornos
    └── cleanup-root-docs.sh  # Limpiar documentación
```

## 🎯 Flujo de Trabajo Típico

1. **Inicio del día**:
   ```bash
   make dev-up
   make dev-logs-app  # Verificar que todo esté OK
   ```

2. **Desarrollo**:
   - Editar código (hot-reload automático)
   - Ver logs: `make dev-logs`
   - Tests: `make dev-test`

3. **Cambios en DB**:
   ```bash
   make dev-artisan cmd="make:migration CreateUsersTable"
   make dev-migrate
   ```

4. **Nuevas dependencias**:
   ```bash
   make dev-composer cmd="require vendor/package"
   make dev-npm cmd="install new-package"
   ```

5. **Final del día**:
   ```bash
   make dev-down  # Opcional, los contenedores pueden quedarse corriendo
   ```

## 🚨 Notas Importantes

- **Hot Reload**: Cambios en PHP se reflejan automáticamente con `--watch`
- **Assets**: Vite maneja HMR automáticamente en puerto 5173
- **Emails**: Todos van a Mailpit, no se envían realmente
- **Storage**: Usa filesystem local, no S3
- **Logs**: Más verbosos que en producción
- **Performance**: Optimizado para desarrollo, no para producción

## 📚 Recursos Adicionales

- [Docker Compose Dev Override](https://docs.docker.com/compose/extends/)
- [Laravel Octane](https://laravel.com/docs/octane)
- [Vite HMR](https://vitejs.dev/guide/features.html#hot-module-replacement)
- [Mailpit](https://github.com/axllent/mailpit)
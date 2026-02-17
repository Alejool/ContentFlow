# 🚀 Desarrollo Rápido con Docker + Octane

## ⚡ Inicio Rápido

### Windows
```bash
dev-start.bat
```

### Linux/Mac
```bash
chmod +x dev-start.sh
./dev-start.sh
```

## 🎯 Características

### ✅ Hot Reload Ultra-Rápido
- **Laravel Octane (Swoole)**: Servidor de alto rendimiento con `--watch` activado
- **Vite HMR**: Hot Module Replacement instantáneo para React
- **Volúmenes optimizados**: Uso de `cached` para mejor performance en Windows/Mac

### 💓 Indicador de Estado en Tiempo Real
El sistema incluye un **indicador visual** en la esquina inferior derecha que muestra:
- ✅ **Verde**: Sistema actualizado y funcionando
- 🔄 **Rojo**: Reconectando o servicios caídos
- Actualización cada 5 segundos

### 🔍 Health Check Endpoint
```bash
curl http://localhost/api/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "deployment": 1705315800,
  "services": {
    "database": true,
    "redis": true,
    "octane": true
  },
  "version": "1.0.0"
}
```

## 📊 Servicios Disponibles

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Aplicación | http://localhost | Laravel + React |
| Vite HMR | http://localhost:5173 | Hot Module Replacement |
| Health Check | http://localhost/api/health | Estado del sistema |
| Reverb | ws://localhost:8081 | WebSocket real-time |
| PostgreSQL | localhost:5432 | Base de datos |
| Redis | localhost:6379 | Cache/Queue |

## 🛠️ Comandos Útiles

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f vite
```

### Reiniciar un servicio
```bash
docker-compose -f docker-compose.dev.yml restart app
```

### Ejecutar comandos Artisan
```bash
docker-compose -f docker-compose.dev.yml exec app php artisan migrate
docker-compose -f docker-compose.dev.yml exec app php artisan cache:clear
```

### Detener todo
```bash
docker-compose -f docker-compose.dev.yml down
```

### Limpiar todo (incluyendo volúmenes)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

## 🔥 Optimizaciones Aplicadas

1. **Octane con Swoole**: 10x más rápido que PHP-FPM tradicional
2. **Watch Mode**: Detecta cambios automáticamente sin reiniciar
3. **Volúmenes cached**: Mejor performance en sistemas de archivos compartidos
4. **Health checks optimizados**: Intervalos de 5s para detección rápida
5. **Polling en Vite**: `CHOKIDAR_USEPOLLING=true` para Windows
6. **Redis como cache**: Respuestas instantáneas

## 🎨 Componente Visual

El `SystemHealthIndicator` se muestra automáticamente en todas las páginas autenticadas y:
- No requiere configuración adicional
- Se actualiza cada 5 segundos
- Muestra estado de servicios críticos
- Indica cuando hay cambios en el deployment

## 🐛 Troubleshooting

### Los cambios no se reflejan
```bash
# Reiniciar Octane
docker-compose -f docker-compose.dev.yml restart app

# Limpiar caché
docker-compose -f docker-compose.dev.yml exec app php artisan optimize:clear
```

### Vite no conecta
```bash
# Verificar que el puerto 5173 esté libre
# Reiniciar Vite
docker-compose -f docker-compose.dev.yml restart vite
```

### Base de datos no conecta
```bash
# Ver logs de PostgreSQL
docker-compose -f docker-compose.dev.yml logs pgsql

# Verificar health check
docker-compose -f docker-compose.dev.yml ps
```

## 📈 Performance

Con esta configuración deberías ver:
- **Hot reload**: < 500ms
- **Cambios PHP**: 1-2s (Octane watch)
- **Cambios React**: Instantáneo (Vite HMR)
- **Health check**: < 100ms

---

**Nota**: Para producción, usa `docker-compose.yml` en lugar de `docker-compose.dev.yml`

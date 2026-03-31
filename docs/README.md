# ContentFlow - Documentación del Sistema

Documentación técnica del sistema ContentFlow organizada por categorías.

## 📁 Estructura de Documentación

### 🔌 API (`/api`)
Documentación de la API REST y especificaciones OpenAPI.

- **API_ENTERPRISE_V1.md** - Documentación completa en español
- **API_ENTERPRISE_V1.en.md** - Complete documentation in English
- **api-auth-openapi.json** - Especificación OpenAPI en español
- **api-auth-openapi.en.json** - OpenAPI specification in English
- **api_definition.json** - Definición de la API

### 🔒 Seguridad (`/security`)
Guías de seguridad, autenticación de dos factores y mejores prácticas.

- **SECURITY_OVERVIEW.md** - Visión general del sistema de seguridad
- **SECURITY_PRODUCTION_CHECKLIST.md** - Checklist para producción
- **SECURITY_QUICK_REFERENCE.md** - Referencia rápida de seguridad
- **SECURITY_2FA_SETUP.md** - Configuración de autenticación de dos factores
- **SECURITY_ALERTS_SETUP.md** - Configuración de alertas de seguridad
- **SECURITY_AUDIT_BACKUP.md** - Auditoría y respaldo de seguridad
- **SECURITY_KEY_ROTATION.md** - Rotación de claves
- **2FA_GUIA_SIMPLE.md** - Guía simple de 2FA
- **2FA_REACTIVAR.md** - Cómo reactivar 2FA
- **2FA_SECURITY_CONSIDERATIONS.md** - Consideraciones de seguridad 2FA
- **2FA_TROUBLESHOOTING.md** - Solución de problemas 2FA

### 📝 Logging (`/logging`)
Sistema de logs, monitoreo y troubleshooting.

- **LOGGING_GUIDE.md** - Guía completa del sistema de logging
- **LOGGING_QUICK_REFERENCE.md** - Referencia rápida de logging
- **LOGGING_EXAMPLES_OUTPUT.md** - Ejemplos de salida de logs
- **LOGGING_MIGRATION_EXAMPLE.md** - Ejemplo de migración de logs
- **LOGGING_TROUBLESHOOTING.md** - Solución de problemas de logging

### 🎨 Frontend (`/frontend`)
Componentes, temas, accesibilidad y PWA.

- **THEME_ACCESSIBILITY_GUIDE.md** - Guía de temas y accesibilidad
- **SKELETON_LOADERS_GUIDE.md** - Guía de skeleton loaders
- **SERVICE_WORKER_GUIDE.md** - Guía de Service Workers y PWA

### ⚙️ Infraestructura (`/infrastructure`)
Docker, colas, optimización y deployment.

- **DOCKER_GUIDE.md** - Guía completa de Docker
- **QUEUE_OPTIMIZATION.md** - Optimización de colas y workers

### ✨ Funcionalidades (`/features`)
Documentación de características específicas del sistema.

- **REEL_GENERATOR.md** - Generador de Reels
- **SUBSCRIPTION_SYSTEM.md** - Sistema de suscripciones

### 🔧 Troubleshooting (`/troubleshooting`)
Solución de problemas específicos del sistema.

## 🚀 Inicio Rápido

### Para Desarrolladores

1. **Configurar entorno Docker**: Ver [DOCKER_GUIDE.md](./infrastructure/DOCKER_GUIDE.md)
2. **Configurar seguridad**: Ver [SECURITY_OVERVIEW.md](./security/SECURITY_OVERVIEW.md)
3. **Entender el sistema de logs**: Ver [LOGGING_GUIDE.md](./logging/LOGGING_GUIDE.md)

### Para Integración API

1. **Documentación API**: Ver [API_ENTERPRISE_V1.md](./api/API_ENTERPRISE_V1.md)
2. **Especificación OpenAPI**: Usar [api-auth-openapi.json](./api/api-auth-openapi.json)
3. **Portal interactivo**: Abrir [index.html](./index.html)

### Para Frontend

1. **Temas y accesibilidad**: Ver [THEME_ACCESSIBILITY_GUIDE.md](./frontend/THEME_ACCESSIBILITY_GUIDE.md)
2. **Componentes UI**: Ver [SKELETON_LOADERS_GUIDE.md](./frontend/SKELETON_LOADERS_GUIDE.md)
3. **PWA**: Ver [SERVICE_WORKER_GUIDE.md](./frontend/SERVICE_WORKER_GUIDE.md)

## 📖 Documentación por Rol

### Desarrollador Backend
- [DOCKER_GUIDE.md](./infrastructure/DOCKER_GUIDE.md) - Entorno de desarrollo
- [LOGGING_GUIDE.md](./logging/LOGGING_GUIDE.md) - Sistema de logs
- [QUEUE_OPTIMIZATION.md](./infrastructure/QUEUE_OPTIMIZATION.md) - Colas y workers
- [SECURITY_OVERVIEW.md](./security/SECURITY_OVERVIEW.md) - Seguridad

### Desarrollador Frontend
- [THEME_ACCESSIBILITY_GUIDE.md](./frontend/THEME_ACCESSIBILITY_GUIDE.md) - Temas y accesibilidad
- [SKELETON_LOADERS_GUIDE.md](./frontend/SKELETON_LOADERS_GUIDE.md) - Componentes UI
- [SERVICE_WORKER_GUIDE.md](./frontend/SERVICE_WORKER_GUIDE.md) - PWA y Service Workers

### DevOps
- [DOCKER_GUIDE.md](./infrastructure/DOCKER_GUIDE.md) - Docker y deployment
- [SECURITY_PRODUCTION_CHECKLIST.md](./security/SECURITY_PRODUCTION_CHECKLIST.md) - Checklist de producción
- [LOGGING_GUIDE.md](./logging/LOGGING_GUIDE.md) - Monitoreo y logs

### Integrador API
- [API_ENTERPRISE_V1.md](./api/API_ENTERPRISE_V1.md) - Documentación API
- [api-auth-openapi.json](./api/api-auth-openapi.json) - Especificación OpenAPI
- [index.html](./index.html) - Portal interactivo

## 🌐 Portal de Documentación Interactivo

Abre `index.html` en tu navegador para acceder al portal interactivo con:

- Detección automática de idioma
- Descarga de documentación
- Visualización de especificaciones OpenAPI
- Interfaz responsive

## 🔍 Búsqueda Rápida

### Comandos Docker
```bash
# Ver todos los comandos Docker
grep -r "docker-compose" docs/infrastructure/DOCKER_GUIDE.md
```

### Configuración de Seguridad
```bash
# Ver configuración de 2FA
cat docs/security/SECURITY_2FA_SETUP.md
```

### Ejemplos de Logging
```bash
# Ver ejemplos de logs
cat docs/logging/LOGGING_EXAMPLES_OUTPUT.md
```

## 📞 Soporte

Para preguntas o problemas:

- **Documentación**: Revisa esta carpeta `/docs`
- **API**: Consulta [API_ENTERPRISE_V1.md](./api/API_ENTERPRISE_V1.md)
- **Troubleshooting**: Revisa la carpeta `/troubleshooting`

## 🔄 Actualización de Documentación

Al actualizar el sistema:

1. Actualiza la documentación correspondiente
2. Mantén ejemplos actualizados
3. Verifica que los enlaces funcionen
4. Actualiza la fecha de última modificación

---

**Última actualización**: Marzo 2026  
**Versión del sistema**: 1.0

# Documentación de Seguridad

Guías y mejores prácticas de seguridad para Intellipost.

## Documentos Principales

### Visión General
- **SECURITY_OVERVIEW.md** - Arquitectura de seguridad del sistema
- **SECURITY_QUICK_REFERENCE.md** - Referencia rápida de seguridad

### Producción
- **SECURITY_PRODUCTION_CHECKLIST.md** - Checklist antes de deployment
- **SECURITY_ALERTS_SETUP.md** - Configuración de alertas
- **SECURITY_AUDIT_BACKUP.md** - Auditoría y respaldos

### Autenticación de Dos Factores (2FA)
- **SECURITY_2FA_SETUP.md** - Configuración inicial de 2FA
- **2FA_GUIA_SIMPLE.md** - Guía simple para usuarios
- **2FA_REACTIVAR.md** - Cómo reactivar 2FA
- **2FA_SECURITY_CONSIDERATIONS.md** - Consideraciones de seguridad
- **2FA_TROUBLESHOOTING.md** - Solución de problemas

### Gestión de Claves
- **SECURITY_KEY_ROTATION.md** - Rotación de claves y secrets

## Inicio Rápido

### Configurar 2FA
```bash
docker-compose exec app php artisan 2fa:enable
```

### Rotar Claves
```bash
docker-compose exec app php artisan key:rotate
```

### Auditoría de Seguridad
```bash
docker-compose exec app php artisan security:audit
```

## Mejores Prácticas

1. Habilitar 2FA para todos los usuarios admin
2. Rotar claves cada 90 días
3. Revisar logs de seguridad diariamente
4. Mantener dependencias actualizadas
5. Usar HTTPS en producción

Ver [SECURITY_OVERVIEW.md](./SECURITY_OVERVIEW.md) para más detalles.

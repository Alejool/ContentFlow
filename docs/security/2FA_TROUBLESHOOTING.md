# Solución de Problemas de 2FA

## 📱 ¿Qué es Google Authenticator?

**Google Authenticator es simplemente una aplicación que genera códigos de 6 dígitos.**

### NO necesitas:
- ❌ Una cuenta de Google
- ❌ Iniciar sesión con Google
- ❌ Vincular tu cuenta de Google
- ❌ Tener Gmail

### Solo necesitas:
1. ✅ Descargar cualquier app de autenticación:
   - **Google Authenticator** (iOS/Android)
   - **Microsoft Authenticator** (iOS/Android)
   - **Authy** (iOS/Android/Desktop)
   - **1Password** (si tienes suscripción)
   
2. ✅ Escanear el código QR que te mostramos
3. ✅ Usar los códigos de 6 dígitos que genera la app

### ¿Cómo funciona?
- La app genera códigos basados en la hora actual
- Los códigos cambian cada 30 segundos
- NO requiere internet después de escanear el QR
- Funciona completamente offline

---

## ⚠️ IMPORTANTE: Google Authenticator NO requiere cuenta de Google

**Google Authenticator es solo el nombre de la app.** NO necesitas:
- ❌ Iniciar sesión con Google
- ❌ Tener una cuenta de Google
- ❌ Vincular nada a Google

**Solo necesitas:**
- ✅ Descargar la app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
- ✅ Escanear el código QR
- ✅ Usar los códigos de 6 dígitos que genera

## Problema: "Invalid verification code" o "Ningún código funciona"

### Solución Rápida:

1. **Resetear 2FA para tu usuario:**
```bash
php artisan user:reset-2fa tu-email@ejemplo.com
```

2. **Verificar sincronización de tiempo:**
   - En tu teléfono: Configuración → Fecha y hora → Automático
   - En el servidor:
   ```bash
   date
   # Debe mostrar la hora correcta
   ```

3. **Probar con una app diferente:**
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - 1Password

### Causas comunes:

1. **Sincronización de tiempo incorrecta**
   - Los códigos TOTP dependen de que la hora del servidor y del dispositivo estén sincronizadas
   - Solución: Asegúrate de que tu dispositivo tenga la hora automática activada

2. **Código expirado**
   - Los códigos cambian cada 30 segundos
   - Solución: Espera a que aparezca un nuevo código e ingrésalo rápidamente

3. **Aplicación de autenticación incorrecta**
   - Asegúrate de estar usando el código de la cuenta correcta
   - Solución: Verifica que el nombre de la cuenta en tu app coincida con tu email

### Soluciones implementadas:

- **Ventana de tiempo ampliada**: El sistema ahora acepta códigos con una ventana de ±2 minutos (4 ventanas de 30 segundos)
- **Códigos de respaldo**: Puedes usar los códigos de respaldo que guardaste durante la configuración
- **Mensajes de error mejorados**: Los mensajes ahora son más descriptivos

## Configuración por usuario

Cada usuario tiene su propia configuración de 2FA:
- El secreto se almacena encriptado en la base de datos
- Los códigos de respaldo son únicos por usuario
- La verificación es independiente para cada cuenta

## Duración de la verificación

- **Antes**: La verificación expiraba al cerrar el navegador
- **Ahora**: La verificación dura 30 días en el mismo dispositivo
- Después de 30 días, se solicitará verificar nuevamente

## Verificar configuración

Para verificar que 2FA está funcionando correctamente:

1. Accede a `/2fa/setup` (solo si no tienes 2FA configurado)
2. Escanea el código QR con tu app de autenticación
3. Guarda los códigos de respaldo en un lugar seguro
4. Ingresa el código de 6 dígitos para verificar

## Aplicaciones de autenticación recomendadas

- Google Authenticator (iOS/Android)
- Microsoft Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- 1Password (con soporte TOTP)

## Comandos útiles para debugging

```bash
# Ver logs de 2FA
php artisan pail | grep "2fa"

# Verificar rutas de 2FA
php artisan route:list | grep "2fa"

# Limpiar sesiones (si hay problemas)
php artisan cache:clear
php artisan session:clear
```

## Desactivar 2FA (si tienes problemas)

**Opción 1: Comando artisan (Recomendado)**
```bash
# Para un usuario específico
php artisan user:reset-2fa tu-email@ejemplo.com

# Para todos los usuarios (requiere confirmación)
php artisan user:reset-2fa
```

**Opción 2: Tinker**
```bash
php artisan tinker

$user = User::where('email', 'tu-email@ejemplo.com')->first();
$user->update([
    'two_factor_secret' => null,
    'two_factor_backup_codes' => null,
    'two_factor_enabled_at' => null,
]);
```

**Opción 3: Directamente en la base de datos**
```sql
UPDATE users 
SET two_factor_secret = NULL, 
    two_factor_backup_codes = NULL, 
    two_factor_enabled_at = NULL 
WHERE email = 'tu-email@ejemplo.com';
```

## Soporte adicional

Si sigues teniendo problemas:
1. Verifica que la hora del servidor esté sincronizada: `date`
2. Revisa los logs de Laravel: `storage/logs/laravel.log`
3. Verifica que la librería Google2FA esté instalada: `composer show pragmarx/google2fa-laravel`

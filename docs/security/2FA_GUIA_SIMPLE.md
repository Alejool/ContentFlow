# Guía Simple de 2FA

## 🚀 Configuración en 3 Pasos

### Paso 1: Descargar una App de Autenticación

Descarga CUALQUIERA de estas apps (NO necesitas cuenta de Google):

- **Google Authenticator** - [iOS](https://apps.apple.com/app/google-authenticator/id388497605) | [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
- **Microsoft Authenticator** - [iOS](https://apps.apple.com/app/microsoft-authenticator/id983156458) | [Android](https://play.google.com/store/apps/details?id=com.azure.authenticator)
- **Authy** - [iOS](https://apps.apple.com/app/authy/id494168017) | [Android](https://play.google.com/store/apps/details?id=com.authy.authy)

### Paso 2: Escanear el Código QR

1. Abre la app que descargaste
2. Toca el botón "+" o "Agregar cuenta"
3. Selecciona "Escanear código QR"
4. Apunta la cámara al código QR en la pantalla
5. ¡Listo! Verás un código de 6 dígitos

### Paso 3: Ingresar el Código

1. Mira el código de 6 dígitos en tu app
2. Ingrésalo en la página web
3. Haz clic en "Activar 2FA"

## ❌ Si Ningún Código Funciona

### Solución 1: Verificar la Hora

**En tu teléfono:**
1. Ve a Configuración
2. Busca "Fecha y hora"
3. Activa "Fecha y hora automáticas"

**En tu computadora:**
- Windows: Configuración → Hora e idioma → Sincronizar ahora
- Mac: Preferencias del Sistema → Fecha y Hora → Ajustar automáticamente

### Solución 2: Resetear y Empezar de Nuevo

```bash
# Resetear 2FA para tu usuario
php artisan user:reset-2fa tu-email@ejemplo.com
```

Luego vuelve a `/2fa/setup` y escanea el nuevo código QR.

### Solución 3: Probar con Otra App

Si Google Authenticator no funciona, prueba con Microsoft Authenticator o Authy.

## 🔍 Preguntas Frecuentes

### ¿Necesito una cuenta de Google?
**NO.** Google Authenticator es solo el nombre de la app. Funciona sin cuenta de Google.

### ¿Necesito internet?
**NO.** Después de escanear el QR, la app funciona completamente offline.

### ¿Por qué el código cambia?
Los códigos cambian cada 30 segundos por seguridad. Usa el código actual.

### ¿Qué pasa si pierdo mi teléfono?
Usa los códigos de respaldo que guardaste durante la configuración.

### ¿Puedo usar la misma app para varias cuentas?
**SÍ.** Puedes agregar múltiples cuentas en la misma app.

### ¿El código QR es único para mí?
**SÍ.** Cada usuario tiene su propio código QR único. No lo compartas.

## 🆘 Soporte

Si sigues teniendo problemas:

1. **Revisa los logs:**
   ```bash
   php artisan pail | grep "2fa"
   ```

2. **Verifica la configuración:**
   ```bash
   php artisan route:list | grep "2fa"
   ```

3. **Resetea completamente:**
   ```bash
   php artisan user:reset-2fa tu-email@ejemplo.com
   php artisan cache:clear
   ```

4. **Consulta la documentación completa:**
   - `docs/2FA_TROUBLESHOOTING.md`
   - `docs/2FA_SECURITY_CONSIDERATIONS.md`

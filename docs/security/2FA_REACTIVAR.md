# Cómo Reactivar 2FA

El 2FA ha sido desactivado pero el código sigue disponible por si lo necesitas en el futuro.

## Estado Actual

✅ **2FA está DESACTIVADO**
- Los usuarios pueden acceder sin verificación de dos factores
- Las rutas de configuración siguen disponibles en `/2fa/setup`
- Los usuarios pueden configurar 2FA voluntariamente si lo desean

## Para Reactivar 2FA Obligatorio

### Paso 1: Editar el Middleware

Abre `app/Http/Middleware/Require2FA.php` y descomenta el código:

```php
public function handle(Request $request, Closure $next): Response
{
    // Eliminar esta línea:
    // return $next($request);
    
    // Descomentar todo el código que está en el comentario /* ... */
    $user = $request->user();
    
    // Solo aplicar a admins
    if (!$user || !$user->is_super_admin) {
        return $next($request);
    }
    
    // ... resto del código
}
```

### Paso 2: Agregar el Middleware a las Rutas

Abre `routes/web.php` y agrega `'require.2fa'` al middleware de admin:

```php
// Cambiar de:
Route::prefix('admin')->name('admin.')->middleware(['super-admin'])->group(function () {

// A:
Route::prefix('admin')->name('admin.')->middleware(['super-admin', 'require.2fa'])->group(function () {
```

### Paso 3: Limpiar Caché

```bash
php artisan route:clear
php artisan cache:clear
php artisan config:clear
```

## Para Hacer 2FA Opcional (Estado Actual)

El 2FA está configurado como opcional. Los usuarios pueden:
- Acceder a `/2fa/setup` para configurarlo voluntariamente
- Usar 2FA si lo desean
- Acceder sin 2FA si no lo tienen configurado

## Comandos Útiles

```bash
# Ver usuarios con 2FA activado
php artisan tinker
User::whereNotNull('two_factor_secret')->get(['id', 'name', 'email']);

# Resetear 2FA de un usuario
php artisan user:reset-2fa email@ejemplo.com

# Resetear 2FA de todos los usuarios
php artisan user:reset-2fa
```

## Configuración Recomendada

Si decides reactivar 2FA, considera:

1. **Solo para super admins**: El código actual solo lo requiere para `is_super_admin = true`
2. **Período de gracia**: Dar tiempo a los usuarios para configurarlo
3. **Notificaciones**: Avisar con anticipación que será obligatorio
4. **Soporte**: Tener documentación clara disponible

## Archivos Relacionados

- `app/Http/Middleware/Require2FA.php` - Middleware de verificación
- `app/Http/Controllers/Auth/TwoFactorController.php` - Controlador de 2FA
- `routes/web.php` - Rutas donde se aplica el middleware
- `docs/2FA_GUIA_SIMPLE.md` - Guía para usuarios
- `docs/2FA_TROUBLESHOOTING.md` - Solución de problemas

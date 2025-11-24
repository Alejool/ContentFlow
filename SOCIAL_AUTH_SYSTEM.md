# Sistema de Autenticación de Redes Sociales

## 📋 Resumen

El sistema de autenticación de redes sociales permite a los usuarios conectar sus cuentas de **Facebook**, **Instagram**, **Twitter/X**, **YouTube** y **TikTok** para publicar contenido automáticamente desde la aplicación.

## 🏗️ Arquitectura del Sistema

### Frontend (React)

#### Componentes Principales

1. **SocialMediaAccounts.jsx** (`resources/js/Pages/Manage-content/Partials/SocialMediaAccounts.jsx`)
   - Componente principal que muestra las redes sociales disponibles
   - Maneja la UI de conexión/desconexión
   - Abre ventanas popup para OAuth
   - Escucha mensajes de las ventanas popup

2. **useSocialMediaAuth.js** (`resources/js/Hooks/useSocialMediaAuth.js`)
   - Hook personalizado para manejar la autenticación
   - Gestiona el estado de autenticación
   - Maneja la comunicación con el backend

### Backend (Laravel)

#### Controlador Principal

**SocialAccountController.php** (`app/Http/Controllers/SocialAccountController.php`)

Métodos disponibles:

- `index()` - Obtiene todas las cuentas conectadas del usuario
- `getAuthUrl($platform)` - Genera la URL de autenticación OAuth para cada plataforma
- `handleFacebookCallback()` - Procesa el callback de Facebook
- `handleInstagramCallback()` - Procesa el callback de Instagram
- `handleTwitterCallback()` - Procesa el callback de Twitter
- `handleYoutubeCallback()` - Procesa el callback de YouTube
- `handleTiktokCallback()` - Procesa el callback de TikTok
- `store()` - Guarda los datos de la cuenta conectada
- `destroy($id)` - Desconecta/elimina una cuenta

#### Modelo

**SocialAccount.php** (`app/Models/SocialAccount.php`)

Campos:
- `user_id` - ID del usuario propietario
- `platform` - Plataforma (facebook, instagram, twitter, youtube, tiktok)
- `account_id` - ID de la cuenta en la plataforma
- `access_token` - Token de acceso OAuth
- `refresh_token` - Token de refresco (opcional)
- `token_expires_at` - Fecha de expiración del token

#### Rutas

**API Routes** (`routes/api.php`):
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/social-accounts', [SocialAccountController::class, 'index']);
    Route::get('/social-accounts/auth-url/{platform}', [SocialAccountController::class, 'getAuthUrl']);
    Route::post('/social-accounts', [SocialAccountController::class, 'store']);
    Route::delete('/social-accounts/{id}', [SocialAccountController::class, 'destroy']);
});
```

**Web Routes** (`routes/web.php`):
```php
Route::middleware(['web'])->group(function () {
    Route::get('/auth/facebook/callback', [SocialAccountController::class, 'handleFacebookCallback']);
    Route::get('/auth/instagram/callback', [SocialAccountController::class, 'handleInstagramCallback']);
    Route::get('/auth/twitter/callback', [SocialAccountController::class, 'handleTwitterCallback']);
    Route::get('/auth/youtube/callback', [SocialAccountController::class, 'handleYoutubeCallback']);
    Route::get('/auth/tiktok/callback', [SocialAccountController::class, 'handleTiktokCallback']);
});
```

## 🔄 Flujo de Autenticación

### 1. Usuario Hace Click en "Connect"

```
Usuario → SocialMediaAccounts.jsx → handleConnectionToggle()
```

### 2. Solicitud de URL de Autenticación

```javascript
// Frontend solicita URL de OAuth
GET /api/social-accounts/auth-url/{platform}

// Backend responde con URL
{
  "success": true,
  "url": "https://www.facebook.com/v18.0/dialog/oauth?..."
}
```

### 3. Apertura de Ventana Popup

```javascript
// Se abre ventana popup con la URL de OAuth
window.open(authUrl, 'platformAuth', 'width=600,height=700')
```

### 4. Usuario Autoriza en la Plataforma

El usuario inicia sesión y autoriza los permisos en la plataforma social.

### 5. Callback de OAuth

```
Plataforma → /auth/{platform}/callback → handlePlatformCallback()
```

### 6. Intercambio de Código por Token

```php
// Backend intercambia el código de autorización por access token
$response = Http::post('https://platform.com/oauth/token', [
    'client_id' => config('services.platform.client_id'),
    'client_secret' => config('services.platform.client_secret'),
    'code' => $request->code,
    'grant_type' => 'authorization_code',
]);
```

### 7. Guardado en Base de Datos

```php
// Se guarda la cuenta en la base de datos
SocialAccount::create([
    'user_id' => Auth::id(),
    'platform' => 'facebook',
    'account_id' => $userData['id'],
    'access_token' => $data['access_token'],
    'refresh_token' => $data['refresh_token'] ?? null,
    'token_expires_at' => now()->addSeconds($data['expires_in']),
]);
```

### 8. Cierre de Ventana Popup

```html
<!-- Vista oauth/callback.blade.php -->
<script>
    window.opener.postMessage({
        type: 'social_auth_callback',
        success: true,
        data: {...}
    }, '*');
    window.close();
</script>
```

### 9. Actualización de UI

```javascript
// Frontend recibe el mensaje y actualiza la UI
window.addEventListener('message', (event) => {
    if (event.data.type === 'social_auth_callback') {
        if (event.data.success) {
            toast.success('Account connected successfully');
            fetchConnectedAccounts(); // Recargar cuentas
        }
    }
});
```

## 🔐 Seguridad

### Protección CSRF

Se utiliza un `state` aleatorio para prevenir ataques CSRF:

```php
$state = Str::random(40);
session(['social_auth_state' => $state]);

// En el callback
if ($request->state !== session('social_auth_state')) {
    return $this->handleOAuthError('Invalid state');
}
```

### Autenticación

- Todas las rutas API requieren autenticación con Sanctum
- Los callbacks verifican que el usuario esté autenticado
- Los tokens se almacenan de forma segura en la base de datos

### Validación

```php
$request->validate([
    'platform' => 'required|string|in:facebook,instagram,twitter,youtube,tiktok',
    'account_id' => 'required|string',
    'access_token' => 'required|string',
    'refresh_token' => 'nullable|string',
    'token_expires_at' => 'nullable|date',
]);
```

## 📊 Permisos por Plataforma

### Facebook
- `pages_show_list` - Ver lista de páginas
- `pages_read_engagement` - Leer engagement de páginas
- `pages_manage_posts` - Gestionar publicaciones
- `public_profile` - Perfil público

### Instagram
- `user_profile` - Perfil de usuario
- `user_media` - Media del usuario

### Twitter/X
- `tweet.read` - Leer tweets
- `tweet.write` - Escribir tweets
- `users.read` - Leer información de usuario
- `offline.access` - Acceso offline (refresh token)

### YouTube
- `https://www.googleapis.com/auth/youtube` - Gestión completa de YouTube

### TikTok
- `user.info.basic` - Información básica del usuario
- `video.publish` - Publicar videos

## 🛠️ Configuración Requerida

### Variables de Entorno

Consulta `SOCIAL_MEDIA_SETUP.md` para obtener las credenciales de cada plataforma.

```env
# Facebook
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:8000/auth/facebook/callback

# Instagram
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:8000/auth/instagram/callback

# Twitter
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_REDIRECT_URI=http://localhost:8000/auth/twitter/callback

# Google/YouTube
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/youtube/callback

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=http://localhost:8000/auth/tiktok/callback
```

### Base de Datos

Ejecutar migración:

```bash
php artisan migrate
```

## 🧪 Testing

### Probar Conexión de Cuenta

1. Inicia sesión en la aplicación
2. Ve a "Manage Content"
3. Busca la sección "Connect Your Social Networks"
4. Haz click en "Connect" en cualquier red social
5. Autoriza la aplicación en la ventana popup
6. Verifica que el estado cambie a "Connected"

### Probar Desconexión

1. Haz click en "Disconnect" en una cuenta conectada
2. Verifica que el estado cambie a "Not Connected"
3. Verifica que el registro se elimine de la base de datos

### Verificar en Base de Datos

```sql
SELECT * FROM social_accounts WHERE user_id = YOUR_USER_ID;
```

## 🐛 Solución de Problemas Comunes

### 1. Popup Bloqueado

**Problema**: El navegador bloquea la ventana popup

**Solución**: 
- Permitir popups para localhost en la configuración del navegador
- Verificar que no haya extensiones bloqueando popups

### 2. Invalid State Error

**Problema**: Error "Invalid state" en el callback

**Solución**:
- Verificar que las sesiones funcionen correctamente
- Asegurarse de que `SESSION_DRIVER` esté configurado en `.env`
- Limpiar cookies y volver a intentar

### 3. Could Not Obtain Access Token

**Problema**: No se puede obtener el access token

**Solución**:
- Verificar que Client ID y Client Secret sean correctos
- Verificar que la URL de callback coincida exactamente
- Revisar los logs: `storage/logs/laravel.log`

### 4. Unauthorized (401)

**Problema**: Error 401 al hacer peticiones a la API

**Solución**:
- Verificar que el usuario esté autenticado
- Verificar que Sanctum esté configurado correctamente
- Verificar que el token CSRF sea válido

## 📝 Próximos Pasos

### Mejoras Recomendadas

1. **Renovación Automática de Tokens**
   - Implementar un job que renueve tokens antes de que expiren
   - Usar refresh tokens cuando estén disponibles

2. **Encriptación de Tokens**
   - Encriptar access tokens en la base de datos
   - Usar Laravel's encryption helpers

3. **Manejo de Errores Mejorado**
   - Logs más detallados
   - Notificaciones al usuario cuando un token expire

4. **Testing Automatizado**
   - Tests unitarios para cada método del controlador
   - Tests de integración para el flujo completo

5. **Rate Limiting**
   - Implementar rate limiting en las rutas de OAuth
   - Prevenir abuso del sistema

## 📚 Referencias

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [OAuth 2.0 RFC](https://oauth.net/2/)
- Consulta `SOCIAL_MEDIA_SETUP.md` para documentación específica de cada plataforma

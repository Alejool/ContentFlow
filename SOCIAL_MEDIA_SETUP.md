# Configuración de Redes Sociales - OAuth Setup

Este documento explica cómo configurar las credenciales de OAuth para cada red social en tu aplicación.

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```**env**
# Facebook OAuth
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:8000/auth/facebook/callback

# Instagram OAuth (usa Facebook Graph API)
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:8000/auth/instagram/callback

# Twitter/X OAuth 2.0
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:8000/auth/twitter/callback

# Google/YouTube OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/youtube/callback

# TikTok OAuth
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://localhost:8000/auth/tiktok/callback
```

## Cómo Obtener las Credenciales

### 1. Facebook / Instagram

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación o selecciona una existente
3. En el panel de la aplicación, ve a **Configuración → Básica**
4. Copia el **ID de la aplicación** y la **Clave secreta de la aplicación**
5. En **Productos**, agrega **Facebook Login**
6. En **Facebook Login → Configuración**, agrega las URLs de redirección:
   - `http://localhost:8000/auth/facebook/callback`
   - `http://localhost:8000/auth/instagram/callback`
7. Solicita los permisos necesarios:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `public_profile`
   - `instagram_basic` (para Instagram)
   - `instagram_content_publish` (para Instagram)

### 2. Twitter/X

1. Ve a [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Crea un nuevo proyecto y aplicación
3. En la configuración de la aplicación, habilita **OAuth 2.0**
4. Configura el **Callback URI**: `http://localhost:8000/auth/twitter/callback`
5. Copia el **Client ID** y **Client Secret**
6. Asegúrate de solicitar los siguientes scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`

### 3. YouTube (Google)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **YouTube Data API v3**
4. Ve a **Credenciales** y crea credenciales de **ID de cliente de OAuth 2.0**
5. Configura el **URI de redirección autorizado**: `http://localhost:8000/auth/youtube/callback`
6. Copia el **Client ID** y **Client Secret**
7. En la pantalla de consentimiento de OAuth, agrega el scope:
   - `https://www.googleapis.com/auth/youtube`

### 4. TikTok

1. Ve a [TikTok for Developers](https://developers.tiktok.com/)
2. Crea una nueva aplicación
3. En la configuración de la aplicación, ve a **Login Kit**
4. Configura el **Redirect URI**: `http://localhost:8000/auth/tiktok/callback`
5. Copia el **Client Key** y **Client Secret**
6. Solicita los siguientes scopes:
   - `user.info.basic`
   - `video.publish`

**Nota Importante sobre TikTok**: 
- TikTok requiere **PKCE (Proof Key for Code Exchange)** para OAuth 2.0
- El sistema genera automáticamente el `code_challenge` y `code_verifier`
- Asegúrate de que tu aplicación TikTok tenga habilitado el soporte para PKCE
- Usa la nueva API v2: `https://open.tiktokapis.com/v2/oauth/token/`

## Migración de Base de Datos

Asegúrate de que la tabla `social_accounts` existe en tu base de datos. Si no existe, crea una migración:

```bash
php artisan make:migration create_social_accounts_table
```

La migración debe incluir:

```php
Schema::create('social_accounts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('platform'); // facebook, instagram, twitter, youtube, tiktok
    $table->string('account_id');
    $table->text('access_token');
    $table->text('refresh_token')->nullable();
    $table->timestamp('token_expires_at')->nullable();
    $table->timestamps();
    
    $table->unique(['user_id', 'platform']);
});
```

Ejecuta la migración:

```bash
php artisan migrate
```

## Notas Importantes

### Producción

Cuando despliegues a producción, asegúrate de:

1. Actualizar todas las URLs de callback a tu dominio de producción
2. Configurar las URLs de callback en cada plataforma de desarrolladores
3. Usar HTTPS en producción (requerido por la mayoría de las plataformas)
4. Mantener las credenciales seguras y nunca commitearlas al repositorio

### Seguridad

- Los tokens de acceso se almacenan en la base de datos
- Considera encriptar los tokens usando Laravel's encryption
- Los refresh tokens permiten renovar el acceso sin reautenticación
- Implementa un sistema de renovación automática de tokens cuando expiren

### Testing

Para probar localmente:

1. Asegúrate de que tu aplicación Laravel esté corriendo en `http://localhost:8000`
2. Configura las URLs de callback en cada plataforma para apuntar a localhost
3. Algunas plataformas (como Facebook) requieren HTTPS incluso en desarrollo - usa ngrok o similar

## Solución de Problemas

### Error: "Invalid redirect URI"
- Verifica que la URL de callback en `.env` coincida exactamente con la configurada en la plataforma
- Asegúrate de incluir el protocolo (http:// o https://)

### Error: "Invalid state"
- Esto es una protección CSRF. Asegúrate de que las cookies de sesión funcionen correctamente
- Verifica que `SESSION_DRIVER` esté configurado correctamente en `.env`

### Error: "Could not obtain access token"
- Verifica que el Client ID y Client Secret sean correctos
- Asegúrate de que la aplicación tenga los permisos/scopes necesarios
- Revisa los logs de Laravel para más detalles: `storage/logs/laravel.log`

### La ventana popup se bloquea
- Asegúrate de permitir popups en tu navegador para localhost
- Algunos navegadores bloquean popups por defecto

## Recursos Adicionales

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [TikTok for Developers Documentation](https://developers.tiktok.com/doc)

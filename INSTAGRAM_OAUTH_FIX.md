# 🔧 Solución al Error de Instagram OAuth - "Invalid platform app"

## ❌ Error

```
Solicitud no válida: Los parámetros de la solicitud no son válidos: Invalid platform app
```

## 🎯 Causa del Problema

Este error ocurre porque **Instagram OAuth ya no funciona con la API básica de Instagram**. Desde 2020, Instagram requiere usar la **Facebook Graph API** con configuraciones específicas.

## ✅ Solución Correcta

Instagram ahora se autentica a través de **Facebook Login** con permisos especiales de Instagram Business/Creator.

### Opción 1: Usar Instagram Basic Display API (Recomendado para desarrollo)

Esta es la forma más simple para desarrollo y aplicaciones pequeñas.

#### Pasos de Configuración:

1. **Ve a Facebook Developers**: https://developers.facebook.com/

2. **Selecciona tu aplicación** (o crea una nueva)

3. **Agrega el producto "Instagram Basic Display"**:
   - En el panel izquierdo, click en "Agregar producto"
   - Busca "Instagram Basic Display"
   - Click en "Configurar"

4. **Configura Instagram Basic Display**:
   - **Valid OAuth Redirect URIs**: 
     ```
     http://localhost:8000/auth/instagram/callback
     ```
   - **Deauthorize Callback URL**: 
     ```
     http://localhost:8000/auth/instagram/deauthorize
     ```
   - **Data Deletion Request URL**: 
     ```
     http://localhost:8000/auth/instagram/delete
     ```

5. **Copia las credenciales**:
   - **Instagram App ID** → `INSTAGRAM_CLIENT_ID`
   - **Instagram App Secret** → `INSTAGRAM_CLIENT_SECRET`

6. **Agrega una cuenta de prueba de Instagram**:
   - En "User Token Generator"
   - Click en "Add Instagram Test User"
   - Inicia sesión con tu cuenta de Instagram
   - Acepta la invitación en Instagram

### Opción 2: Usar Facebook Login con Instagram Graph API (Para producción)

Esta opción es mejor para aplicaciones en producción que necesitan publicar contenido.

#### Pasos de Configuración:

1. **Ve a Facebook Developers**: https://developers.facebook.com/

2. **Configura Facebook Login**:
   - Agrega el producto "Facebook Login"
   - En "Configuración" de Facebook Login:
     - **Valid OAuth Redirect URIs**: 
       ```
       http://localhost:8000/auth/facebook/callback
       http://localhost:8000/auth/instagram/callback
       ```

3. **Conecta una Página de Facebook con Instagram**:
   - Tu cuenta de Instagram debe ser una cuenta **Business** o **Creator**
   - La cuenta de Instagram debe estar conectada a una Página de Facebook
   - En Instagram: Configuración → Cuenta → Cambiar a cuenta profesional

4. **Solicita permisos avanzados**:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`

5. **Usa las credenciales de Facebook**:
   ```env
   INSTAGRAM_CLIENT_ID=tu_facebook_app_id
   INSTAGRAM_CLIENT_SECRET=tu_facebook_app_secret
   ```

## 🔄 Actualización del Código

Necesitamos actualizar el flujo de Instagram para usar la API correcta:

### Actualizar `getAuthUrl()` para Instagram

```php
case 'instagram':
    // Instagram Basic Display API
    $url = 'https://api.instagram.com/oauth/authorize?' . http_build_query([
        'client_id' => config('services.instagram.client_id'),
        'redirect_uri' => url('/auth/instagram/callback'),
        'response_type' => 'code',
        'scope' => 'user_profile,user_media',
        'state' => $state
    ]);
    break;
```

### Actualizar `handleInstagramCallback()`

```php
public function handleInstagramCallback(Request $request)
{
    // Verify state to prevent CSRF
    if ($request->state !== session('social_auth_state')) {
        return $this->handleOAuthError('Invalid state');
    }
    
    // Check if there is an authorization code
    if (!$request->has('code')) {
        return $this->handleOAuthError('Authorization code not received');
    }
    
    try {
        // Exchange code for access token (Instagram Basic Display)
        $response = Http::asForm()->post('https://api.instagram.com/oauth/access_token', [
            'client_id' => config('services.instagram.client_id'),
            'client_secret' => config('services.instagram.client_secret'),
            'redirect_uri' => url('/auth/instagram/callback'),
            'code' => $request->code,
            'grant_type' => 'authorization_code',
        ]);
        
        $data = $response->json();
        
        if (!isset($data['access_token']) || !isset($data['user_id'])) {
            \Log::error('Instagram OAuth Error:', $data);
            return $this->handleOAuthError('Could not obtain access token: ' . json_encode($data));
        }
        
        // Get long-lived token (expires in 60 days)
        $longLivedResponse = Http::get('https://graph.instagram.com/access_token', [
            'grant_type' => 'ig_exchange_token',
            'client_secret' => config('services.instagram.client_secret'),
            'access_token' => $data['access_token']
        ]);
        
        $longLivedData = $longLivedResponse->json();
        $finalAccessToken = $longLivedData['access_token'] ?? $data['access_token'];
        $expiresIn = $longLivedData['expires_in'] ?? null;
        
        // Save the account to the database
        $account = $this->saveAccount([
            'platform' => 'instagram',
            'account_id' => $data['user_id'],
            'access_token' => $finalAccessToken,
            'refresh_token' => null,
            'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn) : null,
        ]);
        
        // Close the window and send message to the main window
        return $this->closeWindowWithMessage('success', [
            'platform' => 'instagram',
            'account_id' => $data['user_id'],
            'access_token' => $finalAccessToken,
            'refresh_token' => null,
            'token_expires_at' => $expiresIn ? now()->addSeconds($expiresIn)->toIso8601String() : null
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Instagram OAuth Exception:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return $this->handleOAuthError('Error processing authentication: ' . $e->getMessage());
    }
}
```

## 📋 Checklist de Configuración

### Para Instagram Basic Display API:

- [ ] Aplicación de Facebook creada
- [ ] Producto "Instagram Basic Display" agregado
- [ ] Redirect URIs configuradas correctamente
- [ ] Instagram App ID y Secret copiados al `.env`
- [ ] Cuenta de prueba de Instagram agregada
- [ ] Invitación aceptada en Instagram

### Variables de Entorno:

```env
# Para Instagram Basic Display
INSTAGRAM_CLIENT_ID=tu_instagram_app_id
INSTAGRAM_CLIENT_SECRET=tu_instagram_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:8000/auth/instagram/callback
```

## 🐛 Solución de Problemas

### Error: "Invalid platform app"

**Causa**: La aplicación no tiene Instagram Basic Display configurado.

**Solución**:
1. Ve a Facebook Developers
2. Agrega el producto "Instagram Basic Display"
3. Configura las URLs de callback
4. Usa las credenciales de Instagram Basic Display (no las de Facebook)

### Error: "The user is not a tester"

**Causa**: Tu cuenta de Instagram no está agregada como tester.

**Solución**:
1. En Facebook Developers → Instagram Basic Display
2. Click en "Add Instagram Test User"
3. Inicia sesión con tu cuenta de Instagram
4. Ve a Instagram y acepta la invitación

### Error: "Redirect URI mismatch"

**Causa**: La URI de callback no coincide exactamente.

**Solución**:
1. Verifica que `.env` tenga: `http://localhost:8000/auth/instagram/callback`
2. Verifica que Facebook Developers tenga la misma URI
3. No uses `https` en desarrollo sin certificado SSL

### Error: "Invalid client_id"

**Causa**: Estás usando el Facebook App ID en lugar del Instagram App ID.

**Solución**:
1. En Facebook Developers, ve a Instagram Basic Display
2. Copia el **Instagram App ID** (no el Facebook App ID)
3. Actualiza `INSTAGRAM_CLIENT_ID` en `.env`

## 📊 Diferencias entre APIs

| Característica | Instagram Basic Display | Facebook Graph API |
|----------------|------------------------|-------------------|
| **Uso** | Desarrollo, apps pequeñas | Producción, apps grandes |
| **Configuración** | Más simple | Más compleja |
| **Permisos** | user_profile, user_media | Muchos más disponibles |
| **Publicación** | ❌ No permite publicar | ✅ Permite publicar |
| **Cuentas** | Personal | Business/Creator |
| **Aprobación** | No requiere | Requiere revisión de Facebook |

## 🔄 Alternativa: Usar Facebook para Instagram

Si prefieres usar Facebook Graph API en lugar de Instagram Basic Display:

```env
# Usa las mismas credenciales de Facebook
INSTAGRAM_CLIENT_ID=${FACEBOOK_CLIENT_ID}
INSTAGRAM_CLIENT_SECRET=${FACEBOOK_CLIENT_SECRET}
```

Y actualiza el código para usar el flujo de Facebook con permisos de Instagram.

## 📚 Referencias

- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)

## ✅ Resumen

El error "Invalid platform app" se soluciona:

1. ✅ Usando **Instagram Basic Display API** en lugar de la API antigua
2. ✅ Configurando correctamente el producto en Facebook Developers
3. ✅ Agregando cuentas de prueba de Instagram
4. ✅ Usando las credenciales correctas (Instagram App ID, no Facebook App ID)
5. ✅ Actualizando el código para intercambiar por tokens de larga duración

**¡Sigue los pasos de configuración y el error debería resolverse!** 🎉

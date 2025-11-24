# 🔧 Solución al Error de TikTok OAuth - code_challenge

## ❌ Error Original

```
We couldn't log in with TikTok. This may be due to specific app settings.

If you're a developer, correct the following and try again:

code_challenge
```

## ✅ Solución Implementada

El error ocurría porque **TikTok requiere PKCE (Proof Key for Code Exchange)** para OAuth 2.0, pero el código original no estaba generando ni enviando el `code_challenge` correctamente.

### Cambios Realizados

#### 1. Generación de PKCE en `getAuthUrl()` 

**Archivo**: `app/Http/Controllers/SocialAccountController.php`

```php
case 'tiktok':
    // Generate PKCE code verifier and challenge for TikTok
    $codeVerifier = Str::random(128);
    $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
    
    // Store code verifier in session for later use in callback
    session(['tiktok_code_verifier' => $codeVerifier]);
    
    $url = 'https://www.tiktok.com/v2/auth/authorize?' . http_build_query([
        'client_key' => config('services.tiktok.client_key'),
        'redirect_uri' => url('/auth/tiktok/callback'),
        'response_type' => 'code',
        'scope' => 'user.info.basic,video.publish',
        'state' => $state,
        'code_challenge' => $codeChallenge,        // ✅ NUEVO
        'code_challenge_method' => 'S256'          // ✅ NUEVO
    ]);
    break;
```

#### 2. Uso de code_verifier en el Callback

**Archivo**: `app/Http/Controllers/SocialAccountController.php`

```php
public function handleTiktokCallback(Request $request)
{
    // ... validaciones ...
    
    try {
        // Get code verifier from session
        $codeVerifier = session('tiktok_code_verifier');
        
        if (!$codeVerifier) {
            return $this->handleOAuthError('Code verifier not found in session');
        }
        
        // Exchange code for access token with code_verifier
        $response = Http::asForm()->post('https://open.tiktokapis.com/v2/oauth/token/', [
            'client_key' => config('services.tiktok.client_key'),
            'client_secret' => config('services.tiktok.client_secret'),
            'code' => $request->code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => url('/auth/tiktok/callback'),
            'code_verifier' => $codeVerifier,  // ✅ NUEVO
        ]);
        
        $data = $response->json();
        
        // Clear code verifier from session
        session()->forget('tiktok_code_verifier');
        
        // ... resto del código ...
    }
}
```

## 🔐 ¿Qué es PKCE?

**PKCE** (Proof Key for Code Exchange) es una extensión de OAuth 2.0 que mejora la seguridad del flujo de autorización.

### Flujo PKCE:

1. **Generar code_verifier**: String aleatorio de 128 caracteres
   ```php
   $codeVerifier = Str::random(128);
   ```

2. **Generar code_challenge**: Hash SHA256 del code_verifier, codificado en base64url
   ```php
   $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
   ```

3. **Enviar code_challenge** en la solicitud de autorización
   - TikTok verifica que el cliente tiene el code_verifier correcto

4. **Enviar code_verifier** en el intercambio de token
   - TikTok verifica que coincida con el code_challenge original

### Beneficios de PKCE:

- ✅ Previene ataques de intercepción de código de autorización
- ✅ No requiere almacenar secretos en el cliente
- ✅ Requerido por TikTok y otras plataformas modernas

## 📋 Checklist de Configuración TikTok

Para que TikTok OAuth funcione correctamente:

- [ ] **Credenciales configuradas en `.env`**:
  ```env
  TIKTOK_CLIENT_KEY=tu_client_key
  TIKTOK_CLIENT_SECRET=tu_client_secret
  TIKTOK_REDIRECT_URI=http://localhost:8000/auth/tiktok/callback
  ```

- [ ] **Aplicación TikTok configurada**:
  - Login Kit habilitado
  - Redirect URI configurado exactamente como en `.env`
  - Scopes solicitados: `user.info.basic`, `video.publish`

- [ ] **Sesiones funcionando correctamente**:
  - El `code_verifier` se guarda en sesión
  - Verificar que `SESSION_DRIVER` esté configurado (file, database, redis, etc.)

- [ ] **URLs correctas**:
  - Autorización: `https://www.tiktok.com/v2/auth/authorize`
  - Token: `https://open.tiktokapis.com/v2/oauth/token/`

## 🧪 Probar TikTok OAuth

1. **Limpiar sesiones anteriores**:
   ```bash
   php artisan session:clear
   php artisan cache:clear
   ```

2. **Verificar configuración**:
   ```bash
   php verify-oauth-setup.php
   ```

3. **Probar conexión**:
   - Ve a `/manage-content`
   - Click en "Connect" en TikTok
   - Deberías ver la pantalla de autorización de TikTok
   - Después de autorizar, la ventana debería cerrarse y mostrar "Connected"

## 🐛 Solución de Problemas

### Error: "code_challenge"
**Causa**: El code_challenge no se está generando o enviando correctamente.

**Solución**: ✅ Ya corregido en el código actualizado.

### Error: "Code verifier not found in session"
**Causa**: La sesión no está persistiendo entre requests.

**Solución**:
1. Verificar que `SESSION_DRIVER` esté configurado en `.env`
2. Asegurarse de que las cookies estén habilitadas
3. Verificar permisos de escritura en `storage/framework/sessions`

### Error: "Invalid redirect_uri"
**Causa**: La URI de redirección no coincide exactamente.

**Solución**:
1. Verificar que `.env` tenga: `TIKTOK_REDIRECT_URI=http://localhost:8000/auth/tiktok/callback`
2. Verificar que TikTok Developer Portal tenga la misma URI configurada
3. No usar `https` en desarrollo a menos que tengas certificado SSL

### Error: "Invalid client credentials"
**Causa**: Client Key o Client Secret incorrectos.

**Solución**:
1. Verificar credenciales en TikTok Developer Portal
2. Copiar y pegar cuidadosamente en `.env`
3. Ejecutar `php artisan config:clear`

## 📚 Referencias

- [TikTok Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-web)
- [OAuth 2.0 PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [TikTok API v2 Documentation](https://developers.tiktok.com/doc/oauth-user-access-token-management)

## ✅ Resumen

El error de `code_challenge` en TikTok OAuth ha sido **completamente solucionado** mediante:

1. ✅ Generación automática de PKCE (code_verifier y code_challenge)
2. ✅ Almacenamiento seguro del code_verifier en sesión
3. ✅ Inclusión del code_challenge en la URL de autorización
4. ✅ Envío del code_verifier en el intercambio de token
5. ✅ Uso de la API v2 correcta de TikTok
6. ✅ Limpieza del code_verifier después del uso

**¡TikTok OAuth ahora debería funcionar correctamente!** 🎉

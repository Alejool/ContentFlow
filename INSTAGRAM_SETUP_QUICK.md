# 📋 Guía Rápida: Configuración de Instagram OAuth

## 🎯 Problema Solucionado

Error: **"Invalid platform app"** → Ahora usa Instagram Basic Display API correctamente

## ⚡ Pasos Rápidos de Configuración

### 1. Crear/Configurar Aplicación en Facebook Developers

1. Ve a: https://developers.facebook.com/apps/
2. Selecciona tu app o crea una nueva
3. En el menú lateral, busca **"Agregar producto"**
4. Encuentra **"Instagram Basic Display"** y haz click en **"Configurar"**

### 2. Configurar Instagram Basic Display

En la página de configuración de Instagram Basic Display:

#### **Valid OAuth Redirect URIs**:
```
http://localhost:8000/auth/instagram/callback
```

#### **Deauthorize Callback URL**:
```
http://localhost:8000/auth/instagram/deauthorize
```

#### **Data Deletion Request URL**:
```
http://localhost:8000/auth/instagram/delete
```

Haz click en **"Save Changes"**

### 3. Copiar Credenciales

En la misma página, encontrarás:
- **Instagram App ID** 
- **Instagram App Secret**

Copia estos valores.

### 4. Agregar al archivo `.env`

```env
INSTAGRAM_CLIENT_ID=tu_instagram_app_id_aqui
INSTAGRAM_CLIENT_SECRET=tu_instagram_app_secret_aqui
INSTAGRAM_REDIRECT_URI=http://localhost:8000/auth/instagram/callback
```

⚠️ **IMPORTANTE**: Usa el **Instagram App ID**, NO el Facebook App ID

### 5. Agregar Cuenta de Prueba de Instagram

1. En la página de Instagram Basic Display, busca **"User Token Generator"**
2. Haz click en **"Add Instagram Test User"**
3. Inicia sesión con tu cuenta de Instagram
4. Ve a Instagram (app o web)
5. Ve a **Configuración** → **Apps and Websites** → **Tester Invites**
6. **Acepta la invitación**

### 6. Limpiar Caché

```bash
php artisan config:clear
php artisan cache:clear
```

### 7. Probar Conexión

1. Ve a `/manage-content` en tu aplicación
2. Busca la sección "Connect Your Social Networks"
3. Haz click en **"Connect"** en Instagram
4. Deberías ver la pantalla de autorización de Instagram
5. Inicia sesión y autoriza
6. La ventana debería cerrarse y mostrar **"Connected"**

## ✅ Checklist de Verificación

- [ ] Aplicación de Facebook creada
- [ ] Producto "Instagram Basic Display" agregado y configurado
- [ ] Redirect URIs configuradas (las 3)
- [ ] Instagram App ID copiado (NO Facebook App ID)
- [ ] Instagram App Secret copiado
- [ ] Credenciales agregadas al `.env`
- [ ] Cuenta de Instagram agregada como tester
- [ ] Invitación aceptada en Instagram
- [ ] Caché limpiada
- [ ] Conexión probada exitosamente

## 🐛 Errores Comunes

### ❌ "Invalid platform app"
**Solución**: Asegúrate de haber agregado el producto "Instagram Basic Display" en Facebook Developers

### ❌ "The user is not a tester"
**Solución**: Agrega tu cuenta de Instagram como tester y acepta la invitación en Instagram

### ❌ "Redirect URI mismatch"
**Solución**: Verifica que la URI en `.env` coincida EXACTAMENTE con la configurada en Facebook Developers

### ❌ "Invalid client_id"
**Solución**: Estás usando el Facebook App ID. Usa el **Instagram App ID** que está en la sección de Instagram Basic Display

## 📊 Diferencia entre IDs

| Tipo | Dónde encontrarlo | Para qué se usa |
|------|-------------------|-----------------|
| **Facebook App ID** | Configuración básica de la app | Para Facebook OAuth |
| **Instagram App ID** | Instagram Basic Display → Configuración | Para Instagram OAuth |

⚠️ **Son diferentes** - No uses el Facebook App ID para Instagram

## 🔄 Actualización del Código

El código ya ha sido actualizado para:

✅ Usar `Http::asForm()` para el POST  
✅ Intercambiar por token de larga duración (60 días)  
✅ Registrar errores detallados en logs  
✅ Manejar excepciones correctamente  

## 📝 Notas Importantes

### Tokens de Larga Duración
- El sistema automáticamente intercambia el token de corta duración por uno de larga duración
- Los tokens de larga duración expiran en **60 días**
- Deberás implementar renovación automática de tokens en el futuro

### Limitaciones de Instagram Basic Display
- ❌ No permite publicar contenido
- ✅ Permite leer perfil y media del usuario
- ✅ Ideal para desarrollo y testing
- ✅ No requiere revisión de Facebook

### Para Publicar en Instagram
Si necesitas publicar contenido, deberás:
1. Convertir tu cuenta de Instagram a **Business** o **Creator**
2. Conectarla a una Página de Facebook
3. Usar **Instagram Graph API** en lugar de Basic Display
4. Solicitar permisos adicionales
5. Pasar por el proceso de revisión de Facebook

## 📚 Recursos

- [Instagram Basic Display API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Getting Started Guide](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)
- [User Token Generator](https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-profiles-and-media)

## 🎉 ¡Listo!

Si seguiste todos los pasos, Instagram OAuth debería funcionar correctamente.

Para más detalles técnicos, consulta: **`INSTAGRAM_OAUTH_FIX.md`**

# Intellipost API — Referencia Completa Enterprise v1

**Versión:** 1.0  
**Base URL:** `https://tu-dominio.com/api/v1`  
**Autenticación:** Bearer Token (Laravel Sanctum)  
**Fecha:** Marzo 2026

---

## Índice

1. [Autenticación y Tokens](#1-autenticación-y-tokens)
2. [Convenciones Generales](#2-convenciones-generales)
3. [Workspaces](#3-workspaces)
4. [Miembros y Roles](#4-miembros-y-roles)
5. [Flujos de Aprobación (Enterprise)](#5-flujos-de-aprobación-enterprise)
6. [Publicaciones](#6-publicaciones)
7. [Campañas](#7-campañas)
8. [Cuentas Sociales](#8-cuentas-sociales)
9. [Subida de Archivos (Upload)](#9-subida-de-archivos-upload)
10. [Analytics](#10-analytics)
11. [Notificaciones](#11-notificaciones)
12. [Calendario](#12-calendario)
13. [Suscripción y Límites](#13-suscripción-y-límites)
14. [Perfil de Usuario](#14-perfil-de-usuario)
15. [Manejo de Errores](#15-manejo-de-errores)
16. [Rate Limiting](#16-rate-limiting)
17. [Webhooks](#17-webhooks)
18. [Glosario de Estados](#18-glosario-de-estados)

---

## 1. Autenticación y Tokens

Intellipost usa **Laravel Sanctum** para la autenticación API. El sistema implementa un esquema de **access token + refresh token** con rotación automática para máxima seguridad.

> **Solo disponible para el plan Enterprise.** Los planes Free, Starter o Professional recibirán un error `402 Payment Required` al intentar generar tokens.

### Guía Rápida de Inicio

Para empezar a usar la API en 3 pasos:

1. **Genera tus tokens** con `POST /api/auth/token` (email + password + workspace)
2. **Usa el access_token** en todas tus peticiones: `Authorization: Bearer <token>`
3. **Renueva antes de expirar** con `POST /api/auth/token/refresh` (cada 23 horas)

### Tutorial Paso a Paso: Crear y Probar Tokens

#### Paso 1: Obtener tus Credenciales

Necesitas:
- Email del **Owner** del workspace (el usuario que lo creó)
- Contraseña de ese usuario
- ID o slug del workspace (ej: `marketing-global` o `12`)
- Plan Enterprise activo

#### Paso 2: Generar tu Primer Token

```bash
# Usando cURL
curl -X POST https://tu-dominio.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@empresa.com",
    "password": "tu-contraseña",
    "workspace": "marketing-global"
  }'
```

```javascript
// Usando JavaScript/Node.js
const response = await fetch('https://tu-dominio.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'owner@empresa.com',
    password: 'tu-contraseña',
    workspace: 'marketing-global'
  })
});

const result = await response.json();
console.log('Access Token:', result.data.access_token);
console.log('Refresh Token:', result.data.refresh_token);

// Guarda estos tokens de forma segura
localStorage.setItem('access_token', result.data.access_token);
localStorage.setItem('refresh_token', result.data.refresh_token);
```

```python
# Usando Python
import requests

response = requests.post('https://tu-dominio.com/api/auth/token', json={
    'email': 'owner@empresa.com',
    'password': 'tu-contraseña',
    'workspace': 'marketing-global'
})

data = response.json()
access_token = data['data']['access_token']
refresh_token = data['data']['refresh_token']

print(f'Access Token: {access_token}')
print(f'Refresh Token: {refresh_token}')
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "API tokens generated successfully. Store your refresh token securely.",
  "data": {
    "access_token": "1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "refresh_token": "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_expires_in": 2592000,
    "workspace": {
      "id": 12,
      "name": "Marketing Global",
      "slug": "marketing-global",
      "plan": "enterprise"
    }
  }
}
```

#### Paso 3: Probar el Token con una Petición

```bash
# Listar publicaciones usando el access token
curl -X GET https://tu-dominio.com/api/v1/publications \
  -H "Authorization: Bearer 1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
  -H "Accept: application/json"
```

```javascript
// JavaScript
const accessToken = localStorage.getItem('access_token');

const publications = await fetch('https://tu-dominio.com/api/v1/publications', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json'
  }
});

const data = await publications.json();
console.log('Publicaciones:', data);
```

#### Paso 4: Probar el Refresh Token

```bash
# Renovar el token antes de que expire (recomendado cada 23 horas)
curl -X POST https://tu-dominio.com/api/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
    "workspace": "marketing-global"
  }'
```

```javascript
// JavaScript - Función de renovación automática
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('https://tu-dominio.com/api/auth/token/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: refreshToken,
      workspace: 'marketing-global'
    })
  });

  const result = await response.json();
  
  // IMPORTANTE: Actualiza AMBOS tokens
  localStorage.setItem('access_token', result.data.access_token);
  localStorage.setItem('refresh_token', result.data.refresh_token);
  
  return result.data.access_token;
}

// Configurar renovación automática cada 23 horas
setInterval(refreshToken, 23 * 60 * 60 * 1000);
```

```python
# Python - Renovar token
import requests

refresh_token = "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0"

response = requests.post('https://tu-dominio.com/api/auth/token/refresh', json={
    'refresh_token': refresh_token,
    'workspace': 'marketing-global'
})

data = response.json()
new_access_token = data['data']['access_token']
new_refresh_token = data['data']['refresh_token']

# Actualiza tus tokens guardados
print(f'Nuevo Access Token: {new_access_token}')
print(f'Nuevo Refresh Token: {new_refresh_token}')
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully.",
  "data": {
    "access_token": "3|n3wAcc3ssT0k3nH3r3...",
    "refresh_token": "4|n3wR3fr3shT0k3nH3r3...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_expires_in": 2592000
  }
}
```

#### Paso 5: Validar que tu Token Funciona

```bash
# Verificar que el token es válido
curl -X GET https://tu-dominio.com/api/auth/token/validate \
  -H "Authorization: Bearer 1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
  -H "Accept: application/json"
```

```javascript
// JavaScript
async function validateToken() {
  const accessToken = localStorage.getItem('access_token');
  
  const response = await fetch('https://tu-dominio.com/api/auth/token/validate', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  const result = await response.json();
  console.log('Token válido:', result.data.valid);
  console.log('Expira en:', result.data.token_expires_at);
  return result.data;
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Token is valid.",
  "data": {
    "valid": true,
    "has_api_access": true,
    "token_name": "api-access:12:1741305600",
    "token_expires_at": "2026-03-07T21:00:00+00:00",
    "user": {
      "id": 5,
      "name": "Ana García",
      "email": "owner@empresa.com"
    },
    "workspace": {
      "id": 12,
      "name": "Marketing Global",
      "slug": "marketing-global",
      "plan": "enterprise",
      "api_access": true
    }
  }
}
```

### Flujo de Autenticación Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AUTENTICACIÓN INICIAL                                        │
│    POST /api/auth/token                                         │
│    Body: { email, password, workspace }                         │
│    ↓                                                            │
│    Respuesta: { access_token, refresh_token }                   │
│    • access_token: válido por 24 horas                          │
│    • refresh_token: válido por 30 días                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. USO DEL ACCESS TOKEN                                         │
│    Todas las peticiones a la API:                              │
│    Header: Authorization: Bearer <access_token>                 │
│    ↓                                                            │
│    Mientras el token sea válido (< 24h), úsalo normalmente     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. RENOVACIÓN AUTOMÁTICA (antes de que expire)                 │
│    POST /api/auth/token/refresh                                 │
│    Body: { refresh_token, workspace }                           │
│    ↓                                                            │
│    Respuesta: { access_token, refresh_token }                   │
│    • NUEVO access_token (24h más)                               │
│    • NUEVO refresh_token (30 días más)                          │
│    • El refresh_token anterior queda INVALIDADO (rotación)      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CIERRE DE SESIÓN (opcional)                                 │
│    POST /api/auth/token/revoke                                  │
│    Header: Authorization: Bearer <access_token>                 │
│    ↓                                                            │
│    Todos los tokens API del usuario son revocados              │
└─────────────────────────────────────────────────────────────────┘
```

### Mejores Prácticas

1. **Almacenamiento Seguro**
   - Guarda el `refresh_token` en un lugar seguro (variables de entorno, secrets manager)
   - NUNCA expongas el refresh token en logs o URLs
   - El access token puede guardarse en memoria (es de corta duración)

2. **Renovación Proactiva**
   - Renueva el access token ANTES de que expire (ej: a las 23 horas)
   - No esperes a recibir un error 401 para renovar
   - Implementa un timer o scheduler que renueve automáticamente

3. **Manejo de Errores**
   - Si el refresh falla con 401: vuelve a autenticar desde cero
   - Si recibes 402: el plan cambió, necesitas upgrade
   - Si recibes 403: el usuario no es owner del workspace

4. **Rotación de Tokens**
   - Cada vez que refrescas, recibes un NUEVO par de tokens
   - El refresh token anterior queda invalidado inmediatamente
   - Actualiza ambos tokens en tu almacenamiento

---

### 1.1 Generar Tokens (Autenticación Inicial)

> 🟢 **Endpoint público** — No requiere autenticación previa.

Este es el primer paso para obtener acceso a la API. Solo el **Owner** (creador) del workspace puede generar tokens API.

```http
POST /api/auth/token
Content-Type: application/json
```

**Cuerpo de la solicitud:**
```json
{
  "email": "owner@empresa.com",
  "password": "tu-contraseña-segura",
  "workspace": "marketing-global"
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `email` | string | ✅ | Email del **Owner** del workspace |
| `password` | string | ✅ | Contraseña del usuario |
| `workspace` | string | ✅ | ID numérico **o** slug del workspace |

**Ejemplo con cURL:**
```bash
curl -X POST https://tu-dominio.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@empresa.com",
    "password": "tu-contraseña-segura",
    "workspace": "marketing-global"
  }'
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('https://tu-dominio.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'owner@empresa.com',
    password: 'tu-contraseña-segura',
    workspace: 'marketing-global'
  })
});

const { data } = await response.json();
// Guarda estos tokens de forma segura
const accessToken = data.access_token;   // Usar en cada request
const refreshToken = data.refresh_token; // Guardar para renovar
```

**Validaciones internas:**
1. Las credenciales email+password son verificadas contra la base de datos.
2. Se verifica que el usuario sea el **creador** (`created_by`) del workspace.
3. Se verifica que el plan activo sea **Enterprise** — si no, se devuelve `402`.
4. Se revocan automáticamente los tokens programáticos previos para evitar tokens huérfanos.

**Respuesta exitosa `201`:**
```json
{
  "success": true,
  "message": "API tokens generated successfully. Store your refresh token securely.",
  "data": {
    "access_token": "1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "refresh_token": "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_expires_in": 2592000,
    "workspace": {
      "id": 12,
      "name": "Marketing Global",
      "slug": "marketing-global",
      "plan": "enterprise"
    },
    "user": {
      "id": 5,
      "name": "Ana García",
      "email": "owner@empresa.com"
    }
  }
}
```

**Campos de la respuesta:**

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `access_token` | string | Token de corta duración. Expira en **24 horas** (86400 seg). Úsalo en cada request. |
| `refresh_token` | string | Token de larga duración. Expira en **30 días** (2592000 seg). Úsalo solo para renovar. |
| `token_type` | string | Siempre "Bearer". Indica el tipo de autenticación. |
| `expires_in` | integer | Segundos hasta que expire el access_token (86400 = 24 horas). |
| `refresh_expires_in` | integer | Segundos hasta que expire el refresh_token (2592000 = 30 días). |

**Errores posibles:**

| Código | Mensaje | Causa |
| :--- | :--- | :--- |
| `401` | Invalid credentials | Email o contraseña incorrectos |
| `403` | Only the workspace owner can generate API tokens | El usuario no es el creador del workspace |
| `402` | API access is only available for Enterprise plans | El workspace no tiene plan Enterprise activo |
| `404` | Workspace not found | El workspace no existe o el slug es incorrecto |

**Ejemplo de error:**
```json
{
  "success": false,
  "message": "API access is only available for Enterprise plans. Your current plan is \"professional\". Please upgrade to enable API access.",
  "data": {
    "current_plan": "professional",
    "required_plan": "enterprise",
    "upgrade_url": "https://tu-dominio.com/pricing"
  }
}
```

---

### 1.2 Refrescar Access Token (Renovación con Rotación)

> 🟢 **Endpoint público** — Solo requiere el refresh_token válido.

Cuando tu access token está por expirar (o ya expiró), usa este endpoint para obtener un nuevo par de tokens. El sistema implementa **rotación automática**: el refresh token anterior se invalida y recibes uno nuevo.

```http
POST /api/auth/token/refresh
Content-Type: application/json
```

**Cuerpo de la solicitud:**
```json
{
  "refresh_token": "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
  "workspace": "marketing-global"
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `refresh_token` | string | ✅ | El refresh token obtenido en `/auth/token` o en un refresh previo |
| `workspace` | string | ✅ | ID numérico **o** slug del workspace |

**Ejemplo con cURL:**
```bash
curl -X POST https://tu-dominio.com/api/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
    "workspace": "marketing-global"
  }'
```

**Ejemplo con JavaScript (renovación automática):**
```javascript
// Función para renovar tokens automáticamente
async function refreshAccessToken(refreshToken, workspace) {
  const response = await fetch('https://tu-dominio.com/api/auth/token/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: refreshToken,
      workspace: workspace
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const { data } = await response.json();
  
  // IMPORTANTE: Actualiza AMBOS tokens
  const newAccessToken = data.access_token;
  const newRefreshToken = data.refresh_token;
  
  // Guarda los nuevos tokens (el refresh anterior ya no sirve)
  saveTokens(newAccessToken, newRefreshToken);
  
  return newAccessToken;
}

// Ejemplo de uso con renovación automática cada 23 horas
setInterval(async () => {
  try {
    const refreshToken = getStoredRefreshToken();
    await refreshAccessToken(refreshToken, 'marketing-global');
    console.log('Tokens renovados exitosamente');
  } catch (error) {
    console.error('Error renovando tokens:', error);
    // Si falla, re-autenticar desde cero
    await authenticateFromScratch();
  }
}, 23 * 60 * 60 * 1000); // 23 horas
```

**Lógica de rotación (Token Rotation):**

1. El sistema verifica el hash del refresh token y que no haya expirado
2. Valida que el plan del workspace sigue siendo Enterprise
3. El refresh token actual es **eliminado** (invalidado permanentemente)
4. Se emiten un **nuevo access token** (24h) y un **nuevo refresh token** (30 días)
5. Debes actualizar ambos tokens en tu almacenamiento

> ⚠️ **IMPORTANTE:** Después de refrescar, el refresh token anterior queda **completamente invalidado**. Si intentas usarlo de nuevo, recibirás un error 401. Siempre usa el refresh token más reciente.

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully.",
  "data": {
    "access_token": "3|n3wAcc3ssT0k3nH3r3...",
    "refresh_token": "4|n3wR3fr3shT0k3nH3r3...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_expires_in": 2592000
  }
}
```

**Errores posibles:**

| Código | Mensaje | Causa | Solución |
| :--- | :--- | :--- | :--- |
| `401` | Invalid refresh token format | El formato del token es incorrecto | Verifica que incluyes el ID y el token separados por `\|` |
| `401` | Refresh token not found or already revoked | El token ya fue usado o revocado | Autentica desde cero con `/auth/token` |
| `401` | The provided token is not a refresh token | Intentaste usar un access token | Usa el refresh token, no el access token |
| `401` | Invalid refresh token | El hash del token no coincide | El token fue modificado o es inválido |
| `401` | Refresh token has expired | El token expiró (>30 días) | Autentica desde cero con `/auth/token` |
| `402` | Your workspace plan has changed | El plan ya no es Enterprise | Actualiza el plan del workspace |
| `403` | This refresh token is not valid for the specified workspace | El token no pertenece a ese workspace | Verifica el workspace correcto |

**Ejemplo de error:**
```json
{
  "success": false,
  "message": "Refresh token has expired. Please authenticate again.",
  "data": null
}
```

**Estrategia recomendada de renovación:**

```javascript
// Opción 1: Renovación proactiva (recomendado)
// Renueva 1 hora antes de que expire
const RENEW_BEFORE_EXPIRY = 60 * 60 * 1000; // 1 hora en ms
const TOKEN_LIFETIME = 24 * 60 * 60 * 1000; // 24 horas en ms

setTimeout(() => {
  refreshAccessToken(refreshToken, workspace);
}, TOKEN_LIFETIME - RENEW_BEFORE_EXPIRY);

// Opción 2: Renovación reactiva (menos eficiente)
// Detecta error 401 y renueva
async function apiRequest(url, options) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // Si recibimos 401, intentar renovar
  if (response.status === 401) {
    accessToken = await refreshAccessToken(refreshToken, workspace);
    
    // Reintentar la petición original
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  return response;
}
```

---

### 1.3 Validar Token Activo

> 🔒 **Requiere:** `Authorization: Bearer <access_token>`

```http
GET /api/auth/token/validate
```

Útil para verificar que tu token sigue activo y que el plan Enterprise sigue vigente antes de hacer llamadas críticas.

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "has_api_access": true,
    "token_name": "api-access:12:1741305600",
    "token_expires_at": "2026-03-07T21:00:00+00:00",
    "user": { "id": 5, "name": "Ana García", "email": "owner@empresa.com" },
    "workspace": {
      "id": 12,
      "name": "Marketing Global",
      "slug": "marketing-global",
      "plan": "enterprise",
      "api_access": true
    }
  }
}
```

---

### 1.4 Revocar Tokens (Logout)

> 🔒 **Requiere:** `Authorization: Bearer <access_token>`

```http
POST /api/auth/token/revoke
```

Revoca todos los tokens API programáticos del usuario. Opcionalmente puedes acotar a un workspace.

**Query params opcionales:**

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `workspace` | string | Slug o ID del workspace. Si se omite, revoca todos. |

**Ejemplo:**
```
POST /api/auth/token/revoke?workspace=marketing-global
```

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "message": "Revoked 2 API token(s) successfully.",
  "data": { "revoked_count": 2 }
}
```

---

### 1.5 Usar el Access Token en Requests

Una vez que tienes tu access token, debes incluirlo en el header `Authorization` de todas las peticiones a endpoints protegidos.

**Headers requeridos:**

```http
Authorization: Bearer <access_token>
Accept: application/json
Content-Type: application/json
```

**Headers opcionales pero recomendados:**

```http
X-User-Timezone: America/New_York
```

> **`X-User-Timezone`**: Opcional pero recomendado para interpretación correcta de fechas programadas. Usa formato IANA (ej: `America/Mexico_City`, `Europe/Madrid`, `Asia/Tokyo`).

**Ejemplo completo con cURL:**
```bash
curl -X GET https://tu-dominio.com/api/v1/publications \
  -H "Authorization: Bearer 1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-User-Timezone: America/Bogota"
```

**Ejemplo con JavaScript (fetch):**
```javascript
const accessToken = '1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';

async function getPublications() {
  const response = await fetch('https://tu-dominio.com/api/v1/publications', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-User-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
```

**Ejemplo con JavaScript (axios):**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://tu-dominio.com/api/v1',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-User-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
  }
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(config => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar renovación automática
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Si recibimos 401 y no hemos reintentado
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Renovar el token
        const refreshToken = getStoredRefreshToken();
        const newToken = await refreshAccessToken(refreshToken, 'marketing-global');
        
        // Actualizar el header y reintentar
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla la renovación, redirigir a login
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Uso
const publications = await api.get('/publications');
```

**Ejemplo con Python (requests):**
```python
import requests
from datetime import datetime, timezone

ACCESS_TOKEN = "1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
BASE_URL = "https://tu-dominio.com/api/v1"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-User-Timezone": "America/Bogota"
}

# GET request
response = requests.get(f"{BASE_URL}/publications", headers=headers)
publications = response.json()

# POST request
new_publication = {
    "title": "Mi nueva publicación",
    "body": "Contenido de la publicación",
    "status": "draft"
}

response = requests.post(
    f"{BASE_URL}/publications",
    headers=headers,
    json=new_publication
)

if response.status_code == 201:
    print("Publicación creada exitosamente")
else:
    print(f"Error: {response.json()}")
```

**Ejemplo con PHP (Guzzle):**
```php
<?php
use GuzzleHttp\Client;

$accessToken = '1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';
$baseUrl = 'https://tu-dominio.com/api/v1';

$client = new Client([
    'base_uri' => $baseUrl,
    'headers' => [
        'Authorization' => "Bearer {$accessToken}",
        'Accept' => 'application/json',
        'Content-Type' => 'application/json',
        'X-User-Timezone' => 'America/Bogota'
    ]
]);

// GET request
$response = $client->get('/publications');
$publications = json_decode($response->getBody(), true);

// POST request
$response = $client->post('/publications', [
    'json' => [
        'title' => 'Mi nueva publicación',
        'body' => 'Contenido de la publicación',
        'status' => 'draft'
    ]
]);

if ($response->getStatusCode() === 201) {
    echo "Publicación creada exitosamente\n";
}
```

**Errores comunes:**

| Error | Causa | Solución |
| :--- | :--- | :--- |
| `401 Unauthenticated` | Token faltante, inválido o expirado | Verifica el header Authorization y renueva si expiró |
| `403 Forbidden` | Token válido pero sin permisos | Verifica que el usuario tenga los permisos necesarios |
| `402 Payment Required` | Plan cambió a no-Enterprise | Actualiza el plan del workspace |

### Endpoint Público de Salud

Para verificar que la API está funcionando sin autenticación:

```http
GET /api/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-06T21:00:00Z"
}
```

---

## 2. Convenciones Generales

### Estructura de Respuesta Exitosa

```json
{
  "success": true,
  "message": "Descripción de la acción",
  "data": { ... }
}
```

### Estructura de Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": {
    "campo": ["Mensaje de validación"]
  }
}
```

### Paginación

Los listados devuelven resultados paginados. Los parámetros de consulta son:

| Parámetro | Tipo | Default | Descripción |
| :--- | :--- | :--- | :--- |
| `page` | integer | 1 | Número de página |
| `per_page` | integer | 10 | Resultados por página (máx. recomendado: 50) |

**Respuesta paginada:**
```json
{
  "data": [...],
  "current_page": 1,
  "last_page": 5,
  "per_page": 10,
  "total": 48,
  "from": 1,
  "to": 10
}
```

---

## 3. Workspaces

El workspace es el contenedor principal de proyectos. Un usuario puede pertenecer a múltiples workspaces.

### 3.1 Listar Workspaces

```http
GET /api/v1/workspaces
```

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "id": 12,
        "name": "Marketing Global",
        "slug": "marketing-global",
        "description": "Workspace para el equipo de marketing internacional",
        "created_by": 5,
        "public": false,
        "allow_public_invites": false,
        "slack_webhook_url": "https://hooks.slack.com/...",
        "discord_webhook_url": null,
        "white_label_logo_url": "https://cdn.../logo.png",
        "white_label_favicon_url": null,
        "white_label_primary_color": "#1A73E8",
        "users_count": 8,
        "users": [
          {
            "id": 5,
            "name": "Ana García",
            "photo_url": "https://...",
            "pivot": { "role_id": 1 }
          }
        ],
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2026-02-20T14:30:00Z"
      }
    ],
    "roles": [
      { "id": 1, "name": "Owner", "slug": "owner" },
      { "id": 2, "name": "Admin", "slug": "admin" },
      { "id": 3, "name": "Editor", "slug": "editor" },
      { "id": 4, "name": "Viewer", "slug": "viewer" }
    ]
  }
}
```

---

### 3.2 Crear Workspace

```http
POST /api/v1/workspaces
```

**Cuerpo de la solicitud:**
```json
{
  "name": "Nuevo Equipo de Ventas",
  "description": "Workspace para el equipo de ventas LATAM"
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | string | ✅ | Nombre del workspace (máx. 255 chars) |
| `description` | string | ❌ | Descripción (máx. 1000 chars) |

**Respuesta exitosa `201`:**
```json
{
  "success": true,
  "message": "Workspace creado exitosamente",
  "data": {
    "id": 25,
    "name": "Nuevo Equipo de Ventas",
    "slug": "nuevo-equipo-de-ventas",
    "description": "Workspace para el equipo de ventas LATAM",
    "created_by": 5,
    "created_at": "2026-03-06T21:00:00Z"
  }
}
```

> **Nota:** Al crear un workspace, el usuario que lo crea es asignado automáticamente como `Owner` y el `current_workspace_id` del usuario se actualiza al nuevo workspace.

---

### 3.3 Cambiar Workspace Activo

```http
POST /api/v1/workspaces/{idOrSlug}/switch
```

Cambia el contexto del usuario al workspace especificado. Esto afecta todos los endpoints que trabajan sobre el `current_workspace_id`.

**Parámetros de path:**

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `idOrSlug` | integer \| string | ID numérico o slug del workspace |

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "message": "Switched to Marketing Global",
  "data": null
}
```

---

### 3.4 Ver Configuración del Workspace

```http
GET /api/v1/workspaces/{idOrSlug}/settings
```

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": 12,
      "name": "Marketing Global",
      "slug": "marketing-global",
      "description": "...",
      "users": [ ... ]
    },
    "roles": [
      {
        "id": 1,
        "name": "Owner",
        "slug": "owner",
        "permissions": [
          { "id": 1, "name": "Manage Content", "slug": "manage-content" },
          { "id": 2, "name": "Publish", "slug": "publish" },
          { "id": 3, "name": "Approve", "slug": "approve" }
        ]
      }
    ]
  }
}
```

---

### 3.5 Actualizar Workspace

Solo el **Owner** (creador) puede actualizar la configuración.

```http
PUT /api/v1/workspaces/{idOrSlug}
```

**Cuerpo de la solicitud:**
```json
{
  "name": "Marketing Internacional",
  "description": "Descripción actualizada",
  "public": false,
  "allow_public_invites": false
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | string | ✅ | Nombre del workspace |
| `description` | string | ❌ | Descripción |
| `public` | boolean | ❌ | Si el workspace es público |
| `allow_public_invites` | boolean | ❌ | Permite invitaciones sin email |

---

### 3.6 Log de Actividad del Workspace

```http
GET /api/v1/workspaces/{idOrSlug}/activity
```

Devuelve el historial de eventos de webhooks (Slack, Discord) del workspace.

**Query params:**

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `channel` | string | Filtrar por: `slack`, `discord` |
| `status` | string | Filtrar por: `sent`, `failed` |
| `per_page` | integer | Resultados por página (default: 15) |

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "workspace_id": 12,
        "channel": "slack",
        "event_type": "publication.published",
        "payload": { "text": "New post published: My Title" },
        "response": "ok",
        "status_code": 200,
        "success": true,
        "created_at": "2026-03-06T18:00:00Z"
      }
    ],
    "total": 42
  }
}
```

---

### 3.7 Probar Webhook

```http
POST /api/v1/workspaces/{idOrSlug}/webhooks/test
```

Envía un mensaje de prueba a Slack o Discord y guarda el URL si la conexión es exitosa.

**Cuerpo de la solicitud:**
```json
{
  "type": "slack",
  "url": "https://hooks.slack.com/services/T000/B000/XXXX"
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `type` | string | ✅ | `slack` o `discord` |
| `url` | string | ✅ | URL del webhook o invite de Discord |

---

## 4. Miembros y Roles

### 4.1 Listar Miembros

```http
GET /api/v1/workspaces/{idOrSlug}/members
```

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 5,
        "name": "Ana García",
        "email": "ana@empresa.com",
        "photo_url": "https://...",
        "created_at": "2025-01-15T10:00:00Z",
        "pivot": {
          "role_id": 1,
          "created_at": "2025-01-15T10:00:00Z"
        }
      }
    ],
    "member_count": 8,
    "role_distribution": {
      "1": 1,
      "2": 2,
      "3": 5
    }
  }
}
```

---

### 4.2 Invitar Miembro

Requiere permiso `manage-team`.

```http
POST /api/v1/workspaces/{idOrSlug}/invite
```

**Cuerpo de la solicitud:**
```json
{
  "email": "nuevomiembro@empresa.com",
  "role_id": 3
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `email` | string | ✅ | Email del usuario (debe existir en el sistema) |
| `role_id` | integer | ✅ | ID del rol a asignar (no puede ser Owner) |

> **Nota Enterprise:** El plan Enterprise tiene miembros ilimitados. El sistema verifica los límites del plan antes de permitir la invitación.

---

### 4.3 Cambiar Rol de Miembro

```http
PUT /api/v1/workspaces/{idOrSlug}/members/{user_id}/role
```

**Cuerpo de la solicitud:**
```json
{
  "role_id": 2
}
```

> **Restricciones:** No se puede cambiar el rol del creador del workspace ni asignar el rol `Owner` a otro usuario.

---

### 4.4 Crear Rol Personalizado

```http
POST /api/v1/workspaces/{idOrSlug}/roles
```

**Cuerpo de la solicitud:**
```json
{
  "name": "Content Reviewer",
  "description": "Puede revisar y aprobor contenido pero no publicar",
  "permissions": [1, 3, 5]
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `name` | string | ✅ | Nombre único del rol |
| `description` | string | ❌ | Descripción del rol |
| `permissions` | array | ❌ | Array de IDs de permisos a asignar |

---

### 4.5 Ver Todos los Permisos

```http
GET /api/v1/workspaces/{idOrSlug}/permissions
```

Devuelve todos los permisos disponibles en el sistema.

---

## 5. Flujos de Aprobación (Enterprise)

Los flujos de aprobación son exclusivos del plan **Enterprise** (multi-nivel) y **Professional** (un nivel). Permiten definir una cadena de aprobadores antes de que una publicación pueda ser publicada.

### 5.1 Listar Flujos

```http
GET /api/v1/workspaces/{idOrSlug}/approval-workflows
```

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "workspace_id": 12,
      "name": "Flujo Legal + Marketing",
      "is_active": true,
      "steps": [
        {
          "id": 10,
          "workflow_id": 3,
          "name": "Revisión Legal",
          "step_order": 1,
          "user_id": 8,
          "role_id": null
        },
        {
          "id": 11,
          "workflow_id": 3,
          "name": "Aprobación de Director",
          "step_order": 2,
          "user_id": null,
          "role_id": 2
        }
      ]
    }
  ]
}
```

---

### 5.2 Crear Flujo de Aprobación

```http
POST /api/v1/workspaces/{idOrSlug}/approval-workflows
```

**Cuerpo de la solicitud:**
```json
{
  "name": "Flujo Estándar de Aprobación",
  "is_active": true,
  "steps": [
    {
      "name": "Revisión de contenido",
      "step_order": 1,
      "user_id": 8,
      "role_id": null
    },
    {
      "name": "Aprobación final",
      "step_order": 2,
      "user_id": null,
      "role_id": 2
    }
  ]
}
```

---

### 5.3 Ver Estadísticas de Aprobaciones

```http
GET /api/v1/approvals/stats
```

---

### 5.4 Historial de Aprobaciones

```http
GET /api/v1/approvals/history
```

---

### 5.5 Pendientes de Aprobación

```http
GET /api/v1/approvals
```

Devuelve todas las publicaciones en estado `pending_review` que el usuario autenticado puede aprobar.

---

## 6. Publicaciones

Las publicaciones son el objeto central del sistema. Representan el contenido que será distribuido a las redes sociales.

### Estados de una Publicación

| Estado | Significado |
| :--- | :--- |
| `draft` | Borrador, editable |
| `pending_review` | Enviada para aprobación, **bloqueada para edición** |
| `approved` | Aprobada, lista para publicar |
| `scheduled` | Programada para publicar en una fecha/hora futura |
| `publishing` | En proceso de publicación (background job activo) |
| `published` | Publicada exitosamente en al menos una plataforma |
| `failed` | La publicación falló en todas las plataformas |
| `rejected` | Rechazada por un revisor con motivo |
| `cancelled` | Cancelada manualmente |

---

### 6.1 Listar Publicaciones

```http
GET /api/v1/publications
```

**Query params:**

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `status` | string | Estado(s) separados por coma. Ej: `draft,approved`. `all` para todos. |
| `search` | string | Busca por título (LIKE) |
| `platform` | string | Filtra por plataforma publicada: `twitter`, `instagram`, `linkedin`, `facebook` |
| `date_start` | date | Inicio del rango de fechas (ISO 8601) |
| `date_end` | date | Fin del rango de fechas (ISO 8601) |
| `sort` | string | Ordenamiento: `newest` (default), `oldest`, `title_asc`, `title_desc` |
| `per_page` | integer | Resultados por página (default: 10) |
| `simplified` | boolean | Si `true`, devuelve máximo 50 resultados sin paginar (útil para selectores) |
| `exclude_assigned` | boolean | Excluye publicaciones ya asignadas a una campaña |

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "data": {
    "publications": {
      "data": [
        {
          "id": 101,
          "title": "Lanzamiento Producto Q1",
          "body": "Texto completo de la publicación...",
          "description": "Descripción corta para SEO",
          "hashtags": "#tecnologia #innovacion",
          "url": "https://blog.empresa.com/post-1",
          "goal": "brand_awareness",
          "status": "approved",
          "scheduled_at": "2026-03-10T14:00:00Z",
          "published_at": null,
          "platform_settings": {
            "instagram": { "caption": "Texto personalizado para IG" },
            "twitter": { "thread": false }
          },
          "user_id": 5,
          "workspace_id": 12,
          "approved_by": 8,
          "approved_at": "2026-03-07T09:00:00Z",
          "rejected_by": null,
          "rejected_at": null,
          "rejection_reason": null,
          "user": {
            "id": 5,
            "name": "Ana García",
            "email": "ana@empresa.com",
            "photo_url": "https://..."
          },
          "media_files": [
            {
              "id": 55,
              "file_path": "publications/uuid-here.jpg",
              "file_type": "image",
              "file_name": "banner-q1.jpg",
              "size": 1024000,
              "mime_type": "image/jpeg",
              "thumbnail": {
                "id": 56,
                "file_path": "publications/uuid-thumb.jpg"
              }
            }
          ],
          "scheduled_posts": [
            {
              "id": 200,
              "publication_id": 101,
              "social_account_id": 7,
              "status": "pending",
              "scheduled_at": "2026-03-10T14:00:00Z",
              "social_account": {
                "id": 7,
                "platform": "instagram",
                "account_name": "@empresa_oficial"
              }
            }
          ],
          "social_post_logs": [],
          "campaigns": [
            { "id": 3, "name": "Q1 2026", "status": "active" }
          ],
          "approval_logs": [],
          "created_at": "2026-03-01T10:00:00Z",
          "updated_at": "2026-03-07T09:00:00Z"
        }
      ],
      "current_page": 1,
      "last_page": 5,
      "per_page": 10,
      "total": 48
    }
  }
}
```

---

### 6.2 Estadísticas de Publicaciones

```http
GET /api/v1/publications/stats
```

Devuelve conteos por estado para el workspace actual.

---

### 6.3 Exportar Publicaciones

```http
GET /api/v1/publications/export
```

Descarga las publicaciones del workspace en formato Excel/CSV.

---

### 6.4 Ver Publicación

```http
GET /api/v1/publications/{id}
```

Devuelve la publicación completa, incluyendo sus derivados de media, logs de actividad, comentarios y estado de bloqueo.

**Campos adicionales en el detalle:**
- `media_files.derivatives`: Versiones procesadas del archivo (thumbnails, formatos plataforma)
- `social_post_logs`: Historial completo de envíos a redes sociales con `post_url` y `error_message`
- `approval_lock`: Datos del bloqueo por flujo de aprobación (si aplica)
- `media_locked_by`: Usuario que tiene bloqueado el media para edición

---

### 6.5 Crear Publicación

Requiere permiso `manage-content`.

```http
POST /api/v1/publications
```

**Headers especiales:**
```http
X-User-Timezone: America/Bogota
```

**Cuerpo de la solicitud:**
```json
{
  "title": "Lanzamiento de Producto Q2",
  "body": "Contenido completo de la publicación con todos los detalles...",
  "description": "Breve descripción para vista previa",
  "hashtags": "#lanzamiento #producto #tecnologia",
  "url": "https://blog.empresa.com/q2-launch",
  "goal": "lead_generation",
  "status": "draft",
  "scheduled_at": "2026-06-01T10:00:00",
  "platform_settings": {
    "instagram": {
      "caption": "¡Texto personalizado para Instagram!",
      "first_comment": "#hashtags adicionales"
    },
    "twitter": {
      "thread": false,
      "alt_text": "Descripción de imagen para accesibilidad"
    },
    "linkedin": {
      "document_title": "Presentación Q2"
    }
  },
  "media": [
    {
      "key": "publications/uuid-aqui.jpg",
      "file_name": "banner-q2.jpg",
      "mime_type": "image/jpeg",
      "size": 1024000,
      "file_type": "image"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `title` | string | ✅ | Título de la publicación |
| `body` | string | ✅ | Contenido principal |
| `description` | string | ❌ | Descripción corta |
| `hashtags` | string | ❌ | Hashtags para las redes |
| `url` | string | ❌ | URL de referencia |
| `goal` | string | ❌ | Objetivo: `brand_awareness`, `lead_generation`, `engagement`, `sales` |
| `status` | string | ❌ | Estado inicial. Default: `draft`. Solo Owners/Admins pueden usar `scheduled`. |
| `scheduled_at` | datetime | ❌ | Fecha de publicación programada. Se interpreta con `X-User-Timezone`. |
| `platform_settings` | object | ❌ | Configuraciones específicas por plataforma |
| `media` | array | ❌ | Array de metadatos de archivos subidos a S3 (ver sección Uploads) |

**Respuesta exitosa `201`:**
```json
{
  "success": true,
  "message": "Publication created successfully",
  "data": {
    "publication": { ... }
  }
}
```

> **Límites del Plan:** Si el plan del workspace ha alcanzado el límite de publicaciones mensuales, devuelve `402 Payment Required` con detalles sobre el upgrade.

---

### 6.6 Actualizar Publicación

Requiere permiso `manage-content`. **No se puede editar si está en estado `pending_review`.**

```http
PUT /api/v1/publications/{id}
```

El cuerpo acepta los mismos campos que el endpoint de creación.

**Errores especiales:**

- `423 Locked`: Si la publicación está bloqueada por un flujo de aprobación o por otro usuario en edición simultánea.

```json
{
  "success": false,
  "message": "This publication is awaiting approval and cannot be edited.",
  "data": {
    "status": "pending_review",
    "locked_reason": "Publication is awaiting approval"
  }
}
```

---

### 6.7 Eliminar Publicación

```http
DELETE /api/v1/publications/{id}
```

> Solo se puede eliminar publicaciones en el workspace activo del usuario.

---

### 6.8 Duplicar Publicación

Crea una copia exacta en estado `draft`. Los archivos de media y campañas se heredan.

```http
POST /api/v1/publications/{id}/duplicate
```

---

### 6.9 Solicitar Revisión

Cambia el estado a `pending_review` y **bloquea la publicación para edición**. Se notifica automáticamente a todos los usuarios con permiso de `approve` en el workspace.

```http
POST /api/v1/publications/{id}/request-review
```

**Cuerpo opcional:**
```json
{
  "platform_settings": { ... }
}
```

**Solo disponible para publicaciones en estado:** `draft`, `failed`, `rejected`

---

### 6.10 Aprobar Publicación

Requiere permiso `approve`. Si existe un flujo de multi-nivel, avanza al siguiente paso.

```http
POST /api/v1/publications/{id}/approve
```

**Cuerpo de la solicitud:**
```json
{
  "comment": "Contenido excelente, listo para publicar"
}
```

**Lógica de flujo multi-nivel:**
1. Si hay un `current_approval_step_id`, se verifica si el usuario puede aprobar ese paso específico.
2. Si hay más pasos, se avanza al siguiente. La publicación se mantiene en `pending_review`.
3. Si no hay más pasos, la publicación pasa a estado `approved`.

---

### 6.11 Rechazar Publicación

Requiere permiso `approve`.

```http
POST /api/v1/publications/{id}/reject
```

**Cuerpo de la solicitud:**
```json
{
  "reason": "El contenido no cumple con las directrices de la marca. Por favor revisar el tono.",
  "comment": "Contactar al equipo de brand para alineación."
}
```

La publicación vuelve a estado `rejected` y el creador recibe una notificación.

---

### 6.12 Publicar

Requiere permiso `manage-content`. La publicación debe estar en estado `approved` (o `draft` si el usuario tiene permiso `publish`).

```http
POST /api/v1/publications/{id}/publish
```

**Cuerpo de la solicitud:**
```json
{
  "platforms": [7, 9, 12],
  "platform_settings": {
    "instagram": {
      "caption": "Texto final para Instagram",
      "scheduled_at": "2026-03-10T14:00:00Z"
    }
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `platforms` | array | ✅ | Array de IDs de `social_account` donde publicar |
| `platform_settings` | object | ❌ | Configuraciones adicionales por plataforma |

**Respuesta exitosa `200`:** La publicación se procesa en segundo plano (background job).

```json
{
  "success": true,
  "message": "Publishing started in background.",
  "data": {
    "status": "publishing"
  }
}
```

---

### 6.13 Despublicar

```http
POST /api/v1/publications/{id}/unpublish
```

**Cuerpo de la solicitud:**
```json
{
  "platform_ids": [7, 9]
}
```

---

### 6.14 Cancelar Publicación

```http
POST /api/v1/publications/{id}/cancel
```

Cancela una publicación programada o en cola.

---

### 6.15 Validar Contenido

```http
POST /api/v1/publications/{id}/validate
```

Verifica que el contenido cumple los requisitos de las plataformas objetivo (longitud de texto, dimensiones de imagen, etc.).

---

### 6.16 Vista Previa

```http
POST /api/v1/publications/{id}/preview
```

Genera una vista previa del contenido formateado para cada plataforma.

---

### 6.17 Plataformas donde fue Publicado

```http
GET /api/v1/publications/{id}/published-platforms
```

Devuelve el detalle de cada red social donde la publicación fue publicada.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "platform": "instagram",
      "account_name": "@empresa_oficial",
      "status": "published",
      "post_url": "https://instagram.com/p/ABC123",
      "published_at": "2026-03-10T14:05:23Z",
      "error_message": null
    },
    {
      "platform": "twitter",
      "account_name": "@empresa_tw",
      "status": "failed",
      "post_url": null,
      "published_at": null,
      "error_message": "Rate limit exceeded"
    }
  ]
}
```

---

### 6.18 Adjuntar Media

```http
POST /api/v1/publications/{id}/attach-media
```

Asocia archivos ya subidos a S3 a una publicación existente.

---

### 6.19 Comentarios

```http
GET  /api/v1/publications/{id}/comments
POST /api/v1/publications/{id}/comments
DELETE /api/v1/publications/{id}/comments/{comment_id}
```

**Crear comentario:**
```json
{
  "body": "Este contenido necesita revisión urgente.",
  "parent_id": null
}
```

---

### 6.20 Actividad / Auditoría

```http
GET /api/v1/publications/{id}/activities
```

Devuelve el historial completo de acciones realizadas sobre la publicación (creación, actualizaciones, cambios de estado, aprobaciones).

```json
{
  "data": [
    {
      "id": 1,
      "event": "approved",
      "data": {
        "approver": "Carlos López",
        "comment": "Aprobado para publicación",
        "note": "Publication approved and ready to publish"
      },
      "user": {
        "id": 8,
        "name": "Carlos López",
        "photo_url": "https://..."
      },
      "created_at": "2026-03-07T09:00:00Z"
    }
  ]
}
```

---

### 6.21 Token de Portal de Cliente

```http
POST /api/v1/publications/{id}/portal-token
```

Genera un token temporal para compartir una vista de preview de la publicación con un cliente externo sin cuenta en Intellipost.

---

## 7. Campañas

Las campañas agrupan publicaciones bajo un objetivo común.

### 7.1 Listar Campañas

```http
GET /api/v1/campaigns
```

### 7.2 Crear Campaña

```http
POST /api/v1/campaigns
```

```json
{
  "name": "Campaña Black Friday 2026",
  "description": "Campaña global de ventas navideñas",
  "status": "draft",
  "start_date": "2026-11-20",
  "end_date": "2026-11-30"
}
```

### 7.3 Ver Campaña

```http
GET /api/v1/campaigns/{id}
```

### 7.4 Actualizar Campaña

```http
PUT /api/v1/campaigns/{id}
```

### 7.5 Eliminar Campaña

```http
DELETE /api/v1/campaigns/{id}
```

### 7.6 Duplicar Campaña

```http
POST /api/v1/campaigns/{id}/duplicate
```

### 7.7 Exportar Campañas

```http
GET /api/v1/campaigns/export
```

---

## 8. Cuentas Sociales

### 8.1 Listar Cuentas Conectadas

```http
GET /api/v1/social-accounts
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": 7,
      "platform": "instagram",
      "account_name": "@empresa_oficial",
      "account_id": "12345678",
      "workspace_id": 12,
      "expires_at": "2027-01-01T00:00:00Z",
      "created_at": "2025-06-01T10:00:00Z"
    }
  ]
}
```

**Plataformas soportadas:** `instagram`, `facebook`, `twitter`, `linkedin`, `youtube`, `tiktok`, `pinterest`

### 8.2 Obtener URL de Autorización OAuth

```http
GET /api/v1/social-accounts/auth-url/{platform}
```

Devuelve la URL a la que redirigir al usuario para conectar la cuenta social.

### 8.3 Ver / Actualizar / Eliminar Cuenta

```http
GET    /api/v1/social-accounts/{id}
PUT    /api/v1/social-accounts/{id}
DELETE /api/v1/social-accounts/{id}
```

### 8.4 Logs de Publicaciones Sociales

```http
GET /api/v1/logs
GET /api/v1/logs/export
```

Historial de todos los envíos a redes sociales del workspace.

---

## 9. Subida de Archivos (Upload)

Intellipost usa **S3 de AWS** para el almacenamiento de media. El flujo recomendado es la **subida directa desde el cliente** para evitar limitaciones de tamaño en el servidor.

### Tipos de Archivo Permitidos

| Tipo MIME | Extensiones |
| :--- | :--- |
| `image/jpeg` | `.jpg`, `.jpeg` |
| `image/png` | `.png` |
| `image/gif` | `.gif` |
| `video/mp4` | `.mp4` |
| `application/pdf` | `.pdf` |

> **Los archivos ejecutables están bloqueados** (`.exe`, `.bat`, `.sh`, `.php`, etc.)

---

### Flujo 1: Subida Simple (< 5 MB)

#### Paso 1: Obtener URL Firmada

```http
POST /api/v1/uploads/sign
```

```json
{
  "filename": "banner-producto.jpg",
  "content_type": "image/jpeg",
  "file_size": 1024000
}
```

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `filename` | string | ✅ | Nombre del archivo original |
| `content_type` | string | ✅ | Tipo MIME del archivo |
| `file_size` | integer | ❌ | Tamaño en bytes (para verificar límites de almacenamiento del plan) |

**Respuesta exitosa `200`:**
```json
{
  "upload_url": "https://s3.amazonaws.com/bucket/publications/uuid.jpg?X-Amz-Signature=...",
  "key": "publications/uuid.jpg",
  "uuid": "abc12345-def6-7890-abcd-ef1234567890",
  "method": "PUT"
}
```

#### Paso 2: Subir el Archivo

Usa la `upload_url` recibida para hacer un `PUT` directo a S3 **desde tu cliente**.

```
PUT {upload_url}
Content-Type: image/jpeg
[Binary content of the file]
```

#### Paso 3: Adjuntar a Publicación

Usa el `key` y otros metadatos del archivo en el body al crear/actualizar la publicación:

```json
{
  "media": [
    {
      "key": "publications/uuid.jpg",
      "file_name": "banner-producto.jpg",
      "mime_type": "image/jpeg",
      "size": 1024000,
      "file_type": "image"
    }
  ]
}
```

---

### Flujo 2: Subida Multiparte (> 5 MB, videos, PDFs grandes)

Para archivos grandes, usa la subida multiparte que divide el archivo en partes y los sube en paralelo.

#### Paso 1: Iniciar Subida Multiparte

```http
POST /api/v1/uploads/multipart/init
```

```json
{
  "filename": "video-producto.mp4",
  "content_type": "video/mp4",
  "file_size": 52428800
}
```

**Respuesta:**
```json
{
  "uploadId": "MULTIPART_UPLOAD_ID_DE_S3",
  "key": "publications/uuid.mp4"
}
```

#### Paso 2: Firmar Cada Parte

```http
POST /api/v1/uploads/multipart/sign-part
```

```json
{
  "key": "publications/uuid.mp4",
  "uploadId": "MULTIPART_UPLOAD_ID_DE_S3",
  "partNumber": 1
}
```

**Respuesta:**
```json
{
  "url": "https://s3.amazonaws.com/...?partNumber=1&..."
}
```

Repite este paso para cada parte del archivo (se recomienda partes de 5 MB).

#### Paso 3: Completar Subida

```http
POST /api/v1/uploads/multipart/complete
```

```json
{
  "key": "publications/uuid.mp4",
  "uploadId": "MULTIPART_UPLOAD_ID_DE_S3",
  "parts": [
    { "PartNumber": 1, "ETag": "\"d8e8fca2dc0f896fd7cb4cb0031ba249\"" },
    { "PartNumber": 2, "ETag": "\"d8e8fca2dc0f896fd7cb4cb0031ba250\"" }
  ]
}
```

**Respuesta:**
```json
{
  "location": "https://s3.amazonaws.com/bucket/publications/uuid.mp4",
  "key": "publications/uuid.mp4",
  "status": "uploaded"
}
```

---

### Gestión de Uploads en Progreso

```http
POST   /api/v1/uploads/progress           # Actualizar % de progreso
POST   /api/v1/uploads/{uploadId}/pause   # Pausar upload
GET    /api/v1/uploads/{uploadId}/resume  # Reanudar upload pausado
DELETE /api/v1/uploads/{uploadId}         # Cancelar y limpiar S3
```

---

## 10. Analytics

### 10.1 Dashboard de Estadísticas

```http
GET /api/v1/analytics/dashboard
```

**Query params:**

| Parámetro | Tipo | Default | Descripción |
| :--- | :--- | :--- | :--- |
| `days` | integer | 7 | Período de análisis en días |

**Respuesta:**
```json
{
  "overview": {
    "total_views": 15420,
    "total_clicks": 3280,
    "total_conversions": 128,
    "total_reach": 45000,
    "total_engagement": 7650,
    "avg_engagement_rate": 4.2
  },
  "top_campaigns": [
    {
      "id": 3,
      "name": "Q1 2026",
      "total_views": 5000,
      "total_engagement": 2500
    }
  ],
  "social_media": { ... },
  "engagement_trends": [
    {
      "date": "Mar 01",
      "views": 1200,
      "clicks": 340,
      "engagement": 580,
      "likes": 420,
      "comments": 85,
      "shares": 65,
      "saves": 10
    }
  ]
}
```

---

### 10.2 Analytics por Campaña

```http
GET /api/v1/analytics/campaigns/{id}
```

**Query params:**

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `start_date` | date | Fecha inicio del análisis |
| `end_date` | date | Fecha fin del análisis |

---

### 10.3 Métricas por Red Social

```http
GET /api/v1/analytics/social-media
```

**Query params:**

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `platform` | string | `instagram`, `twitter`, `linkedin`, etc. |
| `days` | integer | Período (default: 30) |

---

### 10.4 Tendencias de Engagement

```http
GET /api/v1/analytics/engagement
```

---

### 10.5 Comparación de Plataformas

```http
GET /api/v1/analytics/platform-comparison
```

---

### 10.6 Exportar Analytics

```http
GET /api/v1/analytics/export
```

**Query params:**

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `format` | string | `json` (default) o `csv` |
| `days` | integer | Período (default: 30) |

Con `format=csv`, la respuesta es un archivo descargable.

---

### 10.7 Registrar Evento Personalizado

```http
POST /api/v1/analytics
```

Permite inyectar eventos de analytics personalizados desde sistemas externos.

```json
{
  "metric_type": "conversion",
  "metric_name": "newsletter_signup",
  "metric_value": 1,
  "metric_date": "2026-03-06",
  "platform": "website",
  "reference_id": 101,
  "reference_type": "publication",
  "metadata": {
    "source": "instagram_bio_link",
    "country": "Colombia"
  }
}
```

---

## 11. Notificaciones

### 11.1 Listar Notificaciones

```http
GET /api/v1/notifications
```

### 11.2 Estadísticas de Notificaciones

```http
GET /api/v1/notifications/stats
```

Devuelve el conteo de notificaciones no leídas.

### 11.3 Marcar como Leída

```http
POST /api/v1/notifications/{id}/read
```

### 11.4 Marcar Todas como Leídas

```http
POST /api/v1/notifications/read-all
```

### 11.5 Eliminar Notificación

```http
DELETE /api/v1/notifications/{id}
```

### 11.6 Eliminar Notificaciones Leídas

```http
DELETE /api/v1/notifications/read
```

---

## 12. Calendario

### 12.1 Obtener Eventos del Calendario

```http
GET /api/v1/calendar/events
```

Devuelve publicaciones y eventos de usuario para el calendario.

### 12.2 Actualizar Evento (Reprogramar)

```http
PATCH /api/v1/calendar/events/{id}
```

```json
{
  "scheduled_at": "2026-04-15T10:00:00Z"
}
```

### 12.3 Operaciones Masivas

```http
POST /api/v1/calendar/bulk-update
POST /api/v1/calendar/bulk-undo
```

### 12.4 Exportar Calendario

```http
POST /api/v1/calendar/export/google
POST /api/v1/calendar/export/outlook
GET  /api/v1/calendar/download/{filename}
```

### 12.5 Calendarios Externos

```http
POST   /api/v1/external-calendar/{provider}/connect
DELETE /api/v1/external-calendar/{provider}/disconnect
GET    /api/v1/external-calendar/status
PUT    /api/v1/external-calendar/{provider}/sync-settings
POST   /api/v1/external-calendar/{provider}/full-sync
```

**Providers:** `google`, `outlook`

---

## 13. Suscripción y Límites

### 13.1 Ver Uso Actual

```http
GET /api/v1/subscription/usage
```

```json
{
  "publications_used": 45,
  "publications_limit": -1,
  "social_accounts_used": 8,
  "social_accounts_limit": -1,
  "storage_used_gb": 12.5,
  "storage_limit_gb": 1000,
  "ai_requests_used": 230,
  "ai_requests_limit": -1,
  "team_members_used": 15,
  "team_members_limit": -1
}
```

> `-1` indica **ilimitado** (Enterprise).

### 13.2 Permisos del Plan

```http
GET /api/v1/subscription/permissions
```

### 13.3 Verificar Límite Específico

```http
GET /api/v1/subscription/limits/check/{limitType}
```

**`limitType`:** `publications`, `social_accounts`, `storage`, `ai_requests`, `team_members`

### 13.4 Features del Plan

```http
GET /api/v1/subscription/limits/features
```

### 13.5 Historial de Facturación

```http
GET /api/v1/subscription/history
```

### 13.6 Cambiar de Plan (Solo Owner)

```http
POST /api/v1/subscription/change-plan
```

```json
{
  "plan": "enterprise"
}
```

---

## 14. Perfil de Usuario

### 14.1 Actualizar Perfil

```http
PATCH /api/v1/profile
```

```json
{
  "name": "Ana García",
  "bio": "Content Manager en Empresa Global",
  "phone": "+57 300 000 0000",
  "country_code": "CO"
}
```

### 14.2 Cambiar Contraseña

```http
PUT /api/v1/profile/password
```

```json
{
  "current_password": "contraseña_actual",
  "password": "nueva_contraseña_segura",
  "password_confirmation": "nueva_contraseña_segura"
}
```

### 14.3 Actualizar Configuración de Plataformas Sociales

```http
PATCH /api/v1/profile/social-settings
```

### 14.4 Cambiar Idioma (Locale)

```http
PATCH /api/v1/locale
```

```json
{
  "locale": "es"
}
```

**Valores disponibles:** `es`, `en`, `fr`, `pt`

---

## 15. Manejo de Errores

### Diccionario de Códigos de Estado

| Código | Nombre | Cuándo ocurre | Qué hacer |
| :--- | :--- | :--- | :--- |
| `200` | OK | Operación exitosa | — |
| `201` | Created | Recurso creado | — |
| `400` | Bad Request | Formato de datos inválido | Revisar el body del request |
| `401` | Unauthorized | Token inválido o expirado | Regenerar el token en el dashboard |
| `402` | Payment Required | Límite del plan alcanzado | Hacer upgrade del plan |
| `403` | Forbidden | Sin permisos para la acción | Verificar el rol del usuario en el workspace |
| `404` | Not Found | Recurso no encontrado | Verificar el ID del recurso |
| `413` | Payload Too Large | Request demasiado grande (> 10MB para publish) | Reducir el payload |
| `422` | Unprocessable Entity | Validación fallida o estado inválido | Leer el campo `errors` de la respuesta |
| `423` | Locked | Publicación bloqueada (aprobación pendiente o edición simultánea) | Esperar o rechazar la aprobación |
| `429` | Too Many Requests | Rate limit excedido | Esperar e implementar exponential backoff |
| `500` | Server Error | Error interno del servidor | Reportar al equipo de soporte |

### Ejemplo de Error de Validación `422`

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email must be a valid email address."],
    "role_id": ["The selected role id is invalid."]
  }
}
```

### Ejemplo de Error de Límite `402`

```json
{
  "success": false,
  "message": "Has alcanzado el límite de publicaciones mensuales de tu plan.",
  "data": {
    "limit_type": "publications",
    "action": "upgrade",
    "upgrade_plan": "enterprise"
  }
}
```

---

## 16. Rate Limiting

Los endpoints críticos tienen rate limiting activo:

| Endpoint | Límite |
| :--- | :--- |
| `POST /publications` | 60 req / min |
| `POST /publications/{id}/publish` | 60 req / min |
| `POST /uploads/sign` | 60 req / min |
| `POST /uploads/multipart/init` | 60 req / min |

Cuando se excede el límite, la respuesta es `429 Too Many Requests`. Implementa **exponential backoff** en tu integración.

---

## 17. Webhooks

Los clientes Enterprise pueden recibir notificaciones en tiempo real a través de Slack y Discord configurados en el workspace.

### Configurar Webhook

1. Ve a **Configuración del Workspace → Integraciones**
2. Agrega la URL de tu webhook de Slack/Discord
3. Prueba la conexión con `POST /workspaces/{id}/webhooks/test`

### Eventos Notificados

| Evento | Descripción |
| :--- | :--- |
| `publication.published` | Una publicación se publicó exitosamente |
| `publication.failed` | Una publicación falló al enviarse |
| `review.requested` | Se solicitó revisión de una publicación |
| `review.approved` | Una publicación fue aprobada |
| `review.rejected` | Una publicación fue rechazada |
| `test_connection` | Mensaje de prueba de conexión |

---

## 18. Glosario de Estados

### Estados de Publicación

```
draft → pending_review → approved → publishing → published
  ↑         ↓               ↓                        ↓
  ←←←←← rejected ←←←←←←  scheduled              failed
```

### Permisos del Sistema

| Permiso (slug) | Descripción |
| :--- | :--- |
| `manage-content` | Crear, editar, eliminar publicaciones |
| `publish` | Publicar y programar contenido |
| `approve` | Aprobar publicaciones en flujos de revisión |
| `manage-team` | Invitar/remover miembros, cambiar roles |
| `view-content` | Solo lectura del contenido |
| `view-analytics` | Ver métricas y reportes |

---

*Para soporte técnico Enterprise, contacta a tu gestor de cuenta dedicado o escribe a enterprise-support@Intellipost.app*

*© 2026 Intellipost — Todos los derechos reservados*

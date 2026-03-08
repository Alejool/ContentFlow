# ContentFlow API — Complete Enterprise Reference v1

**Version:** 1.0  
**Base URL:** `https://your-domain.com/api/v1`  
**Authentication:** Bearer Token (Laravel Sanctum)  
**Date:** March 2026

---

## Table of Contents

1. [Authentication and Tokens](#1-authentication-and-tokens)
2. [General Conventions](#2-general-conventions)
3. [Workspaces](#3-workspaces)
4. [Members and Roles](#4-members-and-roles)
5. [Approval Workflows (Enterprise)](#5-approval-workflows-enterprise)
6. [Publications](#6-publications)
7. [Campaigns](#7-campaigns)
8. [Social Accounts](#8-social-accounts)
9. [File Upload](#9-file-upload)
10. [Analytics](#10-analytics)
11. [Notifications](#11-notifications)
12. [Calendar](#12-calendar)
13. [Subscription and Limits](#13-subscription-and-limits)
14. [User Profile](#14-user-profile)
15. [Error Handling](#15-error-handling)
16. [Rate Limiting](#16-rate-limiting)
17. [Webhooks](#17-webhooks)
18. [Status Glossary](#18-status-glossary)

---

## 1. Authentication and Tokens

ContentFlow uses **Laravel Sanctum** for API authentication. The system implements an **access token + refresh token** scheme with automatic rotation for maximum security.

> **Only available for Enterprise plan.** Free, Starter, or Professional plans will receive a `402 Payment Required` error when attempting to generate tokens.

### Quick Start Guide

To start using the API in 3 steps:

1. **Generate your tokens** with `POST /api/auth/token` (email + password + workspace)
2. **Use the access_token** in all your requests: `Authorization: Bearer <token>`
3. **Refresh before expiration** with `POST /api/auth/token/refresh` (every 23 hours)

### Step-by-Step Tutorial: Create and Test Tokens

#### Step 1: Get Your Credentials

You need:
- Email of the workspace **Owner** (the user who created it)
- Password of that user
- Workspace ID or slug (e.g., `marketing-global` or `12`)
- Active Enterprise plan

#### Step 2: Generate Your First Token

```bash
# Using cURL
curl -X POST https://your-domain.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@company.com",
    "password": "your-password",
    "workspace": "marketing-global"
  }'
```

```javascript
// Using JavaScript/Node.js
const response = await fetch('https://your-domain.com/api/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'owner@company.com',
    password: 'your-password',
    workspace: 'marketing-global'
  })
});

const result = await response.json();
console.log('Access Token:', result.data.access_token);
console.log('Refresh Token:', result.data.refresh_token);

// Store these tokens securely
localStorage.setItem('access_token', result.data.access_token);
localStorage.setItem('refresh_token', result.data.refresh_token);
```

```python
# Using Python
import requests

response = requests.post('https://your-domain.com/api/auth/token', json={
    'email': 'owner@company.com',
    'password': 'your-password',
    'workspace': 'marketing-global'
})

data = response.json()
access_token = data['data']['access_token']
refresh_token = data['data']['refresh_token']

print(f'Access Token: {access_token}')
print(f'Refresh Token: {refresh_token}')
```

**Expected response:**
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

#### Step 3: Test the Token with a Request

```bash
# List publications using the access token
curl -X GET https://your-domain.com/api/v1/publications \
  -H "Authorization: Bearer 1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
  -H "Accept: application/json"
```

```javascript
// JavaScript
const accessToken = localStorage.getItem('access_token');

const publications = await fetch('https://your-domain.com/api/v1/publications', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json'
  }
});

const data = await publications.json();
console.log('Publications:', data);
```

#### Step 4: Test the Refresh Token

```bash
# Refresh the token before it expires (recommended every 23 hours)
curl -X POST https://your-domain.com/api/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
    "workspace": "marketing-global"
  }'
```

```javascript
// JavaScript - Automatic refresh function
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch('https://your-domain.com/api/auth/token/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: refreshToken,
      workspace: 'marketing-global'
    })
  });

  const result = await response.json();
  
  // IMPORTANT: Update BOTH tokens
  localStorage.setItem('access_token', result.data.access_token);
  localStorage.setItem('refresh_token', result.data.refresh_token);
  
  return result.data.access_token;
}

// Set up automatic refresh every 23 hours
setInterval(refreshToken, 23 * 60 * 60 * 1000);
```

```python
# Python - Refresh token
import requests

refresh_token = "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0"

response = requests.post('https://your-domain.com/api/auth/token/refresh', json={
    'refresh_token': refresh_token,
    'workspace': 'marketing-global'
})

data = response.json()
new_access_token = data['data']['access_token']
new_refresh_token = data['data']['refresh_token']

# Update your stored tokens
print(f'New Access Token: {new_access_token}')
print(f'New Refresh Token: {new_refresh_token}')
```

**Expected response:**
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

#### Step 5: Validate Your Token Works

```bash
# Verify the token is valid
curl -X GET https://your-domain.com/api/auth/token/validate \
  -H "Authorization: Bearer 1|a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
  -H "Accept: application/json"
```

```javascript
// JavaScript
async function validateToken() {
  const accessToken = localStorage.getItem('access_token');
  
  const response = await fetch('https://your-domain.com/api/auth/token/validate', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  const result = await response.json();
  console.log('Token valid:', result.data.valid);
  console.log('Expires at:', result.data.token_expires_at);
  return result.data;
}
```

**Expected response:**
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
      "email": "owner@company.com"
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

### Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INITIAL AUTHENTICATION                                       │
│    POST /api/auth/token                                         │
│    Body: { email, password, workspace }                         │
│    ↓                                                            │
│    Response: { access_token, refresh_token }                    │
│    • access_token: valid for 24 hours                           │
│    • refresh_token: valid for 30 days                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. USING THE ACCESS TOKEN                                       │
│    All API requests:                                            │
│    Header: Authorization: Bearer <access_token>                 │
│    ↓                                                            │
│    While the token is valid (< 24h), use it normally           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. AUTOMATIC RENEWAL (before expiration)                       │
│    POST /api/auth/token/refresh                                 │
│    Body: { refresh_token, workspace }                           │
│    ↓                                                            │
│    Response: { access_token, refresh_token }                    │
│    • NEW access_token (24h more)                                │
│    • NEW refresh_token (30 days more)                           │
│    • Previous refresh_token is INVALIDATED (rotation)           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. LOGOUT (optional)                                            │
│    POST /api/auth/token/revoke                                  │
│    Header: Authorization: Bearer <access_token>                 │
│    ↓                                                            │
│    All user's API tokens are revoked                            │
└─────────────────────────────────────────────────────────────────┘
```

### Best Practices

1. **Secure Storage**
   - Store the `refresh_token` in a secure place (environment variables, secrets manager)
   - NEVER expose the refresh token in logs or URLs
   - The access token can be stored in memory (it's short-lived)

2. **Proactive Renewal**
   - Renew the access token BEFORE it expires (e.g., at 23 hours)
   - Don't wait to receive a 401 error to renew
   - Implement a timer or scheduler that renews automatically

3. **Error Handling**
   - If refresh fails with 401: re-authenticate from scratch
   - If you receive 402: plan changed, needs upgrade
   - If you receive 403: user is not workspace owner

4. **Token Rotation**
   - Each time you refresh, you receive a NEW pair of tokens
   - The previous refresh token is immediately invalidated
   - Update both tokens in your storage

---

## API Endpoints Reference

### 1.1 Generate Tokens (Initial Authentication)

> 🟢 **Public endpoint** — No prior authentication required.

```http
POST /api/auth/token
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "owner@company.com",
  "password": "your-secure-password",
  "workspace": "marketing-global"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | string | ✅ | Email of the workspace **Owner** |
| `password` | string | ✅ | User password |
| `workspace` | string | ✅ | Numeric ID **or** workspace slug |

**Successful response `201`:**
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
      "email": "owner@company.com"
    }
  }
}
```

**Possible errors:**

| Code | Message | Cause |
| :--- | :--- | :--- |
| `401` | Invalid credentials | Incorrect email or password |
| `403` | Only the workspace owner can generate API tokens | User is not the workspace creator |
| `402` | API access is only available for Enterprise plans | Workspace doesn't have active Enterprise plan |
| `404` | Workspace not found | Workspace doesn't exist or slug is incorrect |

---

### 1.2 Refresh Access Token (Renewal with Rotation)

> 🟢 **Public endpoint** — Only requires valid refresh_token.

```http
POST /api/auth/token/refresh
Content-Type: application/json
```

**Request body:**
```json
{
  "refresh_token": "2|z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0",
  "workspace": "marketing-global"
}
```

**Successful response `200`:**
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

---

### 1.3 Validate Active Token

> 🔒 **Requires:** `Authorization: Bearer <access_token>`

```http
GET /api/auth/token/validate
```

**Successful response `200`:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "has_api_access": true,
    "token_name": "api-access:12:1741305600",
    "token_expires_at": "2026-03-07T21:00:00+00:00",
    "user": { "id": 5, "name": "Ana García", "email": "owner@company.com" },
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

### 1.4 Revoke Tokens (Logout)

> 🔒 **Requires:** `Authorization: Bearer <access_token>`

```http
POST /api/auth/token/revoke
```

**Successful response `200`:**
```json
{
  "success": true,
  "message": "Revoked 2 API token(s) successfully.",
  "data": { "revoked_count": 2 }
}
```

---

## Download Documentation

- [Download English Version (PDF)](#)
- [Download Spanish Version (PDF)](#)
- [OpenAPI Specification (JSON)](./api-auth-openapi.json)
- [OpenAPI Specification (YAML)](./api-auth-openapi.yaml)

---

**For complete API documentation including Workspaces, Publications, Campaigns, and more, please refer to the full documentation.**

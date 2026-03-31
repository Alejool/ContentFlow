# Ejemplos de Salida de Logs

## 📋 Ejemplo de Log con Contexto Automático

### Antes (Sistema Antiguo)
```
[2024-02-21 10:30:45] local.INFO: Publishing completed {"publication_id":123,"duration_seconds":5.2}
```

### Después (Sistema Nuevo)
```json
[2024-02-21 10:30:45] local.INFO: Publishing completed {
  "publication_id": 123,
  "duration_seconds": 5.2,
  "job_id": "9d1edf66-2b90-a723-be53-e1e7ca5f1bc3",
  "user_id": 5,
  "user_email": "usuario@ejemplo.com",
  "workspace_id": 10,
  "ip": "192.168.1.100",
  "url": "https://app.ejemplo.com/api/publications/123/publish",
  "method": "POST",
  "timestamp": "2024-02-21T10:30:45+00:00"
}
```

## 🔍 Ejemplo de Búsqueda

### Comando:
```bash
php artisan logs:search "error" --channel=publications --user=5 --level=error
```

### Salida:
```
🔍 Searching in: publications.log

✅ Found 3 results:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2024-02-21 10:25:30] local.ERROR: Publication not found {
  "publication_id": 456,
  "job_id": "8c2def55-1a80-b612-ad42-d0e6ba4e0ab2",
  "user_id": 5,
  "user_email": "usuario@ejemplo.com",
  "workspace_id": 10,
  "ip": "192.168.1.100",
  "timestamp": "2024-02-21T10:25:30+00:00"
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2024-02-21 10:30:15] local.ERROR: No social accounts found {
  "publication_id": 789,
  "social_account_ids": [12, 34],
  "job_id": "7b1cde44-0a70-a501-9c31-c0d5a93d0a01",
  "user_id": 5,
  "user_email": "usuario@ejemplo.com",
  "workspace_id": 10,
  "ip": "192.168.1.100",
  "timestamp": "2024-02-21T10:30:15+00:00"
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2024-02-21 10:35:45] local.ERROR: Publishing job crashed {
  "publication_id": 123,
  "error": "Connection timeout",
  "trace": "...",
  "job_id": "9d1edf66-2b90-a723-be53-e1e7ca5f1bc3",
  "user_id": 5,
  "user_email": "usuario@ejemplo.com",
  "workspace_id": 10,
  "ip": "192.168.1.100",
  "timestamp": "2024-02-21T10:35:45+00:00"
}
```

## 📊 Ejemplo de Estadísticas

### Comando:
```bash
php artisan logs:stats --channel=publications
```

### Salida:
```
📊 Log Statistics: publications.log

+---------+-------+
| Level   | Count |
+---------+-------+
| ERROR   | 15    |
| WARNING | 8     |
| INFO    | 342   |
| DEBUG   | 0     |
+---------+-------+

👥 Unique users in logs: 12
   User IDs: 1, 3, 5, 7, 9, 12, 15, 18, 21, 24, 27, 30

📝 Unique publications: 87

💾 File size: 2.45 MB
```

## 📁 Ejemplo de Lista de Logs

### Comando:
```bash
php artisan logs:list
```

### Salida:
```
📋 Available Log Files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Channel: publications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+------------+---------+----------------+-----------------------------+
| Date       | Size    | Modified       | Filename                    |
+------------+---------+----------------+-----------------------------+
| 2024-02-21 | 2.45 MB | hace 5 minutos | publications-2024-02-21.log |
| 2024-02-20 | 3.12 MB | hace 1 día     | publications-2024-02-20.log |
| 2024-02-19 | 2.87 MB | hace 2 días    | publications-2024-02-19.log |
+------------+---------+----------------+-----------------------------+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Channel: jobs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+------------+---------+----------------+---------------------+
| Date       | Size    | Modified       | Filename            |
+------------+---------+----------------+---------------------+
| 2024-02-21 | 1.89 MB | hace 3 minutos | jobs-2024-02-21.log |
| 2024-02-20 | 2.34 MB | hace 1 día     | jobs-2024-02-20.log |
+------------+---------+----------------+---------------------+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Channel: auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+------------+-----------+----------------+---------------------+
| Date       | Size      | Modified       | Filename            |
+------------+-----------+----------------+---------------------+
| 2024-02-21 | 456.23 KB | hace 10 minutos| auth-2024-02-21.log |
| 2024-02-20 | 523.45 KB | hace 1 día     | auth-2024-02-20.log |
+------------+-----------+----------------+---------------------+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Channel: social
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+------------+-----------+----------------+-----------------------+
| Date       | Size      | Modified       | Filename              |
+------------+-----------+----------------+-----------------------+
| 2024-02-21 | 1.23 MB   | hace 2 minutos | social-2024-02-21.log |
| 2024-02-20 | 1.56 MB   | hace 1 día     | social-2024-02-20.log |
+------------+-----------+----------------+-----------------------+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Channel: errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+------------+-----------+----------------+------------------------+
| Date       | Size      | Modified       | Filename               |
+------------+-----------+----------------+------------------------+
| 2024-02-21 | 789.12 KB | hace 1 minuto  | errors-2024-02-21.log  |
| 2024-02-20 | 892.34 KB | hace 1 día     | errors-2024-02-20.log  |
+------------+-----------+----------------+------------------------+

💾 Total size: 18.45 MB
📊 Total files: 15
```

## 🎯 Casos de Uso Reales

### Caso 1: Usuario reporta que su publicación no se publicó

```bash
# Paso 1: Buscar logs del usuario
php artisan logs:search "error" --user=5 --channel=publications

# Paso 2: Buscar la publicación específica
php artisan logs:search "publication_id\":123" --channel=publications

# Resultado: Encuentras que no había cuentas sociales conectadas
```

### Caso 2: Jobs fallando en producción

```bash
# Ver todos los jobs fallidos de hoy
php artisan logs:search "failed" --channel=jobs --level=error --date=2024-02-21

# Ver estadísticas para entender la magnitud
php artisan logs:stats --channel=jobs --date=2024-02-21

# Resultado: Identificas un patrón de timeouts en ciertos jobs
```

### Caso 3: Intentos de login sospechosos

```bash
# Buscar intentos fallidos
php artisan logs:search "failed" --channel=auth --level=warning

# Ver estadísticas de autenticación
php artisan logs:stats --channel=auth

# Resultado: Detectas múltiples intentos desde la misma IP
```

### Caso 4: Problemas con Facebook API

```bash
# Buscar errores de Facebook
php artisan logs:search "facebook" --channel=social --level=error

# Ver todos los logs de una cuenta social específica
php artisan logs:search "account_id\":12" --channel=social

# Resultado: Encuentras que el token expiró
```

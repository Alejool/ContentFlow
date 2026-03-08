# ContentFlow - Guía de Configuración

Esta guía te ayudará a configurar ContentFlow en tu entorno local o de producción.

## 📋 Requisitos Previos

### Software Requerido
- **PHP**: 8.2 o superior
- **Composer**: 2.x
- **Node.js**: 18.x o superior
- **NPM**: 9.x o superior
- **Docker**: 20.x o superior (recomendado)
- **Docker Compose**: 2.x o superior

### Servicios Externos
- Cuenta de AWS S3 (para almacenamiento de medios)
- Cuentas de desarrollador en redes sociales:
  - Meta (Facebook/Instagram)
  - Twitter/X
  - TikTok
  - YouTube

## 🚀 Instalación con Docker (Recomendado)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Alejool/ContentFlow.git
cd ContentFlow
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.docker.example .env.docker

# Editar con tus credenciales
nano .env.docker
```

Variables importantes a configurar:

```env
# Base de datos
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=contentflow
DB_USERNAME=root
DB_PASSWORD=tu_password_seguro

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# AWS S3
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=tu_bucket

# Redes Sociales (obtener de cada plataforma)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
```

### 3. Iniciar Contenedores

```bash
# Construir e iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

### 4. Instalar Dependencias

```bash
# Instalar dependencias PHP
docker-compose exec app composer install

# Instalar dependencias Node
docker-compose exec app npm install
```

### 5. Configurar Base de Datos

```bash
# Generar clave de aplicación
docker-compose exec app php artisan key:generate

# Ejecutar migraciones
docker-compose exec app php artisan migrate

# Ejecutar seeders (opcional)
docker-compose exec app php artisan db:seed
```

### 6. Compilar Assets

```bash
# Desarrollo
docker-compose exec app npm run dev

# Producción
docker-compose exec app npm run build
```

### 7. Iniciar Workers

```bash
# Iniciar Horizon (colas)
docker-compose exec app php artisan horizon

# O usar supervisor (recomendado para producción)
docker-compose exec app supervisorctl start all
```

## 🖥️ Instalación Local (Sin Docker)

### 1. Instalar Dependencias del Sistema

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-fpm php8.2-mysql php8.2-redis \
  php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-gd \
  mysql-server redis-server
```

**macOS (con Homebrew):**
```bash
brew install php@8.2 mysql redis composer node
```

### 2. Configurar Base de Datos

```bash
# Iniciar MySQL
sudo systemctl start mysql

# Crear base de datos
mysql -u root -p
CREATE DATABASE contentflow;
CREATE USER 'contentflow'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON contentflow.* TO 'contentflow'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configurar Proyecto

```bash
# Clonar repositorio
git clone https://github.com/Alejool/ContentFlow.git
cd ContentFlow

# Instalar dependencias
composer install
npm install

# Configurar entorno
cp .env.example .env
php artisan key:generate

# Editar .env con tus credenciales
nano .env
```

### 4. Ejecutar Migraciones

```bash
php artisan migrate
php artisan db:seed
```

### 5. Compilar Assets

```bash
npm run build
```

### 6. Iniciar Servicios

```bash
# Terminal 1: Servidor web
php artisan serve

# Terminal 2: Vite (desarrollo)
npm run dev

# Terminal 3: Colas
php artisan horizon

# Terminal 4: Reverb (WebSockets)
php artisan reverb:start
```

## 🔒 Configuración de Seguridad

### 1. Configurar 2FA para Administradores

```bash
docker-compose exec app php artisan 2fa:enable
```

Ver [docs/security/SECURITY_2FA_SETUP.md](./security/SECURITY_2FA_SETUP.md) para más detalles.

### 2. Configurar Rate Limiting

Editar `config/rate-limits.php` según tus necesidades.

### 3. Configurar Alertas de Seguridad

Ver [docs/security/SECURITY_ALERTS_SETUP.md](./security/SECURITY_ALERTS_SETUP.md).

## 📱 Configuración de Redes Sociales

### Facebook/Instagram

1. Crear app en [Facebook Developers](https://developers.facebook.com/)
2. Agregar productos: Facebook Login, Instagram Basic Display
3. Configurar URLs de redirección
4. Copiar App ID y App Secret a `.env`

### Twitter/X

1. Crear app en [Twitter Developer Portal](https://developer.twitter.com/)
2. Habilitar OAuth 2.0
3. Configurar callback URLs
4. Copiar API Key y Secret a `.env`

### TikTok

1. Registrarse en [TikTok for Developers](https://developers.tiktok.com/)
2. Crear aplicación
3. Solicitar permisos necesarios
4. Configurar credenciales en `.env`

### YouTube

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar YouTube Data API v3
3. Crear credenciales OAuth 2.0
4. Configurar en `.env`

## 🎨 Configuración de AWS S3

### 1. Crear Bucket

```bash
# Usando AWS CLI
aws s3 mb s3://contentflow-media --region us-east-1
```

### 2. Configurar CORS

Crear archivo `cors.json`:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://tu-dominio.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Aplicar configuración:

```bash
aws s3api put-bucket-cors --bucket contentflow-media --cors-configuration file://cors.json
```

### 3. Configurar Política de Bucket

Ver documentación de AWS para políticas de acceso público/privado según tus necesidades.

## 🔧 Configuración Adicional

### Configurar Cron Jobs

Agregar a crontab:

```bash
* * * * * cd /path/to/contentflow && php artisan schedule:run >> /dev/null 2>&1
```

Con Docker:

```bash
docker-compose exec app php artisan schedule:work
```

### Configurar Supervisor (Producción)

Crear archivo `/etc/supervisor/conf.d/contentflow.conf`:

```ini
[program:contentflow-horizon]
process_name=%(program_name)s
command=php /path/to/contentflow/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/contentflow/storage/logs/horizon.log
stopwaitsecs=3600

[program:contentflow-reverb]
process_name=%(program_name)s
command=php /path/to/contentflow/artisan reverb:start
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/contentflow/storage/logs/reverb.log
```

Recargar supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

## ✅ Verificación de Instalación

### 1. Verificar Servicios

```bash
# Con Docker
docker-compose ps

# Sin Docker
php artisan about
```

### 2. Verificar Conexiones

```bash
# Base de datos
docker-compose exec app php artisan tinker
>>> DB::connection()->getPdo();

# Redis
docker-compose exec app php artisan tinker
>>> Redis::ping();

# S3
docker-compose exec app php artisan tinker
>>> Storage::disk('s3')->exists('test.txt');
```

### 3. Ejecutar Tests

```bash
docker-compose exec app php artisan test
```

## 🐛 Troubleshooting

### Permisos de Archivos

```bash
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
docker-compose exec app chmod -R 775 storage bootstrap/cache
```

### Limpiar Cache

```bash
docker-compose exec app php artisan optimize:clear
```

### Ver Logs

```bash
# Logs de Laravel
docker-compose exec app tail -f storage/logs/laravel.log

# Logs de Docker
docker-compose logs -f app
```

## 📚 Documentación Adicional

- [Guía de Docker](./infrastructure/DOCKER_GUIDE.md)
- [Guía de Seguridad](./security/SECURITY_OVERVIEW.md)
- [Guía de Logging](./logging/LOGGING_GUIDE.md)
- [API Documentation](./api/API_ENTERPRISE_V1.md)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa la documentación en `/docs`
2. Verifica los logs de la aplicación
3. Consulta la sección de troubleshooting
4. Abre un issue en GitHub

---

**Última actualización**: Marzo 2026

# Ejemplo de Migración al Nuevo Sistema de Logs

## ❌ Antes (Sistema Antiguo)

```php
use Illuminate\Support\Facades\Log;

class PublishToSocialMedia implements ShouldQueue
{
    public function handle()
    {
        // Log básico sin contexto
        Log::info('Starting publishing');
        
        // Log con contexto manual
        Log::error('Publication not found', ['id' => $this->publicationId]);
        
        // Sin información de usuario automática
        Log::info('Publishing completed', [
            'publication_id' => $publication->id,
            'duration' => $duration
        ]);
    }
}
```

**Problemas:**
- Todo va al mismo archivo `laravel.log`
- No hay información de usuario automática
- Difícil buscar logs específicos
- No hay separación por contexto

## ✅ Después (Sistema Nuevo)

```php
use App\Helpers\LogHelper;

class PublishToSocialMedia implements ShouldQueue
{
    public function handle()
    {
        // Log con canal específico y contexto automático
        LogHelper::jobInfo('Starting publishing', [
            'publication_id' => $this->publicationId,
            'job_id' => $this->job->uuid()
        ]);
        
        // Error que va a múltiples canales
        LogHelper::publicationError('Publication not found', [
            'publication_id' => $this->publicationId,
            'job_id' => $this->job->uuid()
        ]);
        
        // Contexto automático incluye: user_id, workspace_id, ip, url, timestamp
        LogHelper::jobInfo('Publishing completed', [
            'publication_id' => $publication->id,
            'duration_seconds' => $duration
        ]);
    }
}
```

**Ventajas:**
- Logs separados por contexto (`jobs.log`, `publications.log`)
- Información de usuario automática
- Fácil búsqueda con comandos artisan
- Errores críticos van a canal separado

## 🔄 Migración Paso a Paso

### 1. Importar el Helper

```php
// Agregar al inicio del archivo
use App\Helpers\LogHelper;
```

### 2. Reemplazar Logs Básicos

```php
// Antes
Log::info('Message', $context);

// Después - Elige el canal apropiado
LogHelper::jobInfo('Message', $context);
LogHelper::publicationInfo('Message', $context);
LogHelper::auth('info', 'Message', $context);
LogHelper::social('info', 'Message', $context);
```

### 3. Reemplazar Logs de Error

```php
// Antes
Log::error('Error message', $context);

// Después
LogHelper::jobError('Error message', $context);
LogHelper::publicationError('Error message', $context);
LogHelper::error('Error message', $context); // Solo canal de errores
```

## 📝 Ejemplos por Tipo de Clase

### En Controllers

```php
use App\Helpers\LogHelper;

class PublicationController extends Controller
{
    public function store(Request $request)
    {
        try {
            $publication = Publication::create($data);
            
            LogHelper::publicationInfo('Publication created', [
                'publication_id' => $publication->id,
                'title' => $publication->title
            ]);
            
            return response()->json($publication);
        } catch (\Exception $e) {
            LogHelper::publicationError('Failed to create publication', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            throw $e;
        }
    }
}
```

### En Jobs

```php
use App\Helpers\LogHelper;

class ProcessVideo implements ShouldQueue
{
    public function handle()
    {
        LogHelper::jobInfo('Video processing started', [
            'video_id' => $this->videoId,
            'job_id' => $this->job->uuid()
        ]);
        
        // ... procesamiento ...
        
        LogHelper::jobInfo('Video processing completed', [
            'video_id' => $this->videoId,
            'duration' => $duration
        ]);
    }
    
    public function failed(\Throwable $exception)
    {
        LogHelper::jobError('Video processing failed permanently', [
            'video_id' => $this->videoId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);
    }
}
```

### En Servicios de Autenticación

```php
use App\Helpers\LogHelper;

class AuthService
{
    public function login($credentials)
    {
        LogHelper::auth('info', 'Login attempt', [
            'email' => $credentials['email']
        ]);
        
        if (Auth::attempt($credentials)) {
            LogHelper::auth('info', 'Login successful');
            return true;
        }
        
        LogHelper::auth('warning', 'Login failed - invalid credentials', [
            'email' => $credentials['email']
        ]);
        
        return false;
    }
}
```

### En Servicios de Redes Sociales

```php
use App\Helpers\LogHelper;

class FacebookService
{
    public function publishPost($post)
    {
        try {
            LogHelper::social('info', 'Publishing to Facebook', [
                'post_id' => $post->id,
                'account_id' => $this->accountId
            ]);
            
            $result = $this->client->post('/me/feed', $data);
            
            LogHelper::social('info', 'Facebook publish successful', [
                'post_id' => $post->id,
                'facebook_id' => $result['id']
            ]);
            
            return $result;
        } catch (\Exception $e) {
            LogHelper::social('error', 'Facebook publish failed', [
                'post_id' => $post->id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
}
```

## 🔍 Buscar Logs Después de Migrar

```bash
# Buscar todos los logs de un usuario
php artisan logs:search "error" --user=123

# Ver qué pasó con una publicación
php artisan logs:search "publication_id\":456" --channel=publications

# Ver jobs fallidos
php artisan logs:search "failed" --channel=jobs --level=error

# Ver intentos de login
php artisan logs:search "login" --channel=auth

# Ver problemas con redes sociales
php artisan logs:search "facebook" --channel=social --level=error
```

## 📊 Ver Estadísticas

```bash
# Estadísticas de publicaciones
php artisan logs:stats --channel=publications

# Estadísticas de jobs
php artisan logs:stats --channel=jobs --date=2024-02-21
```

<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class LogHelper
{
    /**
     * Agrega contexto automático a los logs (usuario, IP, workspace)
     */
    private static function getContext(array $additionalContext = []): array
    {
        $context = $additionalContext;

        // Agregar información del usuario autenticado
        if (Auth::check()) {
            $user = Auth::user();
            $context['user_id'] = $user->id;
            $context['user_email'] = $user->email;
            
            if ($user->current_workspace_id) {
                $context['workspace_id'] = $user->current_workspace_id;
            }
        }

        // Agregar IP y request info si está disponible
        if (request()) {
            $context['ip'] = request()->ip();
            $context['url'] = request()->fullUrl();
            $context['method'] = request()->method();
        }

        $context['timestamp'] = now()->toIso8601String();

        return $context;
    }

    /**
     * Log para publicaciones
     */
    public static function publication(string $level, string $message, array $context = []): void
    {
        Log::channel('publications')->{$level}($message, self::getContext($context));
    }

    /**
     * Log para jobs/trabajos en segundo plano
     */
    public static function job(string $level, string $message, array $context = []): void
    {
        Log::channel('jobs')->{$level}($message, self::getContext($context));
    }

    /**
     * Log para autenticación
     */
    public static function auth(string $level, string $message, array $context = []): void
    {
        Log::channel('auth')->{$level}($message, self::getContext($context));
    }

    /**
     * Log para redes sociales
     */
    public static function social(string $level, string $message, array $context = []): void
    {
        Log::channel('social')->{$level}($message, self::getContext($context));
    }

    /**
     * Log de errores críticos
     */
    public static function error(string $message, array $context = []): void
    {
        Log::channel('errors')->error($message, self::getContext($context));
    }

    /**
     * Métodos de conveniencia para publicaciones
     */
    public static function publicationInfo(string $message, array $context = []): void
    {
        self::publication('info', $message, $context);
    }

    public static function publicationError(string $message, array $context = []): void
    {
        self::publication('error', $message, $context);
        self::error($message, $context); // También en el log de errores
    }

    /**
     * Métodos de conveniencia para jobs
     */
    public static function jobInfo(string $message, array $context = []): void
    {
        self::job('info', $message, $context);
    }

    public static function jobError(string $message, array $context = []): void
    {
        self::job('error', $message, $context);
        self::error($message, $context);
    }

    /**
     * Buscar logs por usuario
     */
    public static function searchByUser(int $userId, string $logFile = 'laravel'): array
    {
        $logPath = storage_path("logs/{$logFile}.log");
        
        if (!file_exists($logPath)) {
            return [];
        }

        $lines = file($logPath);
        $results = [];

        foreach ($lines as $line) {
            if (str_contains($line, "\"user_id\":{$userId}")) {
                $results[] = $line;
            }
        }

        return $results;
    }
}

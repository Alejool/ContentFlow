<?php

namespace App\Services\Storage;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Publications\Publication;
use Illuminate\Support\Str;

/**
 * Servicio centralizado para generar rutas organizadas en S3
 * 
 * Estructura jerárquica:
 * - avatars/{user_id}/
 * - workspaces/{workspace_id}/users/{user_id}/publications/
 * - workspaces/{workspace_id}/users/{user_id}/publications/{publication_id}/derivatives/
 * - workspaces/{workspace_id}/users/{user_id}/reels/
 * - workspaces/{workspace_id}/users/{user_id}/temp/
 * - workspaces/{workspace_id}/branding/
 */
class S3PathService
{
    /**
     * Genera ruta para avatar de usuario
     * Estructura: avatars/{user_id}/{filename}
     */
    public static function avatarPath(int $userId, string $extension = 'png'): string
    {
        $timestamp = time();
        return "avatars/{$userId}/{$timestamp}.{$extension}";
    }

    /**
     * Genera ruta para publicación
     * Estructura: workspaces/{workspace_id}/users/{user_id}/publications/{uuid}.{ext}
     */
    public static function publicationPath(int $workspaceId, int $userId, string $extension): string
    {
        $uuid = Str::uuid();
        return "workspaces/{$workspaceId}/users/{$userId}/publications/{$uuid}.{$extension}";
    }

    /**
     * Genera ruta para derivative de una publicación
     * Estructura: workspaces/{workspace_id}/users/{user_id}/publications/{publication_id}/derivatives/{type}/{filename}
     */
    public static function derivativePath(
        int $workspaceId,
        int $userId,
        int $publicationId,
        string $type,
        string $filename
    ): string {
        return "workspaces/{$workspaceId}/users/{$userId}/publications/{$publicationId}/derivatives/{$type}/{$filename}";
    }

    /**
     * Genera ruta para thumbnail de video
     * Estructura: workspaces/{workspace_id}/users/{user_id}/publications/{publication_id}/derivatives/thumbnails/{filename}
     */
    public static function thumbnailPath(
        int $workspaceId,
        int $userId,
        int $publicationId,
        string $filename
    ): string {
        return self::derivativePath($workspaceId, $userId, $publicationId, 'thumbnails', $filename);
    }

    /**
     * Genera ruta para imagen optimizada
     * Estructura: workspaces/{workspace_id}/users/{user_id}/publications/{publication_id}/derivatives/optimized/{filename}
     */
    public static function optimizedImagePath(
        int $workspaceId,
        int $userId,
        int $publicationId,
        string $filename
    ): string {
        return self::derivativePath($workspaceId, $userId, $publicationId, 'optimized', $filename);
    }

    /**
     * Genera ruta para reel
     * Estructura: workspaces/{workspace_id}/users/{user_id}/reels/{folder}/{uuid}_{filename}
     */
    public static function reelPath(
        int $workspaceId,
        int $userId,
        string $folder,
        string $filename
    ): string {
        $uuid = Str::uuid();
        return "workspaces/{$workspaceId}/users/{$userId}/reels/{$folder}/{$uuid}_{$filename}";
    }

    /**
     * Genera ruta para archivo temporal
     * Estructura: workspaces/{workspace_id}/users/{user_id}/temp/{filename}
     */
    public static function tempPath(int $workspaceId, int $userId, string $filename): string
    {
        return "workspaces/{$workspaceId}/users/{$userId}/temp/{$filename}";
    }

    /**
     * Genera ruta para branding de workspace (logo, favicon)
     * Estructura: workspaces/{workspace_id}/branding/{filename}
     */
    public static function workspaceBrandingPath(int $workspaceId, string $filename): string
    {
        return "workspaces/{$workspaceId}/branding/{$filename}";
    }

    /**
     * Extrae el workspace_id y user_id de una ruta existente
     * Útil para migración de archivos antiguos
     */
    public static function parsePathInfo(string $path): ?array
    {
        // Patrón: workspaces/{workspace_id}/users/{user_id}/...
        if (preg_match('#^workspaces/(\d+)/users/(\d+)/#', $path, $matches)) {
            return [
                'workspace_id' => (int) $matches[1],
                'user_id' => (int) $matches[2],
            ];
        }

        // Patrón: avatars/{user_id}/...
        if (preg_match('#^avatars/(\d+)/#', $path, $matches)) {
            return [
                'user_id' => (int) $matches[1],
            ];
        }

        // Patrón: workspaces/{workspace_id}/branding/...
        if (preg_match('#^workspaces/(\d+)/branding/#', $path, $matches)) {
            return [
                'workspace_id' => (int) $matches[1],
            ];
        }

        return null;
    }

    /**
     * Obtiene el prefijo de directorio para un workspace y usuario
     * Útil para listar archivos
     */
    public static function userWorkspacePrefix(int $workspaceId, int $userId): string
    {
        return "workspaces/{$workspaceId}/users/{$userId}/";
    }

    /**
     * Obtiene el prefijo de directorio para publicaciones de un usuario en un workspace
     */
    public static function publicationsPrefix(int $workspaceId, int $userId): string
    {
        return "workspaces/{$workspaceId}/users/{$userId}/publications/";
    }
}

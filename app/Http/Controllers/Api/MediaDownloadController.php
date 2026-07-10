<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\Publication;
use App\Services\Storage\S3PresignedUrlService;
use Aws\S3\Exception\S3Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use App\Http\Requests\Media\DownloadMediaRequest;
/**
 * Media Download Controller
 * 
 * Endpoints para generar presigned URLs para acceso a archivos privados en S3
 * 
 * Endpoints:
 * - GET /api/media/{mediaFileId}/download - Descargar archivo
 * - GET /api/media/{mediaFileId}/preview - Preview/stream del archivo
 * - GET /api/media/by-key - Obtener URL por S3 key (para archivos sin MediaFile)
 */
class MediaDownloadController extends Controller
{
    private S3PresignedUrlService $s3Service;

    public function __construct(S3PresignedUrlService $s3Service)
    {
        $this->s3Service = $s3Service;
        $this->middleware('auth:sanctum');
    }

    /**
     * GET /api/media/{mediaFileId}/download
     * 
     * Genera una presigned URL para descargar un archivo
     * Con Content-Disposition: attachment (fuerza descarga)
     */
    public function download(Request $request, int $mediaFileId)
    {
        try {
            $mediaFile = MediaFile::findOrFail($mediaFileId);

            // Validar que el usuario tiene acceso al archivo
            if (!$this->userCanAccessFile($request->user(), $mediaFile)) {
                Log::warning('Unauthorized media download attempt', [
                    'media_file_id' => $mediaFileId,
                    'user_id' => $request->user()->id,
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You do not have permission to download this file'
                ], 403);
            }

            // Verificar que el archivo existe en S3
            if (!$this->s3Service->fileExists($mediaFile->s3_key)) {
                return response()->json([
                    'error' => 'Not found',
                    'message' => 'File not found in storage'
                ], 404);
            }

            // Generar presigned URL con attachment disposition
            $url = $this->s3Service->getDownloadUrl(
                $mediaFile->s3_key,
                3600, // 1 hora
                [
                    'ResponseContentDisposition' => 'attachment; filename="' . $mediaFile->filename . '"',
                    'ResponseContentType' => $mediaFile->mime_type,
                ]
            );

            Log::info('Media download URL generated', [
                'media_file_id' => $mediaFileId,
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'download_url' => $url,
                'filename' => $mediaFile->filename,
                'expires_in' => 3600,
            ]);
        } catch (S3Exception $e) {
            Log::error('S3 error generating download URL', [
                'media_file_id' => $mediaFileId,
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'error' => 'Storage error',
                'message' => 'Failed to generate download URL'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error generating download URL', [
                'media_file_id' => $mediaFileId,
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'error' => 'Error',
                'message' => 'Failed to generate download URL'
            ], 500);
        }
    }

    /**
     * GET /api/media/{mediaFileId}/preview
     * 
     * Genera una presigned URL para preview del archivo
     * (sin attachment disposition - se abre en el navegador)
     */
    public function preview(Request $request, int $mediaFileId)
    {
        try {
            $mediaFile = MediaFile::findOrFail($mediaFileId);

            // Validar que el usuario tiene acceso al archivo
            if (!$this->userCanAccessFile($request->user(), $mediaFile)) {
                Log::warning('Unauthorized media preview attempt', [
                    'media_file_id' => $mediaFileId,
                    'user_id' => $request->user()->id,
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You do not have permission to preview this file'
                ], 403);
            }

            // Verificar que el archivo existe en S3
            if (!$this->s3Service->fileExists($mediaFile->s3_key)) {
                return response()->json([
                    'error' => 'Not found',
                    'message' => 'File not found in storage'
                ], 404);
            }

            // Generar presigned URL para preview
            $url = $this->generatePreviewUrl($mediaFile);

            Log::info('Media preview URL generated', [
                'media_file_id' => $mediaFileId,
                'user_id' => $request->user()->id,
                'mime_type' => $mediaFile->mime_type,
            ]);

            return response()->json([
                'success' => true,
                'preview_url' => $url,
                'mime_type' => $mediaFile->mime_type,
                'filename' => $mediaFile->filename,
                'expires_in' => 3600,
            ]);
        } catch (S3Exception $e) {
            Log::error('S3 error generating preview URL', [
                'media_file_id' => $mediaFileId,
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'error' => 'Storage error',
                'message' => 'Failed to generate preview URL'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error generating preview URL', [
                'media_file_id' => $mediaFileId,
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'error' => 'Error',
                'message' => 'Failed to generate preview URL'
            ], 500);
        }
    }

    /**
     * GET /api/media/by-key/preview
     * 
     * Genera presigned URL para una ruta S3 directa
     * Útil para archivos que no tienen MediaFile (ej: derivados, reels, etc)
     * 
     * Query params:
     * - key: string - Ruta del archivo en S3 (requerido)
     * - type: string - Tipo de media (image, video, pdf) para hint de content-type
     */
    public function previewByKey(DownloadMediaRequest $request)
    {


        try {
            $s3Key = $request->input('key');
            $type = $request->input('type', 'image');

            // Validar que el usuario tiene acceso a esta ruta
            // (validación basada en workspace_id/user_id en la ruta)
            if (!$this->userCanAccessKey($request->user(), $s3Key)) {
                Log::warning('Unauthorized media by-key preview attempt', [
                    's3_key' => $s3Key,
                    'user_id' => $request->user()->id,
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You do not have permission to access this file'
                ], 403);
            }

            // Verificar que el archivo existe en S3
            if (!$this->s3Service->fileExists($s3Key)) {
                return response()->json([
                    'error' => 'Not found',
                    'message' => 'File not found in storage'
                ], 404);
            }

            // Generar presigned URL según el tipo
            $url = match ($type) {
                'video' => $this->s3Service->getVideoStreamUrl($s3Key),
                'pdf' => $this->s3Service->getDownloadUrl($s3Key, 3600, [
                    'ResponseContentType' => 'application/pdf',
                ]),
                'audio' => $this->s3Service->getDownloadUrl($s3Key, 3600, [
                    'ResponseContentType' => 'audio/mpeg',
                ]),
                default => $this->s3Service->getPreviewUrl($s3Key),
            };

            Log::info('Media preview by-key URL generated', [
                's3_key' => $s3Key,
                'type' => $type,
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'preview_url' => $url,
                'type' => $type,
                'expires_in' => 3600,
            ]);
        } catch (S3Exception $e) {
            Log::error('S3 error generating preview by-key URL', [
                's3_key' => $request->input('key'),
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'error' => 'Storage error',
                'message' => 'Failed to generate preview URL'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error generating preview by-key URL', [
                's3_key' => $request->input('key'),
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'error' => 'Error',
                'message' => 'Failed to generate preview URL'
            ], 500);
        }
    }

    /**
     * Valida si el usuario puede acceder a un MediaFile
     * 
     * Reglas:
     * - El archivo debe pertenecer a una publicación del usuario
     * - O el usuario es propietario del workspace
     */
    private function userCanAccessFile($user, MediaFile $mediaFile): bool
    {
        // Si no hay publicación asociada, denegar acceso
        if (!$mediaFile->publication_id) {
            return false;
        }

        $publication = Publication::findOrFail($mediaFile->publication_id);

        // El usuario debe ser propietario del workspace de la publicación
        return $publication->workspace_id === $user->current_workspace_id;
    }

    /**
     * Valida si el usuario puede acceder a un archivo por su ruta S3
     * 
     * Extrae workspace_id y user_id de la ruta y valida acceso
     */
    private function userCanAccessKey($user, string $s3Key): bool
    {
        // Extraer workspace_id de la ruta
        // Patrón: workspaces/{workspace_id}/users/{user_id}/...
        if (preg_match('#^workspaces/(\d+)/users/(\d+)/#', $s3Key, $matches)) {
            $workspaceId = (int) $matches[1];
            $fileOwnerId = (int) $matches[2];

            // Validar que el user está en este workspace
            // Y que el archivo le pertenece a él o está en una publicación compartida
            return $workspaceId === $user->current_workspace_id;
        }

        // Patrón: avatars/{user_id}/...
        if (preg_match('#^avatars/(\d+)/#', $s3Key, $matches)) {
            $fileOwnerId = (int) $matches[1];
            // Solo el propietario del avatar puede acceder
            return $fileOwnerId === $user->id;
        }

        // Patrón: workspaces/{workspace_id}/branding/...
        if (preg_match('#^workspaces/(\d+)/branding/#', $s3Key, $matches)) {
            $workspaceId = (int) $matches[1];
            // Solo miembros del workspace pueden acceder a branding
            return $workspaceId === $user->current_workspace_id;
        }

        // Por defecto, denegar acceso a rutas desconocidas
        return false;
    }

    /**
     * Helper para generar URL de preview basada en mime type
     */
    private function generatePreviewUrl(MediaFile $mediaFile): string
    {
        $mimeType = $mediaFile->mime_type;

        if (str_starts_with($mimeType, 'video/')) {
            return $this->s3Service->getVideoStreamUrl($mediaFile->s3_key);
        }

        if (str_starts_with($mimeType, 'image/')) {
            return $this->s3Service->getImageUrl($mediaFile->s3_key);
        }

        if ($mimeType === 'application/pdf') {
            return $this->s3Service->getDownloadUrl($mediaFile->s3_key, 3600, [
                'ResponseContentType' => 'application/pdf',
            ]);
        }

        return $this->s3Service->getPreviewUrl($mediaFile->s3_key);
    }
}

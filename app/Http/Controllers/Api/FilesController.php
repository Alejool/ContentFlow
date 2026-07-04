<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Files\ConfirmUploadRequest;
use App\Http\Requests\Files\PresignUploadRequest;
use App\Models\MediaFiles\MediaFile;
use App\Services\Storage\S3PathService;
use App\Services\Storage\S3PresignedUrlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Controller para gestionar URLs presignadas de S3
 * 
 * Arquitectura:
 * 1. Frontend solicita signed PUT URL para upload
 * 2. Backend valida permisos y genera URL temporal
 * 3. Frontend sube directo a S3 usando URL
 * 4. Frontend notifica al backend para confirmar
 * 5. Backend crea registro en DB con s3_key
 * 
 * Para acceso:
 * 1. Frontend solicita signed GET URL
 * 2. Backend valida permisos
 * 3. Backend genera URL temporal y la devuelve
 * 4. Frontend usa URL para acceder (stream, download, etc)
 */
class FilesController extends Controller
{
    private S3PresignedUrlService $s3Service;

    public function __construct(S3PresignedUrlService $s3Service)
    {
        $this->s3Service = $s3Service;
        $this->middleware('auth:sanctum');
    }

    /**
     * POST /api/files/upload-url
     * 
     * Genera una signed PUT URL para que el frontend suba directo a S3
     * 
     * Request:
     * {
     *   "fileName": "video.mp4",
     *   "mimeType": "video/mp4",
     *   "size": 123456,
     *   "uploadType": "publication" // opcional: publication, avatar, reel, etc
     * }
     * 
     * Response:
     * {
     *   "uploadUrl": "https://...",
     *   "s3Key": "workspaces/7/users/3/publications/uuid.mp4",
     *   "expiresIn": 300
     * }
     */
    public function generateUploadUrl(PresignUploadRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $user = Auth::user();
            $workspaceId = $user->current_workspace_id;

            // Validar que el usuario tiene acceso al workspace
            if (!$workspaceId || !$user->workspaces()->whereKey($workspaceId)->exists()) {
                return response()->json([
                    'message' => 'Unauthorized workspace access'
                ], 403);
            }

            // Generar ruta S3 según tipo
            $uploadType = $validated['uploadType'] ?? 'publication';
            $extension = $this->getFileExtension($validated['fileName']);
            
            $s3Key = match ($uploadType) {
                'avatar' => S3PathService::avatarPath($user->id, $extension),
                'publication' => S3PathService::publicationPath($workspaceId, $user->id, $extension),
                'reel' => S3PathService::reelPath($workspaceId, $user->id, 'uploads', $validated['fileName']),
                'document' => S3PathService::tempPath($workspaceId, $user->id, Str::uuid() . '.' . $extension),
                default => S3PathService::publicationPath($workspaceId, $user->id, $extension),
            };

            // Generar signed PUT URL
            $uploadUrl = $this->s3Service->getPutUrl(
                $s3Key,
                $validated['mimeType'],
                300 // 5 minutos
            );

            return response()->json([
                'uploadUrl' => $uploadUrl,
                's3Key' => $s3Key,
                'expiresIn' => 300,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error generating upload URL', [
                'error' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to generate upload URL',
                'error' => $e->getMessage(), // Incluir mensaje de error para debugging
            ], 500);
        }
    }

    /**
     * POST /api/files/confirm-upload
     * 
     * Confirma que un archivo fue subido a S3 y crea el registro en DB
     * 
     * Request:
     * {
     *   "s3Key": "workspaces/7/users/3/publications/uuid.mp4",
     *   "fileName": "video.mp4",
     *   "mimeType": "video/mp4",
     *   "size": 123456
     * }
     * 
     * Response:
     * {
     *   "mediaFileId": 123,
     *   "s3Key": "..."
     * }
     */
    public function confirmUpload(ConfirmUploadRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $user = Auth::user();
            $workspaceId = $user->current_workspace_id;

            // Validar que el usuario tiene acceso al workspace
            if (!$workspaceId || !$user->workspaces()->whereKey($workspaceId)->exists()) {
                return response()->json([
                    'message' => 'Unauthorized workspace access'
                ], 403);
            }

            // Validar que el archivo existe en S3
            if (!$this->s3Service->fileExists($validated['s3Key'])) {
                return response()->json([
                    'message' => 'File not found in S3',
                ], 404);
            }

            // Validar que la s3Key pertenece al usuario/workspace
            if (!$this->isValidS3KeyForUser($validated['s3Key'], $workspaceId, $user->id)) {
                return response()->json([
                    'message' => 'Unauthorized: S3 key does not belong to current workspace',
                ], 403);
            }

            // Crear registro de MediaFile
            $mediaFile = MediaFile::create([
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'file_name' => $validated['fileName'],
                'file_path' => $validated['s3Key'], // Mantener para backward compatibility
                's3_key' => $validated['s3Key'],
                'file_type' => $this->inferFileType($validated['mimeType']),
                'mime_type' => $validated['mimeType'],
                'size' => $validated['size'],
                'status' => 'pending', // Será 'ready' después de procesamiento
            ]);

            return response()->json([
                'mediaFileId' => $mediaFile->id,
                's3Key' => $mediaFile->s3_key,
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error confirming upload', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                's3_key' => $validated['s3Key'] ?? null,
            ]);

            return response()->json([
                'message' => 'Failed to confirm upload',
            ], 500);
        }
    }

    /**
     * GET /api/files/{id}/access
     * 
     * Genera una signed GET URL para acceder a un archivo privado
     * Valida que el usuario tiene permiso de acceso
     * 
     * Response:
     * {
     *   "url": "https://...",
     *   "expiresIn": 3600,
     *   "mimeType": "video/mp4"
     * }
     */
    public function getAccessUrl($id): JsonResponse
    {
        try {
            $user = Auth::user();
            $workspaceId = $user->current_workspace_id;

            // Obtener archivo
            $mediaFile = MediaFile::findOrFail($id);

            // Validar que el usuario tiene acceso
            // 1. Verificar que pertenece al mismo workspace
            if ($mediaFile->workspace_id !== $workspaceId) {
                return response()->json([
                    'message' => 'Unauthorized: File does not belong to current workspace'
                ], 403);
            }

            // 2. Verificar que el usuario es propietario o tiene acceso explícito
            if ($mediaFile->user_id !== $user->id) {
                // Aquí se podría agregar lógica de permisos compartidos
                // Por ahora, solo el propietario puede acceder
                return response()->json([
                    'message' => 'Unauthorized: User is not the file owner'
                ], 403);
            }

            // Validar que s3_key existe
            if (!$mediaFile->s3_key) {
                return response()->json([
                    'message' => 'Invalid file: missing S3 key'
                ], 400);
            }

            // Validar que el archivo existe en S3
            if (!$this->s3Service->fileExists($mediaFile->s3_key)) {
                return response()->json([
                    'message' => 'File not found in S3',
                ], 404);
            }

            // Generar signed GET URL
            $signedUrl = $this->s3Service->getDownloadUrl(
                $mediaFile->s3_key,
                3600 // 1 hora
            );

            \Log::info('File access granted', [
                'media_file_id' => $mediaFile->id,
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'signedUrl' => $signedUrl, // Incluir URL en logs para debugging (remover en producción si es sensible)
            ]);

            return response()->json([
                'url' => $signedUrl,
                'expiresIn' => 3600,
                'mimeType' => $mediaFile->mime_type,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error generating file access URL', [
                'error' => $e->getMessage(),
                'media_file_id' => $id,
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Failed to generate access URL',
            ], 500);
        }
    }

    /**
     * DELETE /api/files/{id}
     * 
     * Elimina un archivo (de S3 y DB)
     * Solo el propietario puede eliminarlo
     */
    public function delete($id): JsonResponse
    {
        try {
            $user = Auth::user();
            $workspaceId = $user->current_workspace_id;

            $mediaFile = MediaFile::findOrFail($id);

            // Validar permisos
            if ($mediaFile->workspace_id !== $workspaceId || $mediaFile->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Eliminar de S3
            if ($mediaFile->s3_key) {
                $this->s3Service->deleteObject($mediaFile->s3_key);
            }

            // Eliminar de DB
            $mediaFile->delete();

            return response()->json([
                'message' => 'File deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error deleting file', [
                'error' => $e->getMessage(),
                'media_file_id' => $id,
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Failed to delete file',
            ], 500);
        }
    }

    // ========== Helper Methods ==========

    /**
     * Extrae la extensión de un nombre de archivo
     */
    private function getFileExtension(string $fileName): string
    {
        $parts = explode('.', $fileName);
        return end($parts) ?: 'unknown';
    }

    /**
     * Infiere el tipo de archivo (image, video) a partir del MIME type
     */
    private function inferFileType(string $mimeType): string
    {
        if (strpos($mimeType, 'image/') === 0) {
            return 'image';
        }
        if (strpos($mimeType, 'video/') === 0) {
            return 'video';
        }
        return 'document';
    }

    /**
     * Valida que una s3Key pertenece al usuario y workspace actual
     * Previene que usuarios accedan a archivos de otros users/workspaces
     */
    private function isValidS3KeyForUser(string $s3Key, int $workspaceId, int $userId): bool
    {
        // Patrón: workspaces/{workspace_id}/users/{user_id}/...
        if (preg_match('#^workspaces/(\d+)/users/(\d+)/#', $s3Key, $matches)) {
            $keyWorkspaceId = (int) $matches[1];
            $keyUserId = (int) $matches[2];
            return $keyWorkspaceId === $workspaceId && $keyUserId === $userId;
        }

        // Patrón: avatars/{user_id}/...
        if (preg_match('#^avatars/(\d+)/#', $s3Key, $matches)) {
            $keyUserId = (int) $matches[1];
            return $keyUserId === $userId;
        }

        return false;
    }
}

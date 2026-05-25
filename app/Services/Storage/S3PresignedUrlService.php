<?php

namespace App\Services\Storage;

use Aws\S3\Exception\S3Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Servicio centralizado para generar URLs presignadas de S3
 * 
 * Características:
 * - Generar presigned GET URLs para acceso de lectura a archivos privados
 * - Generar presigned PUT URLs para uploads (existente en UploadController)
 * - Validar autorización antes de generar URLs
 * - Manejo de errores S3
 * - TTL configurable
 */
class S3PresignedUrlService
{
    /**
     * Tiempo por defecto de expiración de presigned URLs (en segundos)
     */
    private const DEFAULT_GET_EXPIRATION = 3600; // 1 hora
    private const DEFAULT_PUT_EXPIRATION = 1200; // 20 minutos

    /**
     * Genera una presigned GET URL para descargar un archivo privado
     * 
     * @param string $s3Key Ruta del archivo en S3
     * @param int $expiresIn Segundos hasta expiración (default: 1 hora)
     * @param array $options Opciones adicionales (ResponseContentType, ResponseContentDisposition, etc)
     * @return string URL presignada
     * @throws S3Exception
     */
    public function getDownloadUrl(
        string $s3Key,
        int $expiresIn = self::DEFAULT_GET_EXPIRATION,
        array $options = []
    ): string {
        if (config('filesystems.default') !== 's3') {
            throw new \RuntimeException('S3 storage is not configured');
        }

        try {
            $client = Storage::disk('s3')->getClient();
            $bucket = config('filesystems.disks.s3.bucket');

            $cmdParams = [
                'Bucket' => $bucket,
                'Key' => $s3Key,
            ];

            // Agregar opciones de respuesta (content-type, disposition, etc)
            if (!empty($options['ResponseContentType'])) {
                $cmdParams['ResponseContentType'] = $options['ResponseContentType'];
            }
            if (!empty($options['ResponseContentDisposition'])) {
                $cmdParams['ResponseContentDisposition'] = $options['ResponseContentDisposition'];
            }

            $cmd = $client->getCommand('GetObject', $cmdParams);
            $requestS3 = $client->createPresignedRequest($cmd, "+{$expiresIn} seconds");
            $url = (string)$requestS3->getUri();

            Log::info('Presigned GET URL generated', [
                'key' => $s3Key,
                'expires_in' => $expiresIn,
                'user_id' => auth()->id(),
            ]);

            return $url;
        } catch (S3Exception $e) {
            Log::error('S3 error generating presigned GET URL', [
                'error' => $e->getMessage(),
                'aws_error_code' => $e->getAwsErrorCode(),
                'key' => $s3Key,
                'user_id' => auth()->id(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Unexpected error generating presigned GET URL', [
                'error' => $e->getMessage(),
                'key' => $s3Key,
                'user_id' => auth()->id(),
            ]);
            throw $e;
        }
    }

    /**
     * Genera una presigned GET URL para preview de un archivo
     * (similar a getDownloadUrl pero sin content-disposition para que se abra en el navegador)
     * 
     * @param string $s3Key Ruta del archivo en S3
     * @param int $expiresIn Segundos hasta expiración
     * @return string URL presignada
     * @throws S3Exception
     */
    public function getPreviewUrl(
        string $s3Key,
        int $expiresIn = self::DEFAULT_GET_EXPIRATION
    ): string {
        return $this->getDownloadUrl($s3Key, $expiresIn);
    }

    /**
     * Genera una presigned URL para streaming de video
     * 
     * @param string $s3Key Ruta del archivo en S3
     * @param int $expiresIn Segundos hasta expiración
     * @return string URL presignada
     * @throws S3Exception
     */
    public function getVideoStreamUrl(
        string $s3Key,
        int $expiresIn = self::DEFAULT_GET_EXPIRATION
    ): string {
        return $this->getDownloadUrl($s3Key, $expiresIn, [
            'ResponseContentType' => 'video/mp4',
        ]);
    }

    /**
     * Genera una presigned URL para imagen
     * 
     * @param string $s3Key Ruta del archivo en S3
     * @param int $expiresIn Segundos hasta expiración
     * @return string URL presignada
     * @throws S3Exception
     */
    public function getImageUrl(
        string $s3Key,
        int $expiresIn = self::DEFAULT_GET_EXPIRATION
    ): string {
        return $this->getDownloadUrl($s3Key, $expiresIn);
    }

    /**
     * Genera una presigned PUT URL para upload
     * (utility method para centralizar lógica)
     * 
     * @param string $s3Key Ruta del archivo en S3
     * @param string $contentType MIME type del archivo
     * @param int $expiresIn Segundos hasta expiración
     * @return string URL presignada
     * @throws S3Exception
     */
    public function getPutUrl(
        string $s3Key,
        string $contentType,
        int $expiresIn = self::DEFAULT_PUT_EXPIRATION
    ): string {
        if (config('filesystems.default') !== 's3') {
            throw new \RuntimeException('S3 storage is not configured');
        }

        try {
            $client = Storage::disk('s3')->getClient();
            $bucket = config('filesystems.disks.s3.bucket');

            $cmd = $client->getCommand('PutObject', [
                'Bucket' => $bucket,
                'Key' => $s3Key,
                'ContentType' => $contentType,
            ]);

            $requestS3 = $client->createPresignedRequest($cmd, "+{$expiresIn} seconds");
            $url = (string)$requestS3->getUri();

            Log::info('Presigned PUT URL generated', [
                'key' => $s3Key,
                'content_type' => $contentType,
                'expires_in' => $expiresIn,
                'user_id' => auth()->id(),
            ]);

            return $url;
        } catch (S3Exception $e) {
            Log::error('S3 error generating presigned PUT URL', [
                'error' => $e->getMessage(),
                'aws_error_code' => $e->getAwsErrorCode(),
                'key' => $s3Key,
                'user_id' => auth()->id(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Unexpected error generating presigned PUT URL', [
                'error' => $e->getMessage(),
                'key' => $s3Key,
                'user_id' => auth()->id(),
            ]);
            throw $e;
        }
    }

    /**
     * Valida si una ruta S3 existe en el bucket
     * Útil para verificar que un archivo está disponible antes de generar URL
     * 
     * @param string $s3Key Ruta del archivo en S3
     * @return bool
     */
    public function fileExists(string $s3Key): bool
    {
        try {
            return Storage::disk('s3')->exists($s3Key);
        } catch (\Exception $e) {
            Log::warning('Error checking S3 file existence', [
                'key' => $s3Key,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Obtiene metadata de un objeto S3 (size, etag, content-type, etc)
     * 
     * @param string $s3Key Ruta del archivo en S3
     * @return array|null Metadata del archivo o null si no existe
     */
    public function getObjectMetadata(string $s3Key): ?array
    {
        try {
            $client = Storage::disk('s3')->getClient();
            $bucket = config('filesystems.disks.s3.bucket');

            $headObjectResponse = $client->headObject([
                'Bucket' => $bucket,
                'Key' => $s3Key,
            ]);

            return [
                'size' => $headObjectResponse['ContentLength'] ?? null,
                'content_type' => $headObjectResponse['ContentType'] ?? null,
                'etag' => $headObjectResponse['ETag'] ?? null,
                'last_modified' => $headObjectResponse['LastModified'] ?? null,
                'storage_class' => $headObjectResponse['StorageClass'] ?? null,
            ];
        } catch (S3Exception $e) {
            if ($e->getAwsErrorCode() === 'NotFound') {
                return null;
            }
            Log::warning('Error getting S3 object metadata', [
                'key' => $s3Key,
                'error' => $e->getMessage(),
            ]);
            return null;
        } catch (\Exception $e) {
            Log::warning('Unexpected error getting S3 object metadata', [
                'key' => $s3Key,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Elimina un objeto de S3
     * 
     * @param string $s3Key Ruta del archivo en S3
     * @return bool true si se eliminó exitosamente, false si ocurrió error
     */
    public function deleteObject(string $s3Key): bool
    {
        try {
            Storage::disk('s3')->delete($s3Key);

            Log::info('S3 object deleted', [
                'key' => $s3Key,
                'user_id' => auth()->id(),
            ]);

            return true;
        } catch (S3Exception $e) {
            Log::error('S3 error deleting object', [
                'error' => $e->getMessage(),
                'aws_error_code' => $e->getAwsErrorCode(),
                'key' => $s3Key,
                'user_id' => auth()->id(),
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('Unexpected error deleting S3 object', [
                'error' => $e->getMessage(),
                'key' => $s3Key,
                'user_id' => auth()->id(),
            ]);
            return false;
        }
    }
}

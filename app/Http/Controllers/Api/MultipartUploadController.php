<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Storage\S3PathService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Aws\S3\Exception\S3Exception;

class MultipartUploadController extends Controller
{
  /**
   * Initiate a Multipart Upload
   * POST /api/upload/multipart/init
   */
  public function initiate(Request $request)
  {
    $request->validate([
      'filename' => 'required|string',
      'content_type' => 'required|string',
      'file_size' => 'nullable|integer|min:1',
      'pending_bytes' => 'nullable|integer|min:0', // bytes of files already queued for upload
    ]);

    // --- Storage limit pre-check ---
    $fileSize = (int) $request->input('file_size', 0);
    $pendingBytes = (int) $request->input('pending_bytes', 0);
    
    if ($fileSize > 0) {
      $user      = $request->user();
      $workspace = $user?->currentWorkspace ?? $user?->workspaces()->find($user?->current_workspace_id);
      if ($workspace) {
        $validator = app(\App\Services\Subscription\PlanLimitValidator::class);
        
        // Check if this specific file can be uploaded considering pending uploads
        if (!$validator->canUploadSize($workspace, $fileSize, $pendingBytes)) {
          $upgradeMsg = $validator->getUpgradeMessage($workspace, 'storage');
          $remaining = $validator->getRemainingStorageBytes($workspace, $pendingBytes);
          
          return response()->json([
            'error'       => $upgradeMsg['message'],
            'action'      => $upgradeMsg['action'],
            'limit_type'  => 'storage',
            'upgrade_plan' => $upgradeMsg['suggested_plan'],
            'remaining_bytes' => $remaining,
            'file_size' => $fileSize,
            'pending_bytes' => $pendingBytes,
          ], 402);
        }
      }
    }

    $filename = $request->input('filename');
    $contentType = $request->input('content_type');
    $user = $request->user();

    // Validate content type against allowed types
    $allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'application/pdf',
    ];

    if (!in_array($contentType, $allowedMimeTypes)) {
      return response()->json([
        'error' => 'File type not allowed. Allowed types: ' . implode(', ', $allowedMimeTypes)
      ], 400);
    }

    // Check for executable extensions
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $executableExtensions = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'sh', 'php', 'py'];

    if (in_array($extension, $executableExtensions)) {
      Log::warning('Executable file upload attempt via multipart upload', [
        'filename' => $filename,
        'ip' => $request->ip(),
        'user_id' => $request->user()?->id,
      ]);

      return response()->json([
        'error' => 'Executable files are not allowed'
      ], 400);
    }

    // Generate unique key
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    // Usar el nuevo servicio de rutas organizadas
    $key = S3PathService::publicationPath(
      $user->current_workspace_id,
      $user->id,
      $extension
    );

    try {
      /** @var \Aws\S3\S3Client $client */
      $client = Storage::disk('s3')->getClient();
      $bucket = config('filesystems.disks.s3.bucket');

      $result = $client->createMultipartUpload([
        'Bucket' => $bucket,
        'Key' => $key,
        'ContentType' => $contentType,
        // 'ACL' => 'public-read', // Uncomment if needed
      ]);

      return response()->json([
        'uploadId' => $result['UploadId'],
        'key' => $key,
      ]);
    } catch (S3Exception $e) {
      return response()->json(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Sign a specific Part Upload
   * POST /api/upload/multipart/sign-part
   */
  public function signPart(Request $request)
  {
    $request->validate([
      'key' => 'required|string',
      'uploadId' => 'required|string',
      'partNumber' => 'required|integer',
    ]);

    $key = $request->input('key');
    $uploadId = $request->input('uploadId');
    $partNumber = $request->input('partNumber');

    try {
      /** @var \Aws\S3\S3Client $client */
      $client = Storage::disk('s3')->getClient();
      $bucket = config('filesystems.disks.s3.bucket');

      $cmd = $client->getCommand('UploadPart', [
        'Bucket' => $bucket,
        'Key' => $key,
        'UploadId' => $uploadId,
        'PartNumber' => $partNumber,
        'Body' => '',
      ]);

      $requestS3 = $client->createPresignedRequest($cmd, '+20 minutes');
      $presignedUrl = (string) $requestS3->getUri();

      return response()->json([
        'upload_url' => $presignedUrl,
      ]);
    } catch (S3Exception $e) {
      return response()->json(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Complete the Multipart Upload
   * POST /api/upload/multipart/complete
   */
  public function complete(Request $request)
  {
    $request->validate([
      'key' => 'required|string',
      'uploadId' => 'required|string',
      'parts' => 'required|array',
      'parts.*.ETag' => 'required|string',
      'parts.*.PartNumber' => 'required|integer',
    ]);

    $key = $request->input('key');
    $uploadId = $request->input('uploadId');
    $parts = $request->input('parts');

    // Sort parts by PartNumber (S3 requirement)
    usort($parts, function ($a, $b) {
      return $a['PartNumber'] <=> $b['PartNumber'];
    });

    try {
      /** @var \Aws\S3\S3Client $client */
      $client = Storage::disk('s3')->getClient();
      $bucket = config('filesystems.disks.s3.bucket');

      $result = $client->completeMultipartUpload([
        'Bucket' => $bucket,
        'Key' => $key,
        'UploadId' => $uploadId,
        'MultipartUpload' => [
          'Parts' => $parts,
        ],
      ]);

      return response()->json([
        'location' => $result['Location'],
        'key' => $key,
        'status' => 'uploaded',
      ]);
    } catch (S3Exception $e) {
      return response()->json(['error' => $e->getMessage()], 500);
    }
  }
}

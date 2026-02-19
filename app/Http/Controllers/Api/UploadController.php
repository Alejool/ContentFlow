<?php

namespace App\Http\Controllers\Api;

use App\Events\UploadProgressUpdated;
use App\Http\Controllers\Controller;
use Aws\S3\Exception\S3Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
  /**
   * Generate a presigned URL for S3 upload.
   */
  public function sign(Request $request)
  {
    $request->validate([
      'filename' => 'required|string',
      'content_type' => 'required|string',
    ]);

    $filename = $request->input('filename');
    $contentType = $request->input('content_type');

    $uuid = Str::uuid();
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    $key = "publications/{$uuid}.{$extension}";

    if (config('filesystems.default') === 's3') {
      $client = Storage::disk('s3')->getClient();
      $bucket = config('filesystems.disks.s3.bucket');

      $cmd = $client->getCommand('PutObject', [
        'Bucket' => $bucket,
        'Key' => $key,
        'ContentType' => $contentType,
        // 'Body' => '', // Valid for pre-signing? Usually yes.
        // 'ACL' => 'public-read', // Optional, depends on bucket policy
      ]);

      $requestS3 = $client->createPresignedRequest($cmd, '+20 minutes');
      $presignedUrl = (string)$requestS3->getUri();

      return response()->json([
        'upload_url' => $presignedUrl,
        'key' => $key,
        'uuid' => $uuid,
        'method' => 'PUT'
      ]);
    } else {
      // Fallback for local driver (if not using S3 in dev)
      // This is tricky for "direct upload" simulation locally without MinIO.
      // For now, let's assume S3 is configured or error out/fallback to normal.
      return response()->json([
        'error' => 'Storage driver must be S3 for direct upload'
      ], 400);
    }
  }

  /**
   * Store upload progress in cache for retrieval
   * POST /api/uploads/progress
   */
  public function updateProgress(Request $request)
  {
    $validated = $request->validate([
      'upload_id' => 'required|string',
      'progress' => 'required|integer|min:0|max:100',
      'bytes_uploaded' => 'required|integer|min:0',
      'total_bytes' => 'required|integer|min:1',
      'speed' => 'nullable|numeric|min:0',
      'eta' => 'nullable|integer|min:0',
    ]);

    $key = "upload_progress:{$validated['upload_id']}";

    $data = [
      'progress' => $validated['progress'],
      'bytes_uploaded' => $validated['bytes_uploaded'],
      'total_bytes' => $validated['total_bytes'],
      'speed' => $validated['speed'] ?? null,
      'eta' => $validated['eta'] ?? null,
      'updated_at' => now()->timestamp,
    ];

    // Store in cache for 2 hours
    Cache::put($key, $data, now()->addHours(2));

    // Broadcast progress update via WebSocket
    broadcast(new UploadProgressUpdated(
      $request->user()->id,
      $validated['upload_id'],
      $validated['progress'],
      $data
    ));

    return response()->json(['success' => true]);
  }

  /**
   * Cancel an ongoing upload
   * DELETE /api/uploads/{uploadId}
   */
  public function cancelUpload(Request $request, string $uploadId)
  {
    $validated = $request->validate([
      's3_key' => 'required|string',
      'multipart_upload_id' => 'nullable|string',
    ]);

    try {
      if (config('filesystems.default') !== 's3') {
        return response()->json([
          'error' => 'S3 storage is required for upload cancellation'
        ], 400);
      }

      /** @var \Aws\S3\S3Client $client */
      $client = Storage::disk('s3')->getClient();
      $bucket = config('filesystems.disks.s3.bucket');

      // Abort multipart upload if applicable
      if (!empty($validated['multipart_upload_id'])) {
        try {
          $client->abortMultipartUpload([
            'Bucket' => $bucket,
            'Key' => $validated['s3_key'],
            'UploadId' => $validated['multipart_upload_id'],
          ]);
        } catch (S3Exception $e) {
          // Log but don't fail - continue to delete the object
          \Log::warning('Failed to abort multipart upload', [
            'upload_id' => $uploadId,
            'error' => $e->getMessage()
          ]);
        }
      }

      // Delete partial file from S3
      try {
        $client->deleteObject([
          'Bucket' => $bucket,
          'Key' => $validated['s3_key'],
        ]);
      } catch (S3Exception $e) {
        // Object might not exist yet, which is fine
        \Log::info('Object not found during cancellation', [
          'upload_id' => $uploadId,
          's3_key' => $validated['s3_key']
        ]);
      }

      // Clear progress cache
      Cache::forget("upload_progress:{$uploadId}");
      Cache::forget("upload_paused:{$uploadId}");

      return response()->json(['success' => true]);
    } catch (\Exception $e) {
      \Log::error('Upload cancellation failed', [
        'upload_id' => $uploadId,
        'error' => $e->getMessage()
      ]);

      return response()->json([
        'error' => 'Failed to cancel upload',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  /**
   * Pause upload by storing current state
   * POST /api/uploads/{uploadId}/pause
   */
  public function pauseUpload(Request $request, string $uploadId)
  {
    $validated = $request->validate([
      's3_key' => 'required|string',
      'multipart_upload_id' => 'required|string',
      'uploaded_parts' => 'required|array',
      'uploaded_parts.*.PartNumber' => 'required|integer',
      'uploaded_parts.*.ETag' => 'required|string',
      'bytes_uploaded' => 'nullable|integer|min:0',
      'total_bytes' => 'nullable|integer|min:1',
    ]);

    // Store pause state in cache for resumption (keep for 7 days)
    $pauseData = [
      's3_key' => $validated['s3_key'],
      'multipart_upload_id' => $validated['multipart_upload_id'],
      'uploaded_parts' => $validated['uploaded_parts'],
      'bytes_uploaded' => $validated['bytes_uploaded'] ?? 0,
      'total_bytes' => $validated['total_bytes'] ?? 0,
      'paused_at' => now()->timestamp,
      'user_id' => $request->user()->id,
    ];

    Cache::put("upload_paused:{$uploadId}", $pauseData, now()->addDays(7));

    return response()->json([
      'success' => true,
      'message' => 'Upload paused successfully'
    ]);
  }

  /**
   * Resume a paused upload
   * GET /api/uploads/{uploadId}/resume
   */
  public function resumeUpload(Request $request, string $uploadId)
  {
    $pausedState = Cache::get("upload_paused:{$uploadId}");

    if (!$pausedState) {
      return response()->json([
        'error' => 'No paused upload found',
        'message' => 'The upload may have expired or was never paused'
      ], 404);
    }

    // Verify the user owns this paused upload
    if ($pausedState['user_id'] !== $request->user()->id) {
      return response()->json([
        'error' => 'Unauthorized',
        'message' => 'You do not have permission to resume this upload'
      ], 403);
    }

    return response()->json([
      'success' => true,
      'state' => [
        's3_key' => $pausedState['s3_key'],
        'multipart_upload_id' => $pausedState['multipart_upload_id'],
        'uploaded_parts' => $pausedState['uploaded_parts'],
        'bytes_uploaded' => $pausedState['bytes_uploaded'],
        'total_bytes' => $pausedState['total_bytes'],
        'paused_at' => $pausedState['paused_at'],
      ]
    ]);
  }
}

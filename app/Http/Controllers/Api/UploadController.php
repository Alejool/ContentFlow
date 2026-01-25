<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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

    // Create a unique path
    $uuid = Str::uuid();
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    $key = "publications/{$uuid}.{$extension}";

    // Check if we are using S3
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
      // But user asked for this architecture.
      return response()->json([
        'error' => 'Storage driver must be S3 for direct upload'
      ], 400);
    }
  }
}

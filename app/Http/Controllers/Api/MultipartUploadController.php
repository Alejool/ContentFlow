<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
    ]);

    $filename = $request->input('filename');
    $contentType = $request->input('content_type');
    
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
      \Log::warning('Executable file upload attempt via multipart upload', [
        'filename' => $filename,
        'ip' => $request->ip(),
        'user_id' => auth()->id(),
      ]);
      
      return response()->json([
        'error' => 'Executable files are not allowed'
      ], 400);
    }

    // Generate unique key
    $uuid = Str::uuid();
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    $key = "publications/{$uuid}.{$extension}";

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
        'url' => $presignedUrl,
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

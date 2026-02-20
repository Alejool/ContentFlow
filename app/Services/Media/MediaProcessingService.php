<?php

namespace App\Services\Media;

use App\Jobs\ProcessBackgroundUpload;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

use App\Models\MediaFiles\MediaDerivative;
use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationMedia;

class MediaProcessingService
{
  public function processUploads(Publication $publication, array $files, array $options = []): void
  {
    $currentMaxOrder = $publication->media()->max('order') ?? -1;
    $youtubeTypes = $options['youtube_types'] ?? [];
    $durations = $options['durations'] ?? [];
    $thumbnails = $options['thumbnails'] ?? [];

    foreach ($files as $index => $file) {
      $mediaFile = $this->uploadAndCreateMediaFile($publication, $file, [
        'youtube_type' => $youtubeTypes[$index] ?? null,
        'duration' => $durations[$index] ?? null,
      ]);

      PublicationMedia::create([
        'publication_id' => $publication->id,
        'media_file_id' => $mediaFile->id,
        'order' => $currentMaxOrder + 1 + $index,
      ]);

      $thumbFile = $thumbnails[$index] ?? $thumbnails["new_{$index}"] ?? null;
      if ($thumbFile) {
        $this->createThumbnail($mediaFile, $thumbFile);
      }

      // Update main image logic:
      // Always update if it's the first image in this batch, or if publication has no image.
      // In 'Edit' flow, processUploads is called with new files. We typically want the first new image to become the main one
      // if the user intended to replace it.
      if ($mediaFile->status === 'completed' && $mediaFile->file_type === 'image') {
        // Should we always update? If drag-drop multiple, the last one might win or first?
        // Let's assume index 0 of new files is intended main if it's an image.
        if ($index === 0 || !$publication->image) {
          $publication->update(['image' => \Illuminate\Support\Facades\Storage::url($mediaFile->getRawOriginal('file_path'))]);
        }
      }
    }
  }

  public function uploadAndCreateMediaFile(Publication $publication, $file, array $metadata = []): MediaFile
  {
    if ($file instanceof UploadedFile) {
      // Validate file before processing
      $validator = app(\App\Services\FileValidatorService::class);
      $allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'application/pdf',
      ];
      
      $validationResult = $validator->validate($file, $allowedMimeTypes);
      
      if (!$validationResult->success) {
        throw new \InvalidArgumentException($validationResult->message);
      }
      
      $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
      $path = 'publications/' . $filename;

      $fileType = str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image';
      $fileSize = $file->getSize();
      $mimeType = $validationResult->detectedMimeType ?? $file->getClientMimeType();
      $originalName = $file->getClientOriginalName();
      $isLargeFile = $fileSize > 20 * 1024 * 1024; // 20MB
    } else {
      // Direct Upload Metadata ({ key, filename, mime_type, size })
      $path = $file['key'];
      $fileType = str_starts_with($file['mime_type'], 'video/') ? 'video' : 'image';
      $fileSize = $file['size'];
      $mimeType = $file['mime_type'];
      $originalName = $file['filename'];
      $isLargeFile = false; // Already uploaded to S3, no need to treat as "large upload" locally
      $filename = basename($path);
    }

    $isBackgroundCandidate = $fileType === 'video' || ($file instanceof UploadedFile && $isLargeFile);

    // Create MediaFile record first
    try {
      Log::info('Attempting to create MediaFile record', [
        'original_name' => $originalName,
        'path' => $path,
        'type' => $fileType,
        'metadata' => $metadata
      ]);

      $mediaFile = MediaFile::create([
        'user_id' => Auth::id(),
        'workspace_id' => Auth::user()->current_workspace_id,
        'publication_id' => $publication->id,
        'file_name' => $originalName,
        'file_path' => $path, // Targeted S3 path
        'file_type' => $fileType,
        'youtube_type' => $fileType === 'video' ? ($metadata['youtube_type'] ?? null) : null,
        'duration' => $fileType === 'video' ? ($metadata['duration'] ?? null) : null,
        'mime_type' => $mimeType,
        'size' => $fileSize,
        'status' => $isBackgroundCandidate ? 'processing' : 'completed',
      ]);

      Log::info('MediaFile created successfully', ['id' => $mediaFile->id]);
    } catch (\Exception $e) {
      Log::error('Failed to create MediaFile record', ['error' => $e->getMessage()]);
      throw $e;
    }

    if ($isBackgroundCandidate) {
      if ($file instanceof UploadedFile) {
        // Store in local temp storage for background processing
        // Store in local temp storage for background processing without loading fully into memory
        // $tempPath = 'temp/' . $filename;
        // Storage::disk('local')->put($tempPath, file_get_contents($file->getRealPath()));
        // Use putFileAs to stream the file instead of loading into memory
        $storedPath = Storage::disk('local')->putFileAs('temp', $file, $filename);
        $tempPath = $storedPath; // Normalized path from Storage facade

        // Dispatch Job after transaction commits
        DB::afterCommit(function () use ($publication, $mediaFile, $tempPath, $metadata) {
          ProcessBackgroundUpload::dispatch($publication, $mediaFile, $tempPath, $metadata);
        });
      } else {
        // It's already on S3 (Direct Upload)
        // It's already on S3 (Direct Upload)
        DB::afterCommit(function () use ($publication, $mediaFile, $metadata) {
          ProcessBackgroundUpload::dispatch($publication, $mediaFile, null, $metadata);
        });
      }
    } else {
      // Synchronous upload (Only for small files sent to backend)
      if ($file instanceof UploadedFile) {
        $file->storeAs('publications', $filename, 's3');
      }
    }

    return $mediaFile;
  }

  public function createThumbnail(MediaFile $mediaFile, UploadedFile $thumbFile, string $platform = 'all'): MediaDerivative
  {
    // Validate thumbnail file
    $validator = app(\App\Services\FileValidatorService::class);
    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    $validationResult = $validator->validate($thumbFile, $allowedMimeTypes);
    
    if (!$validationResult->success) {
      throw new \InvalidArgumentException($validationResult->message);
    }
    
    $thumbFilename = Str::uuid() . '_thumb.' . $thumbFile->getClientOriginalExtension();
    $thumbPath = $thumbFile->storeAs('derivatives/thumbnails', $thumbFilename, 's3');

    // Clean old thumbnails if any
    $this->deleteDerivatives($mediaFile, 'thumbnail');

    return MediaDerivative::create([
      'media_file_id' => $mediaFile->id,
      'derivative_type' => 'thumbnail',
      'file_path' => $thumbPath,
      'file_name' => $thumbFilename,
      'mime_type' => $thumbFile->getClientMimeType(),
      'size' => $thumbFile->getSize(),
      'platform' => $platform,
      'resolution' => 'custom',
    ]);
  }

  public function handleExistingThumbnails(Publication $publication, array $thumbnails): void
  {
    foreach ($thumbnails as $mediaId => $thumbFile) {
      if (!is_numeric($mediaId))
        continue;

      $mediaFile = $publication->mediaFiles()->find($mediaId);
      if ($mediaFile) {
        $this->createThumbnail($mediaFile, $thumbFile);
      }
    }
  }

  public function handleYoutubeThumbnail(Publication $publication, UploadedFile $thumbFile, int $videoId): void
  {
    $mediaFile = $publication->mediaFiles()->find($videoId);
    if ($mediaFile && $mediaFile->file_type === 'video') {
      $this->createThumbnail($mediaFile, $thumbFile, 'youtube');
    }
  }

  public function deleteThumbnails(array $mediaIds): void
  {
    MediaFile::whereIn('id', $mediaIds)->get()->each(function ($mediaFile) {
      $this->deleteDerivatives($mediaFile, 'thumbnail');
    });
  }

  public function deleteDerivatives(MediaFile $mediaFile, string $type): void
  {
    $derivatives = $mediaFile->derivatives()->where('derivative_type', $type)->get();
    foreach ($derivatives as $derivative) {
      try {
        $path = $derivative->getRawOriginal('file_path');

        // Efficiency optimization: Don't check exists() as it's an extra API call.
        // PHP's S3 driver handles non-existent keys gracefully if we just call delete.
        Storage::disk('s3')->delete($path);
      } catch (\Exception $e) {
        Log::warning('Failed to delete old derivative', ['error' => $e->getMessage(), 'path' => $derivative->file_path]);
      }
      $derivative->delete();
    }
  }

  public function deleteMediaFile(MediaFile $mediaFile): void
  {
    // 1. Delete all derivatives (physical files + database records)
    // Deleting database records is handled by DB cascade if foreign keys are set up,
    // but we need to delete physical files manually from storage.
    $mediaFile->derivatives->each(function ($derivative) {
      try {
        $path = $derivative->getRawOriginal('file_path');
        if (Storage::disk('s3')->exists($path)) {
          Storage::disk('s3')->delete($path);
        }
      } catch (\Exception $e) {
        Log::warning('Failed to delete media derivative file during media file deletion', [
          'error' => $e->getMessage(),
          'path' => $derivative->getRawOriginal('file_path')
        ]);
      }
    });

    // 2. Delete main file from storage
    try {
      $path = $mediaFile->getRawOriginal('file_path');
      if (Storage::disk('s3')->exists($path)) {
        Storage::disk('s3')->delete($path);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to delete main media file', [
        'error' => $e->getMessage(),
        'path' => $mediaFile->file_path
      ]);
    }

    // 3. Delete database record
    $mediaFile->delete();
  }
}

<?php

namespace App\Services\Media;

use App\Models\MediaDerivative;
use App\Models\MediaFile;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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

      // Set main image if not set
      if (!$publication->image) {
        $publication->update(['image' => asset('storage/' . $mediaFile->file_path)]);
      }
    }
  }

  public function uploadAndCreateMediaFile(Publication $publication, UploadedFile $file, array $metadata = []): MediaFile
  {
    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
    $path = $file->storeAs('publications', $filename, 's3');
    $fileType = str_starts_with($file->getClientMimeType(), 'video/') ? 'video' : 'image';

    return MediaFile::create([
      'user_id' => Auth::id(),
      'workspace_id' => Auth::user()->current_workspace_id,
      'publication_id' => $publication->id,
      'file_name' => $file->getClientOriginalName(),
      'file_path' => $path,
      'file_type' => $fileType,
      'youtube_type' => $fileType === 'video' ? ($metadata['youtube_type'] ?? null) : null,
      'duration' => $fileType === 'video' ? ($metadata['duration'] ?? null) : null,
      'mime_type' => $file->getClientMimeType(),
      'size' => $file->getSize(),
    ]);
  }

  public function createThumbnail(MediaFile $mediaFile, UploadedFile $thumbFile, string $platform = 'all'): MediaDerivative
  {
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
        // If it's a full URL, we need to extract the path
        $path = $derivative->file_path;
        if (filter_var($path, FILTER_VALIDATE_URL)) {
          $s3Url = Storage::disk('s3')->url('');
          $path = str_replace($s3Url, '', $path);
        }

        if (Storage::disk('s3')->exists($path)) {
          Storage::disk('s3')->delete($path);
        }
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
      if (Storage::disk('s3')->exists($mediaFile->file_path)) {
        Storage::disk('s3')->delete($mediaFile->file_path);
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

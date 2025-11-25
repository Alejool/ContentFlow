<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class FileUploadService
{
    /**
     * Upload a file to S3 and return the URL.
     *
     * @param UploadedFile $file
     * @param string $folder
     * @return string|null
     */
    public function uploadToS3(UploadedFile $file, string $folder = 'uploads'): string
    {
        if (!config('filesystems.disks.s3.bucket')) {
            throw new \Exception('AWS_BUCKET is not configured in .env');
        }

        try {
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            
            // Upload file to S3 with 'public' visibility if needed, or default
            $path = $file->storeAs($folder, $filename, 's3');

            if ($path) {
                // Return the full URL
                return Storage::disk('s3')->url($path);
            }

            throw new \Exception('File could not be stored on S3.');
        } catch (\Exception $e) {
            Log::error('S3 Upload Error: ' . $e->getMessage());
            // Re-throw the exception so the controller can display the error
            throw new \Exception('S3 Error: ' . $e->getMessage());
        }
    }
}

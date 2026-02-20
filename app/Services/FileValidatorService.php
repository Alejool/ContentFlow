<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class FileValidatorService
{
    private const MAGIC_BYTES = [
        'image/jpeg' => ["\xFF\xD8\xFF"],
        'image/png' => ["\x89\x50\x4E\x47"],
        'image/gif' => ["GIF87a", "GIF89a"],
        'application/pdf' => ["%PDF"],
        'video/mp4' => ["\x00\x00\x00\x18\x66\x74\x79\x70", "\x00\x00\x00\x20\x66\x74\x79\x70"],
    ];
    
    private const MAX_SIZES = [
        'image/jpeg' => 10 * 1024 * 1024,  // 10MB
        'image/png' => 10 * 1024 * 1024,
        'video/mp4' => 100 * 1024 * 1024,  // 100MB
        'application/pdf' => 20 * 1024 * 1024,
    ];
    
    private const EXECUTABLE_EXTENSIONS = [
        'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'sh', 'php', 'py'
    ];
    
    public function validate(UploadedFile $file, array $allowedMimeTypes): ValidationResult
    {
        // 1. Verificar extensión ejecutable
        if ($this->isExecutable($file)) {
            Log::warning('Executable file upload attempt', [
                'filename' => $file->getClientOriginalName(),
                'ip' => request()->ip(),
                'user_id' => auth()->id(),
            ]);
            
            return ValidationResult::failed('Executable files are not allowed');
        }
        
        // 2. Leer magic bytes
        $magicBytes = $this->readMagicBytes($file);
        $detectedMimeType = $this->detectMimeType($magicBytes);
        
        // 3. Verificar que el tipo detectado esté en la lista permitida
        if (!in_array($detectedMimeType, $allowedMimeTypes)) {
            Log::warning('File type mismatch', [
                'filename' => $file->getClientOriginalName(),
                'detected' => $detectedMimeType,
                'claimed' => $file->getMimeType(),
                'user_id' => auth()->id(),
            ]);
            
            return ValidationResult::failed('File type not allowed');
        }
        
        // 4. Verificar tamaño
        $maxSize = self::MAX_SIZES[$detectedMimeType] ?? 5 * 1024 * 1024;
        if ($file->getSize() > $maxSize) {
            return ValidationResult::failed("File size exceeds maximum of " . ($maxSize / 1024 / 1024) . "MB");
        }
        
        return ValidationResult::success($detectedMimeType);
    }
    
    private function readMagicBytes(UploadedFile $file): string
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $bytes = fread($handle, 32);  // Leer primeros 32 bytes
        fclose($handle);
        return $bytes;
    }
    
    private function detectMimeType(string $magicBytes): ?string
    {
        foreach (self::MAGIC_BYTES as $mimeType => $signatures) {
            foreach ($signatures as $signature) {
                if (str_starts_with($magicBytes, $signature)) {
                    return $mimeType;
                }
            }
        }
        return null;
    }
    
    private function isExecutable(UploadedFile $file): bool
    {
        $extension = strtolower($file->getClientOriginalExtension());
        return in_array($extension, self::EXECUTABLE_EXTENSIONS);
    }
}

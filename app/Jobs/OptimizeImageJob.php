<?php

namespace App\Jobs;

use App\Models\MediaFiles\MediaFile;
use App\Services\Media\ImageOptimizationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class OptimizeImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 2;

    public function __construct(
        public int $mediaFileId
    ) {
        // Use high priority queue for image optimization
        $this->onQueue('media-processing');
    }

    public function tags(): array
    {
        return [
            'image-optimization',
            "media:{$this->mediaFileId}",
        ];
    }

    public function handle(ImageOptimizationService $service): void
    {
        $mediaFile = MediaFile::find($this->mediaFileId);

        if (!$mediaFile) {
            Log::warning('Media file not found for optimization', ['id' => $this->mediaFileId]);
            return;
        }

        if ($mediaFile->file_type !== 'image') {
            Log::info('Skipping non-image file', ['id' => $this->mediaFileId]);
            return;
        }

        try {
            Log::info('Starting image optimization', [
                'media_id' => $mediaFile->id,
                'file_name' => $mediaFile->file_name,
                'size_mb' => round($mediaFile->size / 1024 / 1024, 2)
            ]);

            $derivatives = $service->generateOptimizedDerivatives($mediaFile);

            Log::info('Image optimization completed', [
                'media_id' => $mediaFile->id,
                'derivatives_count' => count($derivatives),
                'total_size_mb' => round(array_sum(array_column($derivatives->toArray(), 'size')) / 1024 / 1024, 2)
            ]);
        } catch (\Exception $e) {
            Log::error('Image optimization failed', [
                'media_id' => $mediaFile->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('OptimizeImageJob failed permanently', [
            'media_id' => $this->mediaFileId,
            'error' => $exception->getMessage()
        ]);
    }
}

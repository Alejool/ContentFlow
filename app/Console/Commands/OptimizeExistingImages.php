<?php

namespace App\Console\Commands;

use App\Jobs\OptimizeImageJob;
use App\Models\MediaFiles\MediaFile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class OptimizeExistingImages extends Command
{
    protected $signature = 'media:optimize-images
                            {--workspace= : Optimize images for specific workspace}
                            {--limit=100 : Number of images to process per batch}
                            {--force : Force re-optimization of already optimized images}';

    protected $description = 'Optimize existing images by generating WebP/AVIF derivatives';

    public function handle(): int
    {
        $this->info('🚀 Starting image optimization process...');

        $query = MediaFile::where('file_type', 'image')
            ->where('status', 'completed');

        if ($workspaceId = $this->option('workspace')) {
            $query->where('workspace_id', $workspaceId);
        }

        if (!$this->option('force')) {
            // Only process images without optimized derivatives
            $query->whereDoesntHave('derivatives', function ($q) {
                $q->where('derivative_type', 'optimized');
            });
        }

        $total = $query->count();
        $limit = (int) $this->option('limit');

        if ($total === 0) {
            $this->info('✅ No images to optimize');
            return self::SUCCESS;
        }

        $this->info("📊 Found {$total} images to optimize");
        
        if (!$this->confirm('Do you want to proceed?', true)) {
            $this->info('Cancelled');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $processed = 0;
        $failed = 0;

        $query->chunk($limit, function ($mediaFiles) use ($bar, &$processed, &$failed) {
            foreach ($mediaFiles as $mediaFile) {
                try {
                    OptimizeImageJob::dispatch($mediaFile->id);
                    $processed++;
                } catch (\Exception $e) {
                    $this->error("\nFailed to dispatch job for media {$mediaFile->id}: {$e->getMessage()}");
                    $failed++;
                }
                
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Optimization jobs dispatched:");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Images', $total],
                ['Jobs Dispatched', $processed],
                ['Failed', $failed],
            ]
        );

        $this->info(' Jobs are being processed in the background. Monitor with:');
        $this->line('   docker-compose logs -f queue');
        $this->line('   or visit /horizon dashboard');

        return self::SUCCESS;
    }
}

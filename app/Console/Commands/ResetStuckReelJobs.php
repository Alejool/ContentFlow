<?php

namespace App\Console\Commands;

use App\Models\MediaFiles\MediaFile;
use Illuminate\Console\Command;

class ResetStuckReelJobs extends Command
{
    protected $signature = 'reels:reset-stuck';
    protected $description = 'Reset media files stuck in processing status';

    public function handle()
    {
        $stuckFiles = MediaFile::where('status', 'processing')
            ->where('updated_at', '<', now()->subHours(2))
            ->get();

        if ($stuckFiles->isEmpty()) {
            $this->info('No stuck files found.');
            return 0;
        }

        $this->info("Found {$stuckFiles->count()} stuck file(s).");

        foreach ($stuckFiles as $file) {
            $file->update([
                'status' => 'failed',
                'processing_error' => 'Job was stuck in processing state and was reset'
            ]);
            $this->line("Reset file ID: {$file->id}");
        }

        $this->info('✅ All stuck files have been reset.');
        return 0;
    }
}

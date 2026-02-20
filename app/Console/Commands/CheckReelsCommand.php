<?php

namespace App\Console\Commands;

use App\Models\MediaFiles\MediaFile;
use Illuminate\Console\Command;

class CheckReelsCommand extends Command
{
    protected $signature = 'reels:check';
    protected $description = 'Check reels in database';

    public function handle()
    {
        $this->info('Total MediaFiles: ' . MediaFile::count());
        $this->info('Reels (file_type=reel): ' . MediaFile::where('file_type', 'reel')->count());
        $this->info('Videos: ' . MediaFile::where('file_type', 'video')->count());
        
        $this->newLine();
        $this->info('AI Generated files:');
        
        MediaFile::where('metadata->ai_generated', true)
            ->orWhere('metadata->generation_type', 'ai_reel')
            ->get(['id', 'file_type', 'file_name', 'metadata', 'status'])
            ->each(function($m) {
                $this->line(sprintf(
                    "ID: %d | Type: %s | Status: %s | Name: %s | AI: %s | GenType: %s",
                    $m->id,
                    $m->file_type,
                    $m->status,
                    $m->file_name,
                    $m->metadata['ai_generated'] ?? 'no',
                    $m->metadata['generation_type'] ?? 'none'
                ));
            });
        
        return 0;
    }
}

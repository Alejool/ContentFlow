<?php

namespace App\Jobs;

use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationMedia;
use App\Services\Video\VideoClipGeneratorService;
use App\Services\Video\VideoAnalysisService;
use App\Notifications\ReelsGenerationCompleted;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateReelsFromVideo implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public $timeout = 1800; // 30 minutes
  public $tries = 2;

  public function __construct(
    private int $mediaFileId,
    private ?int $publicationId = null,
    private array $options = []
  ) {}

  public function handle(
    VideoClipGeneratorService $clipGenerator,
    VideoAnalysisService $analysisService
  ): void {
    $mediaFile = MediaFile::find($this->mediaFileId);
    
    if (!$mediaFile) {
      Log::error('MediaFile not found for reel generation', ['id' => $this->mediaFileId]);
      return;
    }

    try {
      $mediaFile->update(['status' => 'processing']);

      // Step 1: Analyze video content
      Log::info('Analyzing video content', ['media_file_id' => $this->mediaFileId]);
      $videoPath = $this->downloadVideo($mediaFile->file_path);
      $analysis = $analysisService->analyzeVideoContent($videoPath);

      // Step 2: Generate optimized reels for each platform
      $platforms = $this->options['platforms'] ?? ['instagram', 'tiktok', 'youtube_shorts'];
      $generatedReels = [];

      foreach ($platforms as $platform) {
        Log::info("Generating reel for {$platform}", ['media_file_id' => $this->mediaFileId]);
        
        $reelOptions = [
          'add_subtitles' => $this->options['add_subtitles'] ?? true,
          'language' => $this->options['language'] ?? 'es',
          'watermark_path' => $this->options['watermark_path'] ?? null,
        ];

        $reel = $clipGenerator->createOptimizedReel($mediaFile, $platform, $reelOptions);
        
        // Create new MediaFile for the generated reel
        $reelMediaFile = MediaFile::create([
          'user_id' => $mediaFile->user_id,
          'workspace_id' => $mediaFile->workspace_id,
          'publication_id' => $this->publicationId,
          'file_path' => $reel['path'],
          'file_name' => basename($reel['path']),
          'file_type' => 'video',
          'mime_type' => 'video/mp4',
          'size' => \Illuminate\Support\Facades\Storage::size($reel['path']),
          'status' => 'completed',
          'metadata' => [
            'platform' => $platform,
            'optimized_for' => $platform,
            'original_media_id' => $this->mediaFileId,
            'duration' => $reel['duration'],
            'specs' => $reel['specs'],
            'ai_analysis' => $analysis,
          ],
        ]);

        $generatedReels[$platform] = $reelMediaFile;

        // If publication exists, attach the reel
        if ($this->publicationId) {
          $publication = Publication::find($this->publicationId);
          if ($publication) {
            $maxOrder = $publication->media()->max('order') ?? -1;
            
            PublicationMedia::create([
              'publication_id' => $this->publicationId,
              'media_file_id' => $reelMediaFile->id,
              'order' => $maxOrder + 1,
            ]);

            // Update publication with AI-generated content suggestions
            if (empty($publication->description)) {
              $suggestions = $analysisService->generateContentSuggestions($analysis, $platform);
              $publication->update([
                'description' => $suggestions['description'] ?? $analysis['ai_description'],
                'hashtags' => implode(' ', $suggestions['hashtags'] ?? $analysis['suggested_hashtags']),
              ]);
            }
          }
        }
      }

      // Step 3: Generate highlight clips if requested
      if ($this->options['generate_clips'] ?? false) {
        Log::info('Generating highlight clips', ['media_file_id' => $this->mediaFileId]);
        
        $clips = $clipGenerator->generateClipsFromVideo($mediaFile, [
          'clip_duration' => $this->options['clip_duration'] ?? 15,
          'max_clips' => $this->options['max_clips'] ?? 3,
          'auto_detect_highlights' => true,
        ]);

        foreach ($clips as $index => $clip) {
          $clipMediaFile = MediaFile::create([
            'user_id' => $mediaFile->user_id,
            'workspace_id' => $mediaFile->workspace_id,
            'publication_id' => $this->publicationId,
            'file_path' => $clip['path'],
            'file_name' => "clip_{$index}_" . basename($clip['path']),
            'file_type' => 'video',
            'mime_type' => 'video/mp4',
            'size' => \Illuminate\Support\Facades\Storage::size($clip['path']),
            'status' => 'completed',
            'metadata' => [
              'type' => 'highlight_clip',
              'original_media_id' => $this->mediaFileId,
              'start_time' => $clip['start_time'],
              'duration' => $clip['duration'],
              'highlight_score' => $clip['highlight_score'] ?? null,
            ],
          ]);

          if ($this->publicationId) {
            $publication = Publication::find($this->publicationId);
            if ($publication) {
              $maxOrder = $publication->media()->max('order') ?? -1;
              
              PublicationMedia::create([
                'publication_id' => $this->publicationId,
                'media_file_id' => $clipMediaFile->id,
                'order' => $maxOrder + 1,
              ]);
            }
          }
        }
      }

      $mediaFile->update([
        'status' => 'completed',
        'metadata' => array_merge($mediaFile->metadata ?? [], [
          'reels_generated' => true,
          'analysis' => $analysis,
          'generated_at' => now()->toIso8601String(),
        ]),
      ]);

      // Notify user
      if ($mediaFile->user) {
        $mediaFile->user->notify(new ReelsGenerationCompleted($mediaFile, $generatedReels));
      }

      Log::info('Reels generation completed', [
        'media_file_id' => $this->mediaFileId,
        'platforms' => array_keys($generatedReels),
      ]);

    } catch (\Exception $e) {
      Log::error('Reels generation failed', [
        'media_file_id' => $this->mediaFileId,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ]);

      $mediaFile->update(['status' => 'failed']);
      
      throw $e;
    }
  }

  private function downloadVideo(string $s3Path): string
  {
    $tempPath = sys_get_temp_dir() . '/' . \Illuminate\Support\Str::uuid() . '.mp4';
    $content = \Illuminate\Support\Facades\Storage::get($s3Path);
    file_put_contents($tempPath, $content);
    return $tempPath;
  }
}

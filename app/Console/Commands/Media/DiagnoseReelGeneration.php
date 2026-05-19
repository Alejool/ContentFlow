<?php

namespace App\Console\Commands\Media;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\MediaFiles\MediaFile;

class DiagnoseReelGeneration extends Command
{
  protected $signature = 'reels:diagnose {media_file_id?}';
  protected $description = 'Diagnose reel generation system and check for common issues';

  public function handle()
  {
    $this->info('🔍 Diagnosing Reel Generation System...');
    $this->newLine();

    $allPassed = true;

    // Check 1: FFmpeg Installation
    $this->info('1️⃣  Checking FFmpeg installation...');
    $ffmpegPath = config('media.ffmpeg_path', 'ffmpeg');
    $ffprobePath = config('media.ffprobe_path', 'ffprobe');

    exec("$ffmpegPath -version 2>&1", $ffmpegOutput, $ffmpegCode);
    if ($ffmpegCode === 0) {
      $this->info("   ✅ FFmpeg found at: $ffmpegPath");
      $version = explode("\n", implode("\n", $ffmpegOutput))[0];
      $this->line("   Version: $version");
    } else {
      $this->error("   ❌ FFmpeg not found or not executable at: $ffmpegPath");
      $this->warn("   Install FFmpeg: apt-get install ffmpeg (Ubuntu) or brew install ffmpeg (macOS)");
      $allPassed = false;
    }

    exec("$ffprobePath -version 2>&1", $ffprobeOutput, $ffprobeCode);
    if ($ffprobeCode === 0) {
      $this->info("   ✅ FFprobe found at: $ffprobePath");
    } else {
      $this->error("   ❌ FFprobe not found at: $ffprobePath");
      $allPassed = false;
    }
    $this->newLine();

    // Check 2: AI Configuration
    $this->info('2️⃣  Checking AI service configuration...');
    $hasAI = false;
    
    if (!empty(config('services.openai.api_key'))) {
      $this->info('   ✅ OpenAI API key configured');
      $hasAI = true;
    }
    if (!empty(config('services.anthropic.api_key'))) {
      $this->info('   ✅ Anthropic API key configured');
      $hasAI = true;
    }
    if (!empty(config('services.gemini.api_key'))) {
      $this->info('   ✅ Gemini API key configured');
      $hasAI = true;
    }
    
    if (!$hasAI) {
      $this->error('   ❌ No AI service configured');
      $this->warn('   Add at least one API key: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY');
      $allPassed = false;
    }
    $this->newLine();

    // Check 3: Storage Configuration
    $this->info('3️⃣  Checking storage configuration...');
    try {
      $disk = Storage::getDefaultDriver();
      $this->info("   ✅ Default storage driver: $disk");
      
      // Test write
      $testFile = 'test_' . time() . '.txt';
      Storage::put($testFile, 'test content');
      
      if (Storage::exists($testFile)) {
        $this->info('   ✅ Storage write test passed');
        $size = Storage::size($testFile);
        $this->info("   ✅ Storage read test passed (size: $size bytes)");
        Storage::delete($testFile);
        $this->info('   ✅ Storage delete test passed');
      } else {
        $this->error('   ❌ Storage write test failed');
        $allPassed = false;
      }
    } catch (\Exception $e) {
      $this->error('   ❌ Storage test failed: ' . $e->getMessage());
      $allPassed = false;
    }
    $this->newLine();

    // Check 4: Queue Configuration
    $this->info('4️⃣  Checking queue configuration...');
    $queueDriver = config('queue.default');
    $this->info("   Queue driver: $queueDriver");
    
    if ($queueDriver === 'sync') {
      $this->warn('   ⚠️  Using sync queue - reel generation will block requests');
      $this->warn('   Recommended: Use redis or database queue for better performance');
    } else {
      $this->info("   ✅ Using $queueDriver queue");
    }
    $this->newLine();

    // Check 5: Specific Media File (if provided)
    $mediaFileId = $this->argument('media_file_id');
    if ($mediaFileId) {
      $this->info("5️⃣  Checking media file ID: $mediaFileId");
      
      $mediaFile = MediaFile::find($mediaFileId);
      if (!$mediaFile) {
        $this->error("   ❌ Media file not found");
        $allPassed = false;
      } else {
        $this->info("   ✅ Media file found");
        $this->line("   File name: {$mediaFile->file_name}");
        $this->line("   File type: {$mediaFile->file_type}");
        $this->line("   Status: {$mediaFile->status}");
        $this->line("   S3 path: {$mediaFile->file_path}");
        
        // Check if file exists in S3
        if (Storage::exists($mediaFile->file_path)) {
          $this->info('   ✅ File exists in storage');
          
          $size = Storage::size($mediaFile->file_path);
          $sizeMB = round($size / 1024 / 1024, 2);
          
          if ($size > 0) {
            $this->info("   ✅ File has content: {$sizeMB} MB");
          } else {
            $this->error('   ❌ File is empty (0 bytes)');
            $this->warn('   This is the root cause of empty reel generation!');
            $allPassed = false;
          }
          
          // Try to download a small chunk
          try {
            $content = Storage::get($mediaFile->file_path);
            if (empty($content)) {
              $this->error('   ❌ File content is empty or inaccessible');
              $allPassed = false;
            } else {
              $this->info('   ✅ File is readable from storage');
            }
          } catch (\Exception $e) {
            $this->error('   ❌ Cannot read file: ' . $e->getMessage());
            $allPassed = false;
          }
        } else {
          $this->error('   ❌ File does not exist in storage');
          $this->warn('   The file may have been deleted or the path is incorrect');
          $allPassed = false;
        }
      }
      $this->newLine();
    }

    // Check 6: Temp Directory
    $this->info('6️⃣  Checking temporary directory...');
    $tempDir = sys_get_temp_dir();
    $this->info("   Temp directory: $tempDir");
    
    if (is_writable($tempDir)) {
      $this->info('   ✅ Temp directory is writable');
    } else {
      $this->error('   ❌ Temp directory is not writable');
      $allPassed = false;
    }
    $this->newLine();

    // Summary
    $this->newLine();
    if ($allPassed) {
      $this->info('✅ All checks passed! System is ready for reel generation.');
    } else {
      $this->error('❌ Some checks failed. Please fix the issues above before generating reels.');
      return 1;
    }

    return 0;
  }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateReelsFromVideo;
use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\Publication;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ReelGeneratorController extends Controller
{
  use ApiResponse;

  /**
   * Generate reels from uploaded video
   */
  public function generate(Request $request)
  {
    $validated = $request->validate([
      'media_file_id' => 'required|exists:media_files,id',
      'publication_id' => 'nullable|exists:publications,id',
      'platforms' => 'nullable|array',
      'platforms.*' => 'in:instagram,tiktok,youtube_shorts',
      'add_subtitles' => 'nullable|boolean',
      'language' => 'nullable|string|in:es,en,fr,de,pt',
      'generate_clips' => 'nullable|boolean',
      'clip_duration' => 'nullable|integer|min:5|max:60',
      'max_clips' => 'nullable|integer|min:1|max:10',
    ]);

    // Check if AI is configured
    if (!$this->hasAIConfigured()) {
      return $this->errorResponse('AI service not configured. Please add an API key in settings.', 400);
    }

    $mediaFile = MediaFile::find($validated['media_file_id']);

    if ($mediaFile->file_type !== 'video') {
      return $this->errorResponse('Only video files can be processed for reels', 400);
    }

    $options = [
      'platforms' => $validated['platforms'] ?? ['instagram', 'tiktok', 'youtube_shorts'],
      'add_subtitles' => $validated['add_subtitles'] ?? true,
      'language' => $validated['language'] ?? 'es',
      'generate_clips' => $validated['generate_clips'] ?? false,
      'clip_duration' => $validated['clip_duration'] ?? 15,
      'max_clips' => $validated['max_clips'] ?? 3,
    ];

    GenerateReelsFromVideo::dispatch(
      $mediaFile->id,
      $validated['publication_id'] ?? null,
      $options
    );

    return $this->successResponse([
      'message' => 'Reel generation started',
      'media_file_id' => $mediaFile->id,
      'status' => 'processing',
    ]);
  }

  /**
   * Check if AI is configured
   */
  private function hasAIConfigured(): bool
  {
    return !empty(config('services.openai.api_key'))
      || !empty(config('services.anthropic.api_key'))
      || !empty(config('services.gemini.api_key'))
      || !empty(config('services.deepseek.api_key'));
  }
}

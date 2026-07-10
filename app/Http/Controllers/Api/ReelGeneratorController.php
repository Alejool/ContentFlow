<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\Media\GenerateReelsFromVideo;
use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\Publication;
use App\Traits\System\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

use App\Http\Requests\Media\GenerateReelRequest;
class ReelGeneratorController extends Controller
{
  use ApiResponse;

  public function __construct()
  {
    // Apply rate limiting middleware to generation endpoint
    $this->middleware('throttle.reel:5,10')->only('generate');
  }

  /**
   * Generate reels from uploaded video
   */
  public function generate(GenerateReelRequest $request)
  {
    Log::info('🎬 Reel generation request received', [
      'user_id' => Auth::id(),
      'request_data' => $request->all()
    ]);

    try {
      $validated = $request->validated();

      Log::info('✅ Validation passed', ['validated' => $validated]);

      // Check if AI is configured
      if (!$this->hasAIConfigured()) {
        Log::warning('⚠️ AI service not configured');
        return $this->errorResponse('AI service not configured. Please add an API key in settings.', 400);
      }

      $mediaFile = MediaFile::find($validated['media_file_id']);

      if (!$mediaFile) {
        Log::error('❌ Media file not found', ['media_file_id' => $validated['media_file_id']]);
        return $this->errorResponse('Media file not found', 404);
      }

      if ($mediaFile->file_type !== 'video') {
        Log::warning('⚠️ Invalid file type', [
          'media_file_id' => $mediaFile->id,
          'file_type' => $mediaFile->file_type
        ]);
        return $this->errorResponse('Only video files can be processed for reels', 400);
      }

      // Check if there's already a reel generation in progress for this media file
      if ($mediaFile->status === 'processing') {
        Log::warning('⚠️ Reel generation already in progress', [
          'media_file_id' => $mediaFile->id,
          'current_status' => $mediaFile->status
        ]);
        return $this->errorResponse('Ya hay un reel generándose para este video. Por favor espera a que termine.', 409);
      }

      // Check if there are any reels being generated for this publication
      if ($validated['publication_id']) {
        $processingReels = MediaFile::where('publication_id', $validated['publication_id'])
          ->where('file_type', 'reel')
          ->where('status', 'processing')
          ->exists();

        if ($processingReels) {
          Log::warning('⚠️ Reels already being generated for this publication', [
            'publication_id' => $validated['publication_id']
          ]);
          return $this->errorResponse('Ya hay reels generándose para esta publicación. Por favor espera a que terminen.', 409);
        }
      }

      // Enhanced deduplication: Check for existing jobs in queue
      $platforms = $validated['platforms'] ?? ['instagram'];
      sort($platforms);
      
      $uniqueData = [
        'media_file_id' => $mediaFile->id,
        'publication_id' => $validated['publication_id'] ?? 'none',
        'platforms' => implode(',', $platforms),
        'add_subtitles' => $validated['add_subtitles'] ?? true,
        'language' => $validated['language'] ?? 'es',
        'generate_clips' => $validated['generate_clips'] ?? false,
      ];
      
      $jobSignature = 'reel-gen-' . md5(json_encode($uniqueData));
      
      // Use cache lock to prevent concurrent generations with extended TTL
      $lockKey = "reel_lock_{$jobSignature}";
      $lock = \Cache::lock($lockKey, 3600); // 1 hour lock

      if (!$lock->get()) {
        Log::warning('⚠️ Duplicate job detected - already in queue or processing', [
          'media_file_id' => $mediaFile->id,
          'job_signature' => $jobSignature,
          'lock_key' => $lockKey
        ]);
        return $this->errorResponse('Ya hay una generación idéntica en proceso. Por favor espera o modifica los parámetros.', 409);
      }
      
      // Store job signature in cache for tracking
      \Cache::put("job_tracking_{$jobSignature}", [
        'media_file_id' => $mediaFile->id,
        'publication_id' => $validated['publication_id'] ?? null,
        'user_id' => Auth::id(),
        'started_at' => now()->toIso8601String(),
        'status' => 'queued',
      ], 3600);

      $options = [
        'platforms' => $validated['platforms'] ?? ['instagram'], // Only 1 platform by default
        'add_subtitles' => $validated['add_subtitles'] ?? true,
        'language' => $validated['language'] ?? 'es',
        'generate_clips' => $validated['generate_clips'] ?? false,
        'clip_duration' => $validated['clip_duration'] ?? 15,
        'max_clips' => $validated['max_clips'] ?? 3,
      ];

      Log::info('📤 Dispatching job to queue', [
        'media_file_id' => $mediaFile->id,
        'publication_id' => $validated['publication_id'] ?? null,
        'options' => $options
      ]);

      GenerateReelsFromVideo::dispatch(
        $mediaFile->id,
        $validated['publication_id'] ?? null,
        $options
      );

      Log::info('✅ Job dispatched successfully', ['media_file_id' => $mediaFile->id]);

      return $this->successResponse([
        'message' => 'Reel generation started',
        'media_file_id' => $mediaFile->id,
        'status' => 'processing',
      ]);

    } catch (\Illuminate\Validation\ValidationException $e) {
      Log::error('❌ Validation failed', [
        'errors' => $e->errors(),
        'request' => $request->all()
      ]);
      throw $e;
    } catch (\Exception $e) {
      Log::error('❌ Reel generation request failed', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
      return $this->errorResponse('Failed to start reel generation: ' . $e->getMessage(), 500);
    }
  }

  /**
   * List all AI-generated reels for the current user/workspace
   */
  public function index(Request $request)
  {
    try {
      $user = Auth::user();
      $workspaceId = $request->input('workspace_id', $user->current_workspace_id);

      $query = MediaFile::where('file_type', 'reel')
        ->where('workspace_id', $workspaceId)
        ->whereJsonContains('metadata->ai_generated', true) // Only AI-generated reels
        ->with(['publication', 'user'])
        ->orderBy('updated_at', 'desc');

      // Filter by platform if specified
      if ($request->has('platform')) {
        $query->whereJsonContains('metadata->platform', $request->input('platform'));
      }

      // Filter by status if specified
      if ($request->has('status')) {
        $query->where('status', $request->input('status'));
      }

      // Pagination
      $perPage = $request->input('per_page', 15);
      $reels = $query->paginate($perPage);

      return $this->successResponse([
        'reels' => $reels->items(),
        'pagination' => [
          'total' => $reels->total(),
          'per_page' => $reels->perPage(),
          'current_page' => $reels->currentPage(),
          'last_page' => $reels->lastPage(),
        ],
      ]);

    } catch (\Exception $e) {
      Log::error('❌ Failed to list reels', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
      return $this->errorResponse('Failed to list reels: ' . $e->getMessage(), 500);
    }
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

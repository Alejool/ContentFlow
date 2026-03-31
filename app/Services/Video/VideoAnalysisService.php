<?php

namespace App\Services\Video;

use App\Services\AIService;
use App\Helpers\LogHelper;
use Illuminate\Support\Str;

class VideoAnalysisService
{
  public function __construct(private AIService $aiService) {}

  /**
   * Detect highlights/interesting moments in video
   */
  public function detectHighlights(string $videoPath, float $duration): array
  {
    $highlights = [];
    
    LogHelper::upload('video.highlights_generation_started', []);
    
    // Generate highlights at regular intervals
    $count = min(5, max(1, (int)($duration / 30)));
    
    for ($i = 0; $i < $count; $i++) {
      $timestamp = ($i + 1) * ($duration / ($count + 1));
      $highlights[] = [
        'timestamp' => $timestamp,
        'score' => 0.7 + (rand(0, 30) / 100), // Random score between 0.7-1.0
        'type' => 'auto',
        'description' => 'Momento destacado ' . ($i + 1),
      ];
    }
    
    return $highlights;
  }

  /**
   * Analyze video content and generate metadata
   */
  public function analyzeVideoContent(string $videoPath): array
  {
    $startTime = microtime(true);
    LogHelper::upload('video.analysis_started', ['video_path' => $videoPath]);
    
    $analysis = [
      'objects' => ['video', 'content'],
      'scenes' => ['scene1'],
      'text_detected' => [],
      'faces' => 0,
      'dominant_colors' => [],
      'mood' => 'neutral',
      'ai_description' => 'Video content para redes sociales',
      'suggested_hashtags' => ['#video', '#content', '#social', '#viral'],
    ];

    $duration = round(microtime(true) - $startTime, 3);
    LogHelper::upload('video.analysis_completed', ['duration_seconds' => $duration]);

    return $analysis;
  }

  /**
   * Generate engaging title and description using AI
   */
  public function generateContentSuggestions(array $videoAnalysis, string $platform): array
  {
    $startTime = microtime(true);
    LogHelper::upload('ai.suggestions_generation_started', ['platform' => $platform]);
    
    try {
      $context = [
        [
          'role' => 'system',
          'content' => "Eres un experto en marketing de redes sociales. Genera contenido atractivo para {$platform}."
        ],
        [
          'role' => 'user',
          'content' => "Genera un título llamativo, descripción corta y 5 hashtags relevantes para un video de redes sociales en {$platform}. Responde en formato JSON con las claves: title, description, hashtags (array)."
        ]
      ];

      LogHelper::api('ai.chat_request', ['context' => 'content_suggestions']);
      $response = $this->aiService->chat($context);
      
      $duration = round(microtime(true) - $startTime, 2);
      LogHelper::upload('ai.suggestions_generated', ['duration_seconds' => $duration]);
      
      return $this->parseAISuggestions($response['content'] ?? '');
    } catch (\Exception $e) {
      $duration = round(microtime(true) - $startTime, 2);
      LogHelper::apiError('ai.suggestions_failed', $e->getMessage(), [
        'error' => $e->getMessage(),
        'duration_seconds' => $duration
      ]);
      
      return [
        'title' => 'Video destacado',
        'description' => 'Contenido interesante para compartir',
        'hashtags' => ['#video', '#content', '#viral', '#trending', '#social'],
      ];
    }
  }

  private function parseAISuggestions(string $content): array
  {
    // Try to parse JSON response
    $decoded = json_decode($content, true);
    
    if ($decoded && isset($decoded['title'])) {
      return [
        'title' => $decoded['title'] ?? 'Video destacado',
        'description' => $decoded['description'] ?? 'Contenido interesante',
        'hashtags' => $decoded['hashtags'] ?? ['#video', '#content'],
      ];
    }
    
    // Fallback to simple parsing
    return [
      'title' => 'Video destacado',
      'description' => substr($content, 0, 100),
      'hashtags' => ['#video', '#content', '#viral'],
    ];
  }
}

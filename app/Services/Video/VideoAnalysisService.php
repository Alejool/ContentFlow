<?php

namespace App\Services\Video;

use App\Services\AIService;
use Illuminate\Support\Facades\Log;
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
    
    Log::info('Generating simple highlights based on duration');
    
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
    Log::info('Analyzing video content (basic mode)');
    
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

    return $analysis;
  }

  /**
   * Generate engaging title and description using AI
   */
  public function generateContentSuggestions(array $videoAnalysis, string $platform): array
  {
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

      $response = $this->aiService->chat($context);
      
      return $this->parseAISuggestions($response['content'] ?? '');
    } catch (\Exception $e) {
      Log::warning('AI suggestions failed, using defaults', ['error' => $e->getMessage()]);
      
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

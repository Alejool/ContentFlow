<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SentimentAnalysisService
{
  protected AIService $aiService;

  public function __construct(AIService $aiService)
  {
    $this->aiService = $aiService;
  }

  /**
   * Analyze sentiment of a single comment
   *
   * @param string $text Comment text to analyze
   * @return array ['sentiment' => 'positive|inquiry|hate_speech', 'confidence' => float, 'reasoning' => string]
   */
  public function analyzeSentiment(string $text): array
  {
    if (empty(trim($text))) {
      return [
        'sentiment' => 'unknown',
        'confidence' => 0.0,
        'reasoning' => 'Empty comment text'
      ];
    }

    // Check cache first to avoid redundant API calls
    $cacheKey = 'sentiment:' . md5($text);
    $cached = Cache::get($cacheKey);

    if ($cached) {
      Log::info('Sentiment analysis cache hit', ['text_hash' => md5($text)]);
      return $cached;
    }

    try {
      $context = [
        'message' => $text,
        'project_type' => 'sentiment_analysis',
        'user_locale' => 'es'
      ];

      $response = $this->aiService->chat($context);

      // Parse AI response
      $result = $this->parseAIResponse($response);

      // Cache for 30 days
      Cache::put($cacheKey, $result, now()->addDays(30));

      return $result;
    } catch (\Exception $e) {
      Log::error('Sentiment analysis failed', [
        'error' => $e->getMessage(),
        'text' => substr($text, 0, 100)
      ]);

      return [
        'sentiment' => 'unknown',
        'confidence' => 0.0,
        'reasoning' => 'Analysis failed: ' . $e->getMessage()
      ];
    }
  }

  /**
   * Analyze sentiment for multiple comments in batch
   *
   * @param array $comments Array of comment texts
   * @return array Array of sentiment results
   */
  public function analyzeBatch(array $comments): array
  {
    $results = [];

    foreach ($comments as $index => $comment) {
      $text = is_array($comment) ? ($comment['text'] ?? '') : $comment;

      try {
        $results[$index] = $this->analyzeSentiment($text);
      } catch (\Exception $e) {
        Log::warning('Batch sentiment analysis failed for comment', [
          'index' => $index,
          'error' => $e->getMessage()
        ]);

        $results[$index] = [
          'sentiment' => 'unknown',
          'confidence' => 0.0,
          'reasoning' => 'Batch analysis error'
        ];
      }
    }

    return $results;
  }

  /**
   * Get the AI prompt for sentiment classification
   *
   * @return string
   */
  protected function getSentimentPrompt(): string
  {
    return <<<PROMPT
Eres un experto en moderación de contenido. Clasifica el siguiente comentario de redes sociales en una de estas tres categorías:

1. **positive**: Comentarios de apoyo, apreciativos o con retroalimentación constructiva
2. **inquiry**: Preguntas, solicitudes de información o aclaraciones
3. **hate_speech**: Contenido ofensivo, discriminatorio, amenazante o dañino

IMPORTANTE: Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "sentiment": "positive|inquiry|hate_speech",
  "confidence": 0.95,
  "reasoning": "breve explicación en español"
}

Comentario a analizar: "{comment_text}"

Responde únicamente con el JSON, sin texto adicional.
PROMPT;
  }

  /**
   * Parse AI response and extract sentiment data
   *
   * @param array $aiResponse
   * @return array
   */
  protected function parseAIResponse(array $aiResponse): array
  {
    $message = $aiResponse['message'] ?? '';

    // Try to parse as JSON first
    $cleaned = preg_replace('/^```json\s*|\s*```$/', '', trim($message));
    $parsed = json_decode($cleaned, true);

    if (json_last_error() === JSON_ERROR_NONE && isset($parsed['sentiment'])) {
      return [
        'sentiment' => $this->normalizeSentiment($parsed['sentiment']),
        'confidence' => (float) ($parsed['confidence'] ?? 0.5),
        'reasoning' => $parsed['reasoning'] ?? 'No reasoning provided'
      ];
    }

    // Fallback: try to extract sentiment from text
    $sentiment = $this->extractSentimentFromText($message);

    return [
      'sentiment' => $sentiment,
      'confidence' => 0.5,
      'reasoning' => 'Extracted from unstructured response'
    ];
  }

  /**
   * Normalize sentiment value to valid options
   *
   * @param string $sentiment
   * @return string
   */
  protected function normalizeSentiment(string $sentiment): string
  {
    $sentiment = strtolower(trim($sentiment));

    $validSentiments = ['positive', 'inquiry', 'hate_speech'];

    if (in_array($sentiment, $validSentiments)) {
      return $sentiment;
    }

    // Handle variations
    $mapping = [
      'positivo' => 'positive',
      'consulta' => 'inquiry',
      'pregunta' => 'inquiry',
      'question' => 'inquiry',
      'odio' => 'hate_speech',
      'hate' => 'hate_speech',
      'ofensivo' => 'hate_speech',
      'offensive' => 'hate_speech',
      'negativo' => 'hate_speech',
      'negative' => 'hate_speech'
    ];

    return $mapping[$sentiment] ?? 'unknown';
  }

  /**
   * Extract sentiment from unstructured text response
   *
   * @param string $text
   * @return string
   */
  protected function extractSentimentFromText(string $text): string
  {
    $text = strtolower($text);

    if (str_contains($text, 'positive') || str_contains($text, 'positivo')) {
      return 'positive';
    }

    if (str_contains($text, 'inquiry') || str_contains($text, 'consulta') || str_contains($text, 'pregunta')) {
      return 'inquiry';
    }

    if (str_contains($text, 'hate') || str_contains($text, 'odio') || str_contains($text, 'ofensivo')) {
      return 'hate_speech';
    }

    return 'unknown';
  }

  /**
   * Invalidate cache for a specific comment text
   *
   * @param string $text
   * @return void
   */
  public function invalidateCache(string $text): void
  {
    $cacheKey = 'sentiment:' . md5($text);
    Cache::forget($cacheKey);
  }

  /**
   * Get sentiment statistics from analyzed comments
   *
   * @param array $comments Array of comments with sentiment data
   * @return array
   */
  public function getSentimentStatistics(array $comments): array
  {
    $stats = [
      'total' => count($comments),
      'positive' => 0,
      'inquiry' => 0,
      'hate_speech' => 0,
      'unknown' => 0
    ];

    foreach ($comments as $comment) {
      $sentiment = $comment['sentiment'] ?? 'unknown';

      if (isset($stats[$sentiment])) {
        $stats[$sentiment]++;
      } else {
        $stats['unknown']++;
      }
    }

    return $stats;
  }
}

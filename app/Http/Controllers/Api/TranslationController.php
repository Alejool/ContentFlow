<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TranslationController extends Controller
{
    /**
     * Traduce un texto usando IA
     */
    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|max:5000',
            'target_language' => 'required|string|in:en,es',
            'source_language' => 'nullable|string|in:en,es',
            'context' => 'nullable|string|max:500',
        ]);

        $cacheKey = 'translation_' . md5(
            $validated['text'] . 
            $validated['target_language'] . 
            ($validated['source_language'] ?? '')
        );

        // Verificar caché (24 horas)
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json([
                'translatedText' => $cached,
                'cached' => true,
            ]);
        }

        try {
            $translatedText = $this->translateWithAI(
                $validated['text'],
                $validated['target_language'],
                $validated['source_language'] ?? null,
                $validated['context'] ?? null
            );

            // Guardar en caché
            Cache::put($cacheKey, $translatedText, now()->addHours(24));

            return response()->json([
                'translatedText' => $translatedText,
                'cached' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Translation error', [
                'error' => $e->getMessage(),
                'text' => $validated['text'],
            ]);

            return response()->json([
                'translatedText' => $validated['text'],
                'error' => 'Translation failed, returning original text',
            ], 200);
        }
    }

    /**
     * Traduce múltiples textos en batch
     */
    public function translateBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'texts' => 'required|array|max:50',
            'texts.*' => 'required|string|max:5000',
            'target_language' => 'required|string|in:en,es',
            'source_language' => 'nullable|string|in:en,es',
        ]);

        $translations = [];

        foreach ($validated['texts'] as $text) {
            try {
                $cacheKey = 'translation_' . md5(
                    $text . 
                    $validated['target_language'] . 
                    ($validated['source_language'] ?? '')
                );

                $cached = Cache::get($cacheKey);
                if ($cached) {
                    $translations[] = $cached;
                    continue;
                }

                $translated = $this->translateWithAI(
                    $text,
                    $validated['target_language'],
                    $validated['source_language'] ?? null
                );

                Cache::put($cacheKey, $translated, now()->addHours(24));
                $translations[] = $translated;
            } catch (\Exception $e) {
                Log::error('Batch translation error', [
                    'error' => $e->getMessage(),
                    'text' => $text,
                ]);
                $translations[] = $text; // Fallback al original
            }
        }

        return response()->json([
            'translations' => $translations,
        ]);
    }

    /**
     * Detecta el idioma de un texto
     */
    public function detectLanguage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|max:1000',
        ]);

        try {
            $language = $this->detectLanguageWithAI($validated['text']);

            return response()->json([
                'language' => $language,
            ]);
        } catch (\Exception $e) {
            Log::error('Language detection error', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'language' => 'unknown',
            ], 200);
        }
    }

    /**
     * Traduce usando OpenAI
     */
    private function translateWithAI(
        string $text,
        string $targetLanguage,
        ?string $sourceLanguage = null,
        ?string $context = null
    ): string {
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            throw new \Exception('OpenAI API key not configured');
        }

        $targetLangName = $targetLanguage === 'es' ? 'Spanish' : 'English';
        $sourceLangName = $sourceLanguage === 'es' ? 'Spanish' : 'English';

        $prompt = "Translate the following text to {$targetLangName}";
        
        if ($sourceLanguage) {
            $prompt .= " from {$sourceLangName}";
        }
        
        if ($context) {
            $prompt .= ". Context: {$context}";
        }
        
        $prompt .= ".\n\nText: {$text}\n\nTranslation:";

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a professional translator. Provide only the translation without any additional text or explanations.',
                ],
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature' => 0.3,
            'max_tokens' => 2000,
        ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API request failed: ' . $response->body());
        }

        $data = $response->json();
        return trim($data['choices'][0]['message']['content'] ?? $text);
    }

    /**
     * Detecta el idioma usando OpenAI
     */
    private function detectLanguageWithAI(string $text): string
    {
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            throw new \Exception('OpenAI API key not configured');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(15)->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Detect the language of the text and respond with only the ISO 639-1 language code (e.g., "en", "es", "fr").',
                ],
                [
                    'role' => 'user',
                    'content' => $text,
                ],
            ],
            'temperature' => 0,
            'max_tokens' => 10,
        ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API request failed');
        }

        $data = $response->json();
        return strtolower(trim($data['choices'][0]['message']['content'] ?? 'unknown'));
    }
}

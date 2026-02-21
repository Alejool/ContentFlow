<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AIService
{
  /**
   * Available AI providers in order of preference
   */
  protected array $providers = ['deepseek', 'gemini', 'openai', 'anthropic'];

  /**
   * Main chat method
   */
  public function chat(array $context, string $provider = null, User $user = null): array
  {
    $user = $user ?? Auth::user();
    $enabledProviders = $this->getEnabledProviders($user);

    try {
      // If provider is specified, use it
      if ($provider && in_array($provider, $this->providers)) {
        if (!$this->isProviderEnabled($provider, $user)) {
          Log::warning("AIService: Specified provider {$provider} is not enabled for user.", [
            'user_id' => $user?->id
          ]);
        } else {
          try {
            return $this->callProvider($provider, $context, $user);
          } catch (\Exception $e) {
            Log::error("AIService: Specified provider {$provider} failed: " . $e->getMessage());
          }
        }
      }

      // Otherwise try providers in order of preference
      foreach ($this->providers as $p) {
        if ($this->isProviderEnabled($p, $user)) {
          try {
            return $this->callProvider($p, $context, $user);
          } catch (\Exception $e) {
            Log::warning("AIService: Provider {$p} failed, trying next...", [
              'error' => $e->getMessage()
            ]);
            continue;
          }
        }
      }

      $reason = empty($enabledProviders)
        ? 'No AI providers are enabled in your settings'
        : 'All enabled AI providers failed to respond';

      throw new \Exception($reason);
    } catch (\Exception $e) {
      Log::error('AI Service Error: ' . $e->getMessage(), [
        'user_id' => $user?->id,
        'enabled_providers' => $enabledProviders
      ]);
      return $this->getDefaultResponse($context['message'] ?? '', $context);
    }
  }

  /**
   * Check if any AI provider is currently enabled and configured
   */
  public function isAiEnabled(User $user = null): bool
  {
    return !empty($this->getEnabledProviders($user));
  }

  /**
   * Get list of enabled and configured providers
   * Returns providers in the order they appear in user's ai_settings (if user has settings)
   * Otherwise returns providers in default order
   */
  public function getEnabledProviders(User $user = null): array
  {
    $user = $user ?? Auth::user();
    $enabled = [];
    
    // If user has ai_settings, use the order from their settings
    if ($user && !empty($user->ai_settings)) {
      foreach ($user->ai_settings as $provider => $settings) {
        if (in_array($provider, $this->providers) && $this->isProviderEnabled($provider, $user)) {
          $enabled[] = $provider;
        }
      }
    }
    
    // If no enabled providers from user settings, check global config in default order
    if (empty($enabled)) {
      foreach ($this->providers as $provider) {
        if ($this->isProviderEnabled($provider, $user)) {
          $enabled[] = $provider;
        }
      }
    }
    
    return $enabled;
  }

  /**
   * Generate specific field suggestions for publications or campaigns
   */
  public function generateFieldSuggestions(array $currentFields, string $type, string $language, User $user = null, array $fieldLimits = null): array
  {
    $user = $user ?? Auth::user();
    $enabledProviders = $this->getEnabledProviders($user);

    Log::info('AI Field Suggestion Request', [
      'user_id' => $user?->id,
      'type' => $type,
      'has_ai_prompt' => isset($currentFields['ai_prompt']) && !empty($currentFields['ai_prompt']),
      'ai_prompt' => $currentFields['ai_prompt'] ?? null,
      'field_limits' => $fieldLimits,
      'enabled_providers' => $enabledProviders
    ]);

    if (empty($enabledProviders)) {
      throw new \Exception('No AI providers are enabled. Please configure an API key for Gemini or DeepSeek.');
    }

    $context = [
      'message' => "Generate field suggestions for a social media {$type}.",
      'current_fields' => $currentFields,
      'user_locale' => $language,
      'project_type' => 'field_suggestion',
      'suggestion_type' => $type,
      'field_limits' => $fieldLimits
    ];

    try {
      // Use the first enabled provider from user settings
      // The order is determined by getEnabledProviders which respects user configuration
      $provider = $enabledProviders[0];

      $result = $this->callProvider($provider, $context, $user);
      
      Log::info('AI Field Suggestion Success', [
        'user_id' => $user?->id,
        'provider' => $provider,
        'has_suggestion_data' => isset($result['suggestion']['data']),
        'suggestion_type' => $result['suggestion']['type'] ?? null
      ]);
      
      return $result;
    } catch (\Exception $e) {
      Log::error("Field suggestion failed: " . $e->getMessage());
      return $this->getDefaultResponse("Field suggestion failure", $context);
    }
  }

  /**
   * Check if provider is enabled
   */
  public function isProviderEnabled(string $provider, User $user = null): bool
  {
    $user = $user ?? Auth::user();

    // If user is logged in, prioritize THEIR settings
    if ($user && isset($user->ai_settings[$provider])) {
      $settings = $user->ai_settings[$provider];
      $isEnabled = ($settings['enabled'] ?? false) && !empty($settings['api_key']);

      // If the user has explicitly configurated this provider, respect their choice
      return $isEnabled;
    }

    // Otherwise fall back to global settings
    return config("services.{$provider}.enabled", false)
      && !empty(config("services.{$provider}.api_key"));
  }

  /**
   * Call specific provider
   */
  protected function callProvider(string $provider, array $context, User $user = null): array
  {
    $method = "call" . ucfirst($provider);

    if (!method_exists($this, $method)) {
      throw new \Exception("Provider method {$method} not found");
    }

    return $this->$method($context, $user);
  }

  /**
   * Call DeepSeek API
   */
  protected function callDeepSeek(array $context, User $user = null): array
  {
    $user = $user ?? Auth::user();
    $apiKey = ($user && isset($user->ai_settings['deepseek']['api_key']) && !empty($user->ai_settings['deepseek']['api_key']))
      ? $user->ai_settings['deepseek']['api_key']
      : config('services.deepseek.api_key');

    if (!$apiKey) {
      throw new \Exception('DeepSeek API key not configured');
    }

    $messages = $this->prepareDeepSeekMessages($context);

    $response = Http::withoutVerifying()
      ->withHeaders([
        'Authorization' => 'Bearer ' . $apiKey,
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
      ])
      ->timeout(config('services.deepseek.timeout', 90))
      ->post('https://api.deepseek.com/chat/completions', [
        'model' => config('services.deepseek.model', 'deepseek-chat'),
        'messages' => $messages,
        'temperature' => (float) config('services.deepseek.temperature', 0.3),
        'max_tokens' => (int) config('services.deepseek.max_tokens', 1000),
        'response_format' => ['type' => 'json_object']
      ]);

    if (!$response->successful()) {
      Log::error('DeepSeek API Error', [
        'status' => $response->status(),
        'body' => $response->json() ?? $response->body()
      ]);
      throw new \Exception("DeepSeek API error: " . ($response->json()['message'] ?? 'Request failed'));
    }

    $data = $response->json();
    $content = $data['choices'][0]['message']['content'] ?? '{}';

    return $this->parseAIResponse($content, 'deepseek', config('services.deepseek.model'));
  }

  /**
   * Prepare messages for DeepSeek
   */
  protected function prepareDeepSeekMessages(array $context): array
  {
    return [
      [
        'role' => 'system',
        'content' => $this->getSystemPrompt($context)
      ],
      [
        'role' => 'user',
        'content' => $context['message']
      ]
    ];
  }

  /**
   * Call Gemini API
   */
  protected function callGemini(array $context, User $user = null): array
  {
    $user = $user ?? Auth::user();
    $apiKey = ($user && isset($user->ai_settings['gemini']['api_key']) && !empty($user->ai_settings['gemini']['api_key']))
      ? $user->ai_settings['gemini']['api_key']
      : config('services.gemini.api_key');

    if (!$apiKey) {
      throw new \Exception('Gemini API key not configured');
    }

    $model = config('services.gemini.model', 'gemini-1.5-flash');

    $response = Http::withoutVerifying()
      ->timeout(60)
      ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $apiKey, [
        'contents' => [
          [
            'role' => 'user',
            'parts' => [
              ['text' => $this->getSystemPrompt($context) . "\n\nUser Message: " . $context['message']]
            ]
          ]
        ],
        'generationConfig' => [
          'temperature' => (float) config('services.gemini.temperature', 0.7),
          'maxOutputTokens' => 1000,
        ]
      ]);

    if (!$response->successful()) {
      Log::error('Gemini API Error', [
        'status' => $response->status(),
        'body' => $response->json() ?? $response->body()
      ]);
      throw new \Exception("Gemini API error: " . ($response->json()[0]['error']['message'] ?? 'Request failed'));
    }

    $data = $response->json();
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

    return $this->parseAIResponse($text, 'gemini', $model);
  }

  /**
   * Call OpenAI API
   */
  protected function callOpenAI(array $context, User $user = null): array
  {
    $user = $user ?? Auth::user();
    $apiKey = ($user && isset($user->ai_settings['openai']['api_key']) && !empty($user->ai_settings['openai']['api_key']))
      ? $user->ai_settings['openai']['api_key']
      : config('services.openai.api_key');

    if (!$apiKey) {
      throw new \Exception('OpenAI API key not configured');
    }

    $response = Http::withoutVerifying()
      ->withHeaders([
        'Authorization' => 'Bearer ' . $apiKey,
        'Content-Type' => 'application/json',
      ])
      ->timeout(60)
      ->post('https://api.openai.com/v1/chat/completions', [
        'model' => config('services.openai.model', 'gpt-4o-mini'),
        'messages' => [
          ['role' => 'system', 'content' => $this->getSystemPrompt($context)],
          ['role' => 'user', 'content' => $context['message']]
        ],
        'temperature' => (float) config('services.openai.temperature', 0.7),
        'response_format' => ['type' => 'json_object']
      ]);

    if (!$response->successful()) {
      Log::error('OpenAI API Error', ['status' => $response->status()]);
      throw new \Exception('OpenAI request failed');
    }

    $data = $response->json();
    $content = $data['choices'][0]['message']['content'] ?? '{}';

    return $this->parseAIResponse($content, 'openai', config('services.openai.model'));
  }

  /**
   * Call Anthropic API
   */
  protected function callAnthropic(array $context, User $user = null): array
  {
    $user = $user ?? Auth::user();
    $apiKey = ($user && isset($user->ai_settings['anthropic']['api_key']) && !empty($user->ai_settings['anthropic']['api_key']))
      ? $user->ai_settings['anthropic']['api_key']
      : config('services.anthropic.api_key');

    if (!$apiKey) {
      throw new \Exception('Anthropic API key not configured');
    }

    $response = Http::withoutVerifying()
      ->withHeaders([
        'x-api-key' => $apiKey,
        'anthropic-version' => '2023-06-01',
        'Content-Type' => 'application/json',
      ])
      ->timeout(60)
      ->post('https://api.anthropic.com/v1/messages', [
        'model' => config('services.anthropic.model', 'claude-3-haiku-20240307'),
        'max_tokens' => 1000,
        'messages' => [
          ['role' => 'user', 'content' => $this->getSystemPrompt($context) . "\n\nUser Message: " . $context['message']]
        ]
      ]);

    if (!$response->successful()) {
      Log::error('Anthropic API Error', ['status' => $response->status()]);
      throw new \Exception('Anthropic request failed');
    }

    $data = $response->json();
    $content = $data['content'][0]['text'] ?? '{}';

    return $this->parseAIResponse($content, 'anthropic', config('services.anthropic.model'));
  }

  /**
   * Unified System Prompt Generator
   */
  protected function getSystemPrompt(array $context): string
  {
    $locale = $context['user_locale'] ?? 'es';
    $languageMap = [
      'es' => 'Español',
      'en' => 'Inglés',
      'pt' => 'Portugués',
      'fr' => 'Francés'
    ];
    $language = $languageMap[$locale] ?? 'Español';

    $prompt = "Eres un Asistente Experto en Gestión de Redes Sociales para la plataforma ContentFlow.\n";
    $prompt .= "IDIOMA MANDATORIO: Debes responder siempre en {$language}.\n\n";

    $prompt .= "REGLAS DE FORMATO JSON CRÍTICAS:\n";
    $prompt .= "1. Responde ÚNICAMENTE con JSON válido puro.\n";
    $prompt .= "2. NO uses markdown, NO uses backticks (```), NO uses ```json.\n";
    $prompt .= "3. NO escribas NADA antes o después del JSON.\n";
    $prompt .= "4. NO expliques, NO saludes, NO des contexto.\n";
    $prompt .= "5. El campo 'message' SIEMPRE debe ser exactamente: \"OK\"\n";
    $prompt .= "6. COMPLETA todos los campos hasta el final (no los dejes a medias).\n";
    $prompt .= "7. El JSON DEBE tener exactamente esta estructura, sin excepciones.\n\n";

    $prompt .= "ESTRUCTURA JSON EXACTA REQUERIDA:\n";
    $prompt .= "{\n";
    $prompt .= "  \"message\": \"OK\",\n";
    $prompt .= "  \"suggestion\": {\n";
    $prompt .= "    \"type\": \"tipo_aqui\",\n";
    $prompt .= "    \"data\": { campos_aqui }\n";
    $prompt .= "  }\n";
    $prompt .= "}\n\n";

    if (isset($context['project_type']) && $context['project_type'] === 'field_suggestion') {
      $prompt .= "TAREA: GENERAR CAMPOS DE FORMULARIO\n\n";
      
      $currentFields = $context['current_fields'] ?? [];
      $suggestionType = $context['suggestion_type'] ?? 'publication';
      $fieldLimits = $context['field_limits'] ?? [];
      
      // Check if user provided an ai_prompt (idea)
      if (isset($currentFields['ai_prompt']) && !empty($currentFields['ai_prompt'])) {
        $prompt .= "IDEA DEL USUARIO: \"{$currentFields['ai_prompt']}\"\n";
        $prompt .= "Genera contenido basado en esta idea específica del usuario.\n\n";
      } else {
        $prompt .= "El usuario no proporcionó una idea específica. Genera contenido genérico profesional.\n\n";
      }
      
      if ($suggestionType === 'publication') {
        $titleMax = $fieldLimits['title']['max'] ?? 70;
        $descMin = $fieldLimits['description']['min'] ?? 10;
        $descMax = $fieldLimits['description']['max'] ?? 700;
        $goalMin = $fieldLimits['goal']['min'] ?? 5;
        $goalMax = $fieldLimits['goal']['max'] ?? 200;
        $hashtagsMax = $fieldLimits['hashtags']['max'] ?? 10;
        
        $prompt .= "TIPO DE SUGGESTION: \"publication_field_suggestion\"\n\n";
        $prompt .= "CAMPOS REQUERIDOS EN suggestion.data:\n";
        $prompt .= "- title: string (máximo {$titleMax} caracteres, CORTO Y DIRECTO)\n";
        $prompt .= "- description: string (entre {$descMin} y {$descMax} caracteres, CONCISO, SIN EXAGERAR)\n";
        $prompt .= "- goal: string (entre {$goalMin} y {$goalMax} caracteres, SIMPLE Y CLARO)\n";
        $prompt .= "- hashtags: string (5-{$hashtagsMax} hashtags separados por espacios, ejemplo: \"#tag1 #tag2 #tag3\")\n\n";
        
        $prompt .= "ESTILO DE CONTENIDO:\n";
        $prompt .= "- Usa lenguaje SIMPLE y DIRECTO\n";
        $prompt .= "- NO uses palabras exageradas como 'increíble', 'espectacular', 'revolucionario'\n";
        $prompt .= "- NO uses emojis excesivos\n";
        $prompt .= "- Sé BREVE y PROFESIONAL\n";
        $prompt .= "- Evita frases largas y complejas\n\n";
        
        $prompt .= "EJEMPLO DE RESPUESTA VÁLIDA:\n";
        $prompt .= "{\n";
        $prompt .= "  \"message\": \"OK\",\n";
        $prompt .= "  \"suggestion\": {\n";
        $prompt .= "    \"type\": \"publication_field_suggestion\",\n";
        $prompt .= "    \"data\": {\n";
        $prompt .= "      \"title\": \"Título claro y breve\",\n";
        $prompt .= "      \"description\": \"Descripción concisa sin exageraciones\",\n";
        $prompt .= "      \"goal\": \"Objetivo simple\",\n";
        $prompt .= "      \"hashtags\": \"#tag1 #tag2 #tag3 #tag4 #tag5\"\n";
        $prompt .= "    }\n";
        $prompt .= "  }\n";
        $prompt .= "}\n\n";
        
      } else if ($suggestionType === 'campaign') {
        $nameMax = $fieldLimits['name']['max'] ?? 100;
        $descMax = $fieldLimits['description']['max'] ?? 500;
        $goalMax = $fieldLimits['goal']['max'] ?? 200;
        
        $today = date('Y-m-d');
        $twoDaysLater = date('Y-m-d', strtotime('+2 days'));
        
        $prompt .= "TIPO DE SUGGESTION: \"campaign_field_suggestion\"\n\n";
        $prompt .= "CAMPOS REQUERIDOS EN suggestion.data:\n";
        $prompt .= "- name: string (máximo {$nameMax} caracteres, CORTO Y DIRECTO)\n";
        $prompt .= "- description: string (máximo {$descMax} caracteres, CONCISO, SIN EXAGERAR)\n";
        $prompt .= "- goal: string (máximo {$goalMax} caracteres, SIMPLE Y CLARO)\n";
        $prompt .= "- budget: string (siempre \"0\")\n";
        $prompt .= "- start_date: string (formato YYYY-MM-DD, usar \"{$today}\")\n";
        $prompt .= "- end_date: string (formato YYYY-MM-DD, usar \"{$twoDaysLater}\")\n\n";
        
        $prompt .= "ESTILO DE CONTENIDO:\n";
        $prompt .= "- Usa lenguaje SIMPLE y DIRECTO\n";
        $prompt .= "- NO uses palabras exageradas como 'increíble', 'espectacular', 'revolucionario'\n";
        $prompt .= "- NO uses emojis excesivos\n";
        $prompt .= "- Sé BREVE y PROFESIONAL\n";
        $prompt .= "- Evita frases largas y complejas\n\n";
        
        $prompt .= "EJEMPLO DE RESPUESTA VÁLIDA:\n";
        $prompt .= "{\n";
        $prompt .= "  \"message\": \"OK\",\n";
        $prompt .= "  \"suggestion\": {\n";
        $prompt .= "    \"type\": \"campaign_field_suggestion\",\n";
        $prompt .= "    \"data\": {\n";
        $prompt .= "      \"name\": \"Nombre breve\",\n";
        $prompt .= "      \"description\": \"Descripción concisa\",\n";
        $prompt .= "      \"goal\": \"Objetivo simple\",\n";
        $prompt .= "      \"budget\": \"0\",\n";
        $prompt .= "      \"start_date\": \"{$today}\",\n";
        $prompt .= "      \"end_date\": \"{$twoDaysLater}\"\n";
        $prompt .= "    }\n";
        $prompt .= "  }\n";
        $prompt .= "}\n\n";
      }
      
      $prompt .= "INSTRUCCIONES FINALES:\n";
      $prompt .= "- Contenido BREVE, SIMPLE y PROFESIONAL\n";
      $prompt .= "- SIN palabras exageradas o marketing excesivo\n";
      $prompt .= "- COMPLETA todos los campos\n";
      $prompt .= "- NO excedas los límites de caracteres\n";
      $prompt .= "- Responde SOLO con el JSON exacto como en el ejemplo\n";
    }

    if (isset($context['project_type']) && $context['project_type'] === 'sentiment_analysis') {
      $prompt = "Eres un experto en moderación de contenido de redes sociales.\n\n";
      $prompt .= "TAREA: Clasifica el siguiente comentario en una de estas tres categorías:\n\n";
      $prompt .= "1. **positive**: Comentarios de apoyo, apreciativos o con retroalimentación constructiva\n";
      $prompt .= "2. **inquiry**: Preguntas, solicitudes de información o aclaraciones\n";
      $prompt .= "3. **hate_speech**: Contenido ofensivo, discriminatorio, amenazante o dañino\n\n";
      $prompt .= "IMPORTANTE: Responde ÚNICAMENTE con JSON válido en esta estructura exacta:\n";
      $prompt .= "{\n  \"sentiment\": \"positive|inquiry|hate_speech\",\n  \"confidence\": 0.95,\n  \"reasoning\": \"breve explicación en español\"\n}\n\n";
      $prompt .= "NO agregues texto adicional fuera del JSON. NO uses markdown. Solo JSON puro.\n";
    }

    return $prompt;
  }

  /**
   * Parse and clean AI response
   */
  protected function parseAIResponse(string $content, string $provider, string $model = 'default'): array
  {
    Log::info('Parsing AI Response', [
      'provider' => $provider,
      'model' => $model,
      'raw_content_length' => strlen($content),
      'raw_content_preview' => substr($content, 0, 500)
    ]);
    
    // Remove markdown code blocks more aggressively
    $cleanContent = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($content));
    $cleanContent = trim($cleanContent);
    
    // Try to extract only the JSON part if there's extra text
    if (preg_match('/\{[\s\S]*"suggestion"[\s\S]*\}/s', $cleanContent, $matches)) {
      $cleanContent = $matches[0];
    }
    
    $parsed = json_decode($cleanContent, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
      Log::warning('JSON decode failed, attempting extraction', [
        'error' => json_last_error_msg(),
        'content_preview' => substr($cleanContent, 0, 300)
      ]);
      
      // Try to extract JSON from the content
      if (preg_match('/\{.*\}/s', $content, $matches)) {
        $parsed = json_decode($matches[0], true);
      }
    }

    if (!$parsed || !isset($parsed['suggestion'])) {
      Log::error('Failed to parse AI response - no suggestion found', [
        'provider' => $provider,
        'content_preview' => substr($content, 0, 500),
        'parsed' => $parsed
      ]);
      
      // Return error instead of empty suggestion
      throw new \Exception('AI response does not contain valid suggestion data');
    }

    // Validate that suggestion has data
    if (!isset($parsed['suggestion']['data']) || empty($parsed['suggestion']['data'])) {
      Log::error('AI response has empty suggestion data', [
        'provider' => $provider,
        'suggestion' => $parsed['suggestion'] ?? null
      ]);
      
      throw new \Exception('AI response contains empty suggestion data');
    }

    // ALWAYS force message to "OK" for field suggestions
    $parsed['message'] = 'OK';

    // Clean hashtags if they exist - replace commas with spaces
    if (isset($parsed['suggestion']['data']['hashtags'])) {
      $hashtags = $parsed['suggestion']['data']['hashtags'];
      // Replace commas (with or without spaces) with single space
      $hashtags = preg_replace('/,\s*/', ' ', $hashtags);
      // Remove multiple spaces
      $hashtags = preg_replace('/\s+/', ' ', $hashtags);
      // Trim
      $hashtags = trim($hashtags);
      $parsed['suggestion']['data']['hashtags'] = $hashtags;
    }

    // Validate and fix campaign data if present
    if (isset($parsed['suggestion']['data'])) {
      $data = &$parsed['suggestion']['data'];
      
      // Strip HTML tags from all text fields
      foreach ($data as $key => $value) {
        if (is_string($value)) {
          $data[$key] = strip_tags($value);
        }
      }
      
      // For campaigns, ensure all required fields are present
      if (isset($parsed['suggestion']['type']) && 
          (strpos($parsed['suggestion']['type'], 'campaign') !== false)) {
        
        // Rename 'title' to 'name' if present
        if (isset($data['title']) && !isset($data['name'])) {
          $data['name'] = $data['title'];
          unset($data['title']);
        }
        
        // Remove hashtags field if present (not for campaigns)
        if (isset($data['hashtags'])) {
          unset($data['hashtags']);
        }
        
        // Truncate description if too long (500 chars for campaigns)
        if (isset($data['description']) && strlen($data['description']) > 500) {
          $data['description'] = substr($data['description'], 0, 497) . '...';
        }
        
        // Truncate name if too long
        if (isset($data['name']) && strlen($data['name']) > 100) {
          $data['name'] = substr($data['name'], 0, 97) . '...';
        }
        
        // Truncate goal if too long
        if (isset($data['goal']) && strlen($data['goal']) > 200) {
          $data['goal'] = substr($data['goal'], 0, 197) . '...';
        }
        
        // Add default budget if missing or invalid (default: 0)
        if (!isset($data['budget']) || empty($data['budget']) || !is_numeric($data['budget'])) {
          $data['budget'] = '0';
        }
        
        // Ensure budget is string without symbols
        $data['budget'] = preg_replace('/[^0-9.]/', '', $data['budget']);
        
        // Add default dates if missing (default: today and +2 days)
        if (!isset($data['start_date']) || empty($data['start_date'])) {
          $data['start_date'] = date('Y-m-d');
        }
        
        if (!isset($data['end_date']) || empty($data['end_date'])) {
          $data['end_date'] = date('Y-m-d', strtotime('+2 days'));
        }
      }
      
      // For publications, ensure title field exists
      if (isset($parsed['suggestion']['type']) && 
          (strpos($parsed['suggestion']['type'], 'publication') !== false)) {
        
        // Truncate description if too long (700 chars for publications)
        if (isset($data['description']) && strlen($data['description']) > 700) {
          $data['description'] = substr($data['description'], 0, 697) . '...';
        }
        
        // Truncate title if too long
        if (isset($data['title']) && strlen($data['title']) > 70) {
          $data['title'] = substr($data['title'], 0, 67) . '...';
        }
        
        // Truncate goal if too long
        if (isset($data['goal']) && strlen($data['goal']) > 200) {
          $data['goal'] = substr($data['goal'], 0, 197) . '...';
        }
      }
    }

    Log::info('AI Response Parsed Successfully', [
      'provider' => $provider,
      'has_suggestion' => isset($parsed['suggestion']),
      'suggestion_type' => $parsed['suggestion']['type'] ?? null,
      'data_keys' => isset($parsed['suggestion']['data']) ? array_keys($parsed['suggestion']['data']) : []
    ]);

    return [
      'message' => 'OK',  // Always return "OK"
      'suggestion' => $parsed['suggestion'] ?? null,
      'provider' => $provider,
      'model' => $model
    ];
  }

  /**
   * Default response when all providers fail
   */
  protected function getDefaultResponse(string $userMessage, array $context = []): array
  {
    // Try to get locale from context, fallback to user's preferred locale or app default
    $userLocale = $context['user_locale'] ?? app()->getLocale();

    // If it's not Spanish, still default to Spanish if that's what the user wants based on feedback
    $isSpanish = in_array($userLocale, ['es', 'es_ES', 'es_MX']);

    $message = $isSpanish
      ? 'Lo sentimos, no pudimos conectar con el servicio de IA. Por favor, verifica tus claves API en tu perfil o intenta más tarde.'
      : 'Lo sentimos, no pudimos conectar con el servicio de IA. Por favor, verifica tus claves API en tu perfil o intenta más tarde.';
    // User specifically complained about English, so I will default to Spanish for now
    // or at least ensure the Spanish version is correct.
    // Wait, if I want to be safe, I'll keep English as second option but maybe they are stuck in English.

    return [
      'message' => $message,
      'suggestion' => null,
      'provider' => 'error',
      'model' => 'none'
    ];
  }

  /**
   * Validate API key for a provider
   */
  public function validateApiKey(string $provider, string $apiKey): bool
  {
    try {
      $testContext = ['message' => 'Hello', 'project_type' => 'test'];
      // We don't temporarily set config because callProvider now takes optionally user/explicit logic
      // For validation, we'll use a dummy user or logic that uses this key
      $method = "call" . ucfirst($provider);
      if (!method_exists($this, $method)) return false;

      // Temporary config set just for this check if no user provided
      config(["services.{$provider}.api_key" => $apiKey]);
      $response = $this->$method($testContext);
      return isset($response['message']) && $response['provider'] !== 'error';
    } catch (\Exception $e) {
      Log::error("AIService: API Key validation failed for {$provider}: " . $e->getMessage());
      return false;
    }
  }

  /**
   * Get provider statistics
   */
  public function getProviderStats(User $user = null): array
  {
    $user = $user ?? Auth::user();
    $stats = [];
    foreach ($this->providers as $provider) {
      $stats[$provider] = [
        'enabled' => $this->isProviderEnabled($provider, $user),
        'requests' => Cache::get("ai_requests_{$provider}", 0),
        'last_used' => Cache::get("ai_last_used_{$provider}"),
      ];
    }
    return $stats;
  }

  /**
   * Get available AI models and providers
   */
  public function getAvailableModels(User $user = null): array
  {
    $user = $user ?? Auth::user();
    $models = [];

    foreach ($this->providers as $provider) {
      $models[$provider] = [
        'name' => ucfirst($provider),
        'enabled' => $this->isProviderEnabled($provider, $user),
        'models' => $this->getProviderModels($provider)
      ];
    }

    return $models;
  }

  /**
   * Get target models for a provider
   */
  protected function getProviderModels(string $provider): array
  {
    return match ($provider) {
      'deepseek' => [
        'deepseek-chat' => 'DeepSeek Chat',
      ],
      'gemini' => [
        'gemini-1.5-flash' => 'Gemini 1.5 Flash',
        'gemini-1.5-pro' => 'Gemini 1.5 Pro',
      ],
      'openai' => [
        'gpt-4o-mini' => 'GPT-4o Mini',
        'gpt-3.5-turbo' => 'GPT-3.5 Turbo',
      ],
      'anthropic' => [
        'claude-3-haiku-20240307' => 'Claude 3 Haiku',
      ],
      default => []
    };
  }
}

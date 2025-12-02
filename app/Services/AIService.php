<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AIService
{
    /**
     * Available AI providers in order of preference
     */
    protected array $providers = ['deepseek', 'gemini', 'openai'];

    /**
     * Main chat method
     */
    public function chat(array $context, string $provider = null): array
    {
        try {
            // If provider is specified, use it
            if ($provider && in_array($provider, $this->providers)) {
                return $this->callProvider($provider, $context);
            }

            // Otherwise try providers in order of preference
            foreach ($this->providers as $provider) {
                if ($this->isProviderEnabled($provider)) {
                    try {
                        return $this->callProvider($provider, $context);
                    } catch (\Exception $e) {
                        Log::warning("Provider {$provider} failed, trying next...", [
                            'error' => $e->getMessage()
                        ]);
                        continue;
                    }
                }
            }

            throw new \Exception('No AI provider available or enabled');

        } catch (\Exception $e) {
            Log::error('AI Service Error: ' . $e->getMessage());
            return $this->getDefaultResponse($context['message'] ?? '');
        }
    }

    /**
     * Check if provider is enabled
     */
    protected function isProviderEnabled(string $provider): bool
    {
        return config("services.{$provider}.enabled", false) 
            && !empty(config("services.{$provider}.api_key"));
    }

    /**
     * Call specific provider
     */
    protected function callProvider(string $provider, array $context): array
    {
        $method = "call{$provider}";
        
        if (!method_exists($this, $method)) {
            throw new \Exception("Provider method {$method} not found");
        }

        return $this->$method($context);
    }

    /**
     * Call DeepSeek API
     */
    protected function callDeepSeek(array $context): array
    {
        $apiKey = config('services.deepseek.api_key');
        
        if (!$apiKey) {
            throw new \Exception('DeepSeek API key not configured');
        }

        // Prepare messages for DeepSeek
        $messages = $this->prepareDeepSeekMessages($context);

        // Make API request
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])
        ->timeout(config('services.deepseek.timeout', 60))
        ->retry(3, 100)
        ->post('https://api.deepseek.com/v1/chat/completions', [
            'model' => config('services.deepseek.model', 'deepseek-chat'),
            'messages' => $messages,
            'temperature' => config('services.deepseek.temperature', 0.7),
            'max_tokens' => config('services.deepseek.max_tokens', 2000),
            'stream' => false,
            'response_format' => [
                'type' => 'json_object' // Force JSON response for easier parsing
            ]
        ]);

        if (!$response->successful()) {
            Log::error('DeepSeek API Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            throw new \Exception('DeepSeek API request failed');
        }

        $responseData = $response->json();
        
        if (!isset($responseData['choices'][0]['message']['content'])) {
            throw new \Exception('Invalid response format from DeepSeek');
        }

        $content = $responseData['choices'][0]['message']['content'];
        
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
     * Generate the unified system prompt
     */
    protected function getSystemPrompt(array $context): string
    {
        $systemMessage = "You are an expert Social Media Management Assistant. Your role is to help users strategize, create content, and manage their social media presence effectively.\n\n";

        $systemMessage .= "CRITICAL INSTRUCTIONS FOR RESPONSE FORMAT:\n";
        $systemMessage .= "1.  **CLEAN FORMATTING**: Do NOT use asterisks (*) for bolding, lists, or emphasis. The output must be clean text. If you need to list items, use numbered lists (1., 2.) or simple dashes (-) ONLY if absolutely necessary, but prefer clean paragraphs.\n";
        $systemMessage .= "2.  **PROFESSIONAL TONE**: Maintain a professional, helpful, and concise tone. Avoid robotic or overly enthusiastic greetings.\n";
        $systemMessage .= "3.  **DIRECTNESS**: Do NOT repeat the user's context back to them (e.g., do not say 'I see you are looking for...'). Go straight to providing value, answers, or questions.\n";
        $systemMessage .= "4.  **REALISM**: Act as a real human expert would. Be practical and realistic.\n";
        $systemMessage .= "5.  **LANGUAGE**: Always respond in English unless the user specifically asks for another language.\n\n";

        // Add specific context based on what's provided
        if (isset($context['campaigns']) && !empty($context['campaigns'])) {
            $systemMessage .= "CONTEXT - ACTIVE CAMPAIGNS:\n";
            foreach ($context['campaigns'] as $campaign) {
                $systemMessage .= "- Campaign: {$campaign['title']} (Status: {$campaign['status']})\n";
                $systemMessage .= "  Description: {$campaign['description']}\n";
                $systemMessage .= "  Period: {$campaign['start_date']} to {$campaign['end_date']}\n";
            }
            $systemMessage .= "\nUse this campaign data to provide specific, actionable advice.\n";
        }

        // Add project context
        if (isset($context['project_type'])) {
            $systemMessage .= "Project Type: {$context['project_type']}\n";
        }

        // Add user information if available
        if (isset($context['user'])) {
            $systemMessage .= "User: {$context['user']}\n";
        }

        // Add response format instructions
        $systemMessage .= "\nIMPORTANT: Always respond in valid JSON format with this structure:\n" .
                        "{\n" .
                        "  \"message\": \"Your detailed response message here (NO asterisks)\",\n" .
                        "  \"suggestion\": {\n" .
                        "    \"type\": \"suggestion_type\",\n" .
                        "    \"data\": {}\n" .
                        "  }\n" .
                        "}\n\n" .
                        "The 'suggestion' field can be null if no specific suggestion is needed.\n" .
                        "Available suggestion types: new_campaign, improvement, content_idea, analytics_insight, scheduling";

        return $systemMessage;
    }

    /**
     * Call Gemini API
     */
    protected function callGemini(array $context): array
    {
        $apiKey = config('services.gemini.api_key');
        
        if (!$apiKey) {
            throw new \Exception('Gemini API key not configured');
        }

        $response = Http::withoutVerifying()
            ->withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->timeout(60)
            ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey, [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            ['text' => $this->getSystemPrompt($context) . "\n\nUser Message: " . $context['message']]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.4,
                    'topP' => 0.8,
                    'topK' => 40,
                    'maxOutputTokens' => 400,
                ]
            ]);

        if (!$response->successful()) {
            throw new \Exception('Gemini API request failed');
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        
        return $this->parseAIResponse($text, 'gemini');
    }

    /**
     * Call OpenAI API
     */
    protected function callOpenAI(array $context): array
    {
        $apiKey = config('services.openai.api_key');
        
        if (!$apiKey) {
            throw new \Exception('OpenAI API key not configured');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])
        ->timeout(60)
        ->post('https://api.openai.com/v1/chat/completions', [
            'model' => config('services.openai.model', 'gpt-3.5-turbo'),
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $this->getSystemPrompt($context)
                ],
                [
                    'role' => 'user',
                    'content' => $context['message']
                ]
            ],
            'temperature' => 0.7,
            'response_format' => ['type' => 'json_object']
        ]);

        if (!$response->successful()) {
            throw new \Exception('OpenAI API request failed');
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? '{}';
        
        return $this->parseAIResponse($content, 'openai', config('services.openai.model'));
    }

    /**
     * Parse and clean AI response
     */
    protected function parseAIResponse(string $content, string $provider, string $model = 'default'): array
    {
        // Remove markdown code blocks if present
        $cleanContent = preg_replace('/^```json\s*|\s*```$/', '', trim($content));
        $cleanContent = preg_replace('/^```\s*|\s*```$/', '', $cleanContent);
        
        $parsed = json_decode($cleanContent, true);
        
        // If JSON decode failed, try to find JSON object in text
        if (json_last_error() !== JSON_ERROR_NONE) {
            if (preg_match('/\{.*\}/s', $content, $matches)) {
                $parsed = json_decode($matches[0], true);
            }
        }

        // Fallback if still not parsed
        if (!$parsed) {
            $parsed = [
                'message' => $content,
                'suggestion' => null
            ];
        }

        // Clean message content (remove asterisks and extra whitespace)
        $message = $parsed['message'] ?? '';
        $message = str_replace(['**', '*'], '', $message); // Remove asterisks
        $message = preg_replace('/\n{3,}/', "\n\n", $message); // Normalize newlines
        
        return [
            'message' => trim($message),
            'suggestion' => $parsed['suggestion'] ?? null,
            'provider' => $provider,
            'model' => $model,
            'usage' => null // Usage tracking can be added if needed
        ];
    }

    /**
     * Get available AI models
     */
    public function getAvailableModels(): array
    {
        $models = [];
        
        foreach ($this->providers as $provider) {
            $models[$provider] = [
                'name' => ucfirst($provider),
                'enabled' => $this->isProviderEnabled($provider),
                'models' => $this->getProviderModels($provider)
            ];
        }
        
        return $models;
    }

    /**
     * Get models for a specific provider
     */
    protected function getProviderModels(string $provider): array
    {
        return match($provider) {
            'deepseek' => [
                'deepseek-chat' => 'DeepSeek Chat (Latest)',
                'deepseek-coder' => 'DeepSeek Coder',
            ],
            'openai' => [
                'gpt-3.5-turbo' => 'GPT-3.5 Turbo',
                'gpt-4-turbo' => 'GPT-4 Turbo',
                'gpt-4' => 'GPT-4',
            ],
            'gemini' => [
                'gemini-2.0-flash' => 'Gemini 2.0 Flash',
                'gemini-1.5-pro' => 'Gemini 1.5 Pro',
            ],
            default => []
        };
    }

    /**
     * Get provider statistics
     */
    public function getProviderStats(): array
    {
        $stats = [];
        
        foreach ($this->providers as $provider) {
            $stats[$provider] = [
                'enabled' => $this->isProviderEnabled($provider),
                'model' => config("services.{$provider}.model"),
                'requests' => Cache::get("ai_requests_{$provider}", 0),
                'last_used' => Cache::get("ai_last_used_{$provider}"),
            ];
        }
        
        return $stats;
    }

    /**
     * Validate API key for a provider
     */
    public function validateApiKey(string $provider, string $apiKey): bool
    {
        try {
            // Simple validation by making a minimal request
            $testContext = [
                'message' => 'Hello',
                'project_type' => 'test'
            ];
            
            // Temporarily set the API key
            config(["services.{$provider}.api_key" => $apiKey]);
            
            $response = $this->callProvider($provider, $testContext);
            
            return isset($response['message']) && !empty($response['message']);
            
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Default response when all providers fail
     */
    protected function getDefaultResponse(string $userMessage): array
    {
        $userMessage = strtolower($userMessage);
        
        if (strpos($userMessage, 'new campaign') !== false) {
            return [
                'message' => 'Based on your previous campaigns, I would recommend creating a campaign focused on Instagram engagement with weekly posts. Would you like me to help you structure it?',
                'suggestion' => [
                    'type' => 'new_campaign',
                    'data' => [
                        'name' => 'Instagram Engagement Campaign',
                        'platform' => 'Instagram',
                        'frequency' => 'weekly',
                        'goal' => 'increase_engagement'
                    ]
                ],
                'provider' => 'default',
                'model' => 'default'
            ];
        } elseif (strpos($userMessage, 'improve') !== false) {
            return [
                'message' => 'I have analyzed your current campaigns and see opportunities for improvement in posting frequency and hashtag usage. Would you like me to provide specific recommendations?',
                'suggestion' => [
                    'type' => 'improvement',
                    'data' => [
                        'campaign_id' => 1,
                        'improvements' => [
                            'hashtags' => ['#ContentStrategy', '#SocialGrowth', '#DigitalMarketing'],
                            'posting_frequency' => 'Increase to 3 times per week',
                            'best_times' => ['Monday 10am', 'Wednesday 2pm', 'Friday 6pm']
                        ]
                    ]
                ],
                'provider' => 'default',
                'model' => 'default'
            ];
        } else {
            return [
                'message' => 'I am here to help you with your social media campaigns. You can ask me about creating new campaigns, improving existing ones, or analyzing your content performance.',
                'suggestion' => null,
                'provider' => 'default',
                'model' => 'default'
            ];
        }
    }
}
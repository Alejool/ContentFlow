<?php

namespace App\Http\Controllers\Ai;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\AIService;
use App\Http\Controllers\Controller;

use App\Models\Campaign\Campaign;
use App\Models\Social\SocialAccount;
use App\Models\User;

class AIChatController extends Controller
{
    protected AIService $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Process chat message
     */
    public function processMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'context' => 'nullable|array',
            'provider' => 'nullable|string|in:deepseek,gemini,openai,anthropic',
            'source' => 'nullable|string|in:chat,assistant'
        ]);

        try {
            // Get user information
            /** @var User $user */
            $user = Auth::user();

            // Determine if we should include campaign context
            $source = $request->input('source', 'chat');
            $includeContext = $source === 'assistant';

            $campaigns = [];
            $socialAccounts = [];

            if ($includeContext) {
                $campaigns = $request->input('context.campaigns', []);
                if (empty($campaigns)) {
                    $campaigns = Campaign::where('workspace_id', $user->current_workspace_id)
                        ->select('id', 'name as title', 'description', 'status', 'start_date', 'end_date')
                        ->get()
                        ->toArray();
                }

                // Fetch connected social accounts
                $socialAccounts = SocialAccount::where('workspace_id', $user->current_workspace_id)
                    ->select('platform', 'account_id', 'created_at')
                    ->get()
                    ->toArray();
            }

            // Prepare context for the AI
            $context = [
                'user' => $user->name,
                'user_email' => $user->email,
                'user_locale' => $user->locale ?? 'en',
                'project_type' => 'social_media_management',
                'message' => $request->input('message'),
                'timestamp' => now()->toISOString()
            ];

            if ($includeContext) {
                $context['campaigns'] = $campaigns;
                $context['social_accounts'] = $socialAccounts;
                $context['context_type'] = 'campaign_management';
            } else {
                $context['context_type'] = 'general_assistance';
            }

            // Get AI response
            $provider = $request->input('provider');

            $startTime = microtime(true);
            $aiResponse = $this->aiService->chat($context, $provider, $user);
            $endTime = microtime(true);
            $duration = $endTime - $startTime;

            // Log successful request
            Log::info('AI Chat Request Processed', [
                'user_id' => $user->id,
                'provider' => $aiResponse['provider'] ?? 'unknown',
                'message_length' => strlen($request->input('message')),
                'has_context' => $includeContext,
                'campaign_count' => count($campaigns),
                'processing_time_seconds' => round($duration, 4)
            ]);

            return response()->json([
                'success' => true,
                'message' => $aiResponse['message'],
                'suggestion' => $aiResponse['suggestion'] ?? null,
                'provider' => $aiResponse['provider'] ?? 'default',
                'model' => $aiResponse['model'] ?? 'default',
                'usage' => $aiResponse['usage'] ?? null,
                'timestamp' => now()->toISOString(),
                'server_processing_time' => round($duration, 4)
            ]);
        } catch (\Exception $e) {
            Log::error('AI Chat Processing Error', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Suggest fields for publication or campaign
     */
    public function suggestFields(Request $request)
    {
        $request->validate([
            'fields' => 'required|array',
            'type' => 'required|string|in:publication,campaign',
            'language' => 'nullable|string',
            'field_limits' => 'nullable|array'
        ]);

        try {
            /** @var User $user */
            $user = Auth::user();
            $language = $request->input('language', $user->locale ?? 'es');

            // Check if AI is enabled at all
            if (!$this->aiService->isAiEnabled($user)) {
                return response()->json([
                    'success' => false,
                    'message' => $language === 'es' ? 'El servicio de IA no está configurado o habilitado.' : 'AI service is not configured or enabled.'
                ], 403);
            }

            $aiResponse = $this->aiService->generateFieldSuggestions(
                $request->input('fields'),
                $request->input('type'),
                $language,
                $user,
                $request->input('field_limits')
            );

            Log::info('AI Field Suggestion Response', [
                'user_id' => $user->id,
                'type' => $request->input('type'),
                'response' => $aiResponse
            ]);

            return response()->json([
                'success' => true,
                'data' => $aiResponse['suggestion']['data'] ?? null,
                'message' => $aiResponse['message'] ?? ''
            ]);
        } catch (\Exception $e) {
            Log::error('AI Field Suggestion Error', [
                'user_id' => Auth::id(),
                'type' => $request->input('type'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $errorMessage = $e->getMessage();
            
            // Provide user-friendly error messages
            if (strpos($errorMessage, 'does not contain valid suggestion data') !== false) {
                $errorMessage = $language === 'es' 
                    ? 'La IA no pudo generar sugerencias válidas. Por favor, intenta de nuevo con un prompt más específico.'
                    : 'AI could not generate valid suggestions. Please try again with a more specific prompt.';
            } elseif (strpos($errorMessage, 'empty suggestion data') !== false) {
                $errorMessage = $language === 'es'
                    ? 'La IA devolvió datos vacíos. Por favor, intenta de nuevo.'
                    : 'AI returned empty data. Please try again.';
            }

            return response()->json([
                'success' => false,
                'message' => $errorMessage
            ], 500);
        }
    }

    /**
     * Update user AI settings
     */
    public function updateAiSettings(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
            'validate' => 'nullable|boolean'
        ]);

        try {
            /** @var User $user */
            $user = Auth::user();
            $settings = $request->input('settings');

            // Optional: validate API keys if requested
            if ($request->input('validate', false)) {
                foreach ($settings as $provider => $config) {
                    if (!empty($config['api_key']) && ($config['enabled'] ?? false)) {
                        $isValid = $this->aiService->validateApiKey($provider, $config['api_key']);
                        if (!$isValid) {
                            return response()->json([
                                'success' => false,
                                'message' => "Invalid API key for {$provider}"
                            ], 422);
                        }
                    }
                }
            }

            $user->ai_settings = $settings;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'AI settings updated successfully',
                'settings' => $user->ai_settings
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update AI settings', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save settings'
            ], 500);
        }
    }

    /**
     * Get user's campaigns for context
     */
    public function getCampaigns()
    {
        try {
            $campaigns = Campaign::where('workspace_id', Auth::user()->current_workspace_id)
                ->select('id', 'name as title', 'description', 'status', 'start_date', 'end_date')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'campaigns' => $campaigns,
                'count' => $campaigns->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch campaigns', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load campaigns'
            ], 500);
        }
    }

    /**
     * Get available AI models and providers
     */
    public function getAvailableModels()
    {
        try {
            $user = Auth::user();
            $models = $this->aiService->getAvailableModels($user);

            return response()->json([
                'success' => true,
                'models' => $models,
                'default_provider' => config('services.deepseek.enabled') ? 'deepseek' : (config('services.gemini.enabled') ? 'gemini' : (config('services.openai.enabled') ? 'openai' : (config('services.anthropic.enabled') ? 'anthropic' : null)))
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get available models', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load AI models'
            ], 500);
        }
    }

    /**
     * Validate API key for a provider
     */
    public function validateApiKey(Request $request)
    {
        $request->validate([
            'provider' => 'required|string|in:deepseek,gemini,openai,anthropic',
            'api_key' => 'required|string'
        ]);

        try {
            $isValid = $this->aiService->validateApiKey(
                $request->input('provider'),
                $request->input('api_key')
            );

            return response()->json([
                'success' => true,
                'valid' => $isValid,
                'message' => $isValid ? 'API key is valid' : 'API key is invalid'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Validation failed: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get AI service statistics
     */
    public function getStats()
    {
        try {
            $stats = $this->aiService->getProviderStats(Auth::user());

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'total_requests' => array_sum(array_column($stats, 'requests'))
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get AI stats', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load statistics'
            ], 500);
        }
    }
}

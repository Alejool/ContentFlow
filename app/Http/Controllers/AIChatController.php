<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\AIService;


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
            $aiResponse = $this->aiService->chat($context, $provider);
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
                'message' => 'An error occurred while processing your message. Please try again.',
                'error' => app()->environment('local') ? $e->getMessage() : null
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
            $models = $this->aiService->getAvailableModels();

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
            $stats = $this->aiService->getProviderStats();

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

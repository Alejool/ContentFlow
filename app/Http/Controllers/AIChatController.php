<?php

namespace App\Http\Controllers;

use App\Models\Ai;
use App\Models\Campaigns\Campaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AIChatController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('AIChat/Index', []);
    }

    /**
     * Processes a chat message and returns the AI's response
     */
    public function processMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'context' => 'nullable|array',
        ]);

        try {
            $campaigns = $request->input('context.campaigns', []);
            if (empty($campaigns)) {
                $campaigns = Campaign::where('user_id', Auth::id())
                    ->select('id', 'name', 'description', 'status', 'start_date', 'end_date')
                    ->get()
                    ->toArray();
            }

            // Prepare context for the AI
            $context = [
                'user' => Auth::user()->name,
                'project_type' => 'social_media_management',
                'campaigns' => $campaigns,
                'message' => $request->input('message'),
            ];

     
            $aiResponse = $this->getAIResponse($context);

            return response()->json([
                'success' => true,
                'message' => $aiResponse['message'],
                'suggestion' => $aiResponse['suggestion'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in AI Chat: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your message.',
            ], 500);
        }
    }

    /**
     * Gets the user's campaigns for context
     */
    public function getCampaigns()
    {
        $campaigns = Campaign::where('user_id', Auth::id())
            ->select('id', 'name', 'description', 'status', 'start_date', 'end_date')
            ->get();

        return response()->json([
            'success' => true,
            'campaigns' => $campaigns,
        ]);
    }

    /**
     * Method to get AI response (simulated)
     * In production, you would implement the call to your AI API here
     */
    private function getAIResponse($context)
    {
        // Determine which AI service to use based on configuration
            // Check environment variables and log their values
            $geminiEnabled = config('services.gemini.enabled');
            $openaiEnabled = config('services.openai.enabled');
            
            // Log the configuration status
            Log::debug('AI Services Status', [
                'gemini' => $geminiEnabled ? 'enabled' : 'disabled',
                'openai' => $openaiEnabled ? 'enabled' : 'disabled',
                'env' => app()->environment()
            ]);

            if ($geminiEnabled) {
                return $this->getGeminiResponse($context);
            } elseif ($openaiEnabled) {
            return $this->getOpenAIResponse($context);
        }
        // If no service is enabled, use default response
        return $this->getDefaultResponse($context['message']);
    }
    
    private function getOpenAIResponse($context)
    {
        try {
            $apiKey = config('services.openai.api_key');
            
            if (!$apiKey) {
                throw new \Exception('OpenAI API key not configured');
            }
    
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => config('services.openai.model', 'gpt-3.5-turbo'),
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a social media campaign assistant.'
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode($context)
                    ]
                ],
                'temperature' => config('services.openai.temperature', 0.7),
            ]);
    
            return [
                'message' => $response['choices'][0]['message']['content'] ?? 'No response from AI',
                'suggestion' => null
            ];
        } catch (\Exception $e) {
            Log::error('OpenAI API Error: ' . $e->getMessage());
            return $this->getDefaultResponse($context['message']);
        }
    }
    
    private function getGeminiResponse($context)
    {
        try {
            $apiKey = config('services.gemini.api_key');
            
            if (!$apiKey) {
                throw new \Exception('Gemini API key not configured');
            }
    
            $response = Http::withoutVerifying() 
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => json_encode($context)]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'maxOutputTokens' => 100, // Approximately 10 words
                        'temperature' => 0.1, // Lower temperature for more focused responses
                        'topP' => 0.2, // More deterministic output
                        'topK' => 1 // Reduced for more concise responses
                    ]
                ]);
    
            return [
                'message' => $response['candidates'][0]['content']['parts'][0]['text'] ?? 'No response from AI',
                'suggestion' => null
            ];
        } catch (\Exception $e) {
            Log::error('Gemini API Error: ' . $e->getMessage());
            return $this->getDefaultResponse($context['message']);
        }
    }

    private function getDefaultResponse($userMessage)
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
                ]
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
                ]
            ];
        } else {
            return [
                'message' => 'I am here to help you with your social media campaigns. You can ask me about creating new campaigns, improving existing ones, or analyzing your content performance.'
            ];
        }
    }
}

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
     * Procesa un mensaje del chat y devuelve la respuesta de la IA
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

            // Preparar el contexto para la IA
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
            Log::error('Error en AI Chat: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error al procesar tu mensaje.',
            ], 500);
        }
    }

    /**
     * Obtiene las campañas del usuario para el contexto
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
     * Método para obtener respuesta de la IA (simulado)
     * En producción, aquí implementarías la llamada a tu API de IA
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
        // Si ningún servicio está habilitado, usar respuesta por defecto
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
                        'maxOutputTokens' => 50, // Approximately 10 words
                        'temperature' => 0.1, // Lower temperature for more focused responses
                        'topP' => 0.5, // More deterministic output
                        'topK' => 20 // Reduced for more concise responses
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
        
        if (strpos($userMessage, 'nueva campaña') !== false) {
            return [
                'message' => 'Basado en tus campañas anteriores, te recomendaría crear una campaña enfocada en engagement para Instagram con publicaciones semanales. ¿Te gustaría que te ayude a estructurarla?',
                'suggestion' => [
                    'type' => 'new_campaign',
                    'data' => [
                        'name' => 'Campaña de Engagement Instagram',
                        'platform' => 'Instagram',
                        'frequency' => 'weekly',
                        'goal' => 'increase_engagement'
                    ]
                ]
            ];
        } elseif (strpos($userMessage, 'mejorar') !== false) {
            return [
                'message' => 'He analizado tus campañas actuales y veo oportunidades de mejora en la frecuencia de publicación y el uso de hashtags. ¿Quieres que te proporcione recomendaciones específicas?',
                'suggestion' => [
                    'type' => 'improvement',
                    'data' => [
                        'campaign_id' => 1,
                        'improvements' => [
                            'hashtags' => ['#ContentStrategy', '#SocialGrowth', '#DigitalMarketing'],
                            'posting_frequency' => 'Aumentar a 3 veces por semana',
                            'best_times' => ['Lunes 10am', 'Miércoles 2pm', 'Viernes 6pm']
                        ]
                    ]
                ]
            ];
        } else {
            return [
                'message' => 'Estoy aquí para ayudarte con tus campañas de redes sociales. Puedes preguntarme sobre cómo crear nuevas campañas, mejorar las existentes o analizar el rendimiento de tu contenido.'
            ];
        }
    }
}

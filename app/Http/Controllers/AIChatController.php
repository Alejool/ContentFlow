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
            // Obtener campañas del usuario si no se proporcionaron en el contexto
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

            // Aquí implementarías la llamada a tu servicio de IA
            // Este es un ejemplo simplificado
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
        // Ejemplo simplificado - en producción conectarías con OpenAI, Azure, etc.
        $userMessage = strtolower($context['message']);
        
        // Simulación de respuestas basadas en palabras clave
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
                        'campaign_id' => 1, // En producción, identificarías la campaña relevante
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

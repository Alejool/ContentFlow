<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlatformConfiguration\AvailablePlatformsRequest;
use App\Http\Requests\PlatformConfiguration\ValidateContentRequest;
use App\Services\PlatformConfigurationService;
use App\Services\ContentValidator;
use App\Models\Publications\Publication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API Controller para Configuración de Plataformas (Fase 5)
 * 
 * Proporciona endpoints para que el frontend acceda a:
 * - Configuración de plataformas
 * - Validación de contenido
 * - Capacidades de usuario
 * - Feature flags
 * 
 * Endpoints:
 * - GET /api/platform-configuration/platforms
 * - GET /api/platform-configuration/platforms/{key}
 * - GET /api/platform-configuration/content-types
 * - GET /api/platform-configuration/validate-content
 * - GET /api/platform-configuration/capabilities/{plan}
 */
class PlatformConfigurationController extends Controller
{
    public function __construct(
        private PlatformConfigurationService $configService,
        private ContentValidator $contentValidator,
    ) {}

    /**
     * GET /api/platform-configuration/platforms
     * Obtiene todas las plataformas disponibles
     */
    public function getPlatforms(): JsonResponse
    {
        $platforms = $this->configService->getPlatforms();
        $active = $this->configService->getActivePlatforms();

        return response()->json([
            'success' => true,
            'platforms' => $platforms,
            'active_platforms' => $active,
            'total' => count($platforms),
            'active_count' => count($active),
        ]);
    }

    /**
     * GET /api/platform-configuration/platforms/{key}
     * Obtiene información completa de una plataforma
     */
    public function getPlatform(string $key): JsonResponse
    {
        $platform = $this->configService->getPlatform($key);

        if (!$platform) {
            return response()->json([
                'success' => false,
                'error' => "Platform '{$key}' not found",
            ], 404);
        }

        $complete = $this->configService->getPlatformComplete($key);

        return response()->json([
            'success' => true,
            'platform' => $complete,
        ]);
    }

    /**
     * GET /api/platform-configuration/content-types
     * Obtiene todos los tipos de contenido
     */
    public function getContentTypes(Request $request): JsonResponse
    {
        $contentTypes = $this->configService->getContentTypes();

        // Filtrar por plataforma si se proporciona
        if ($request->has('platform')) {
            $platform = $request->get('platform');
            $contentTypes = $this->configService->getContentTypesForPlatform($platform);
        }

        return response()->json([
            'success' => true,
            'content_types' => $contentTypes,
            'count' => count($contentTypes),
        ]);
    }

    /**
     * GET /api/platform-configuration/media-specs/{platform}
     * Obtiene especificaciones de medios para una plataforma
     */
    public function getMediaSpecs(string $platform): JsonResponse
    {
        $specs = $this->configService->getMediaSpecs($platform);

        if (!$specs) {
            return response()->json([
                'success' => false,
                'error' => "Media specs not found for platform '{$platform}'",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'platform' => $platform,
            'media_specs' => $specs,
        ]);
    }

    /**
     * GET /api/platform-configuration/publishing-rules/{platform}
     * Obtiene reglas de publicación de una plataforma
     */
    public function getPublishingRules(string $platform): JsonResponse
    {
        $rules = $this->configService->getPublishingRules($platform);

        if (!$rules) {
            return response()->json([
                'success' => false,
                'error' => "Publishing rules not found for platform '{$platform}'",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'platform' => $platform,
            'rules' => $rules,
        ]);
    }

    /**
     * GET /api/platform-configuration/capabilities/{plan}
     * Obtiene capacidades de un plan de suscripción
     */
    public function getCapabilities(string $plan): JsonResponse
    {
        $capabilities = $this->configService->getCapabilities($plan);

        if (!$capabilities) {
            return response()->json([
                'success' => false,
                'error' => "Plan '{$plan}' not found",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'plan' => $plan,
            'capabilities' => $capabilities,
        ]);
    }

    /**
     * GET /api/platform-configuration/capabilities/{plan}/{platform}
     * Obtiene capacidades de un plan para una plataforma específica
     */
    public function getPlatformCapabilities(string $plan, string $platform): JsonResponse
    {
        $capabilities = $this->configService->getCapabilities($plan, $platform);

        if (!$capabilities) {
            return response()->json([
                'success' => false,
                'error' => "Capabilities not found for plan '{$plan}' and platform '{$platform}'",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'plan' => $plan,
            'platform' => $platform,
            'capabilities' => $capabilities,
        ]);
    }

    /**
     * GET /api/platform-configuration/api-limits/{platform}
     * Obtiene límites de API para una plataforma
     */
    public function getAPILimits(string $platform): JsonResponse
    {
        $limits = $this->configService->getAPILimits($platform);

        if (!$limits) {
            return response()->json([
                'success' => false,
                'error' => "API limits not found for platform '{$platform}'",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'platform' => $platform,
            'api_limits' => $limits,
        ]);
    }

    /**
     * GET /api/platform-configuration/feature-flags/{platform}
     * Obtiene feature flags de una plataforma
     */
    public function getFeatureFlags(string $platform): JsonResponse
    {
        $flags = $this->configService->getFeatureFlags($platform);

        if (!$flags) {
            return response()->json([
                'success' => false,
                'error' => "Feature flags not found for platform '{$platform}'",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'platform' => $platform,
            'feature_flags' => $flags,
        ]);
    }

    /**
     * GET /api/platform-configuration/available-platforms-for-content
     * Obtiene plataformas disponibles para un tipo de contenido y plan
     * 
     * Query params:
     * - content_type: string (requerido)
     * - user_plan: string (default: 'free')
     */
    public function getAvailablePlatformsForContent(AvailablePlatformsRequest $request): JsonResponse
    {

        $contentType = $request->get('content_type');
        $userPlan = $request->get('user_plan', 'free');

        $platforms = $this->configService->getPlatformsForContentType($contentType);
        
        if (empty($platforms)) {
            return response()->json([
                'success' => false,
                'error' => "Content type '{$contentType}' not found",
            ], 404);
        }

        // Filtrar según capacidades del plan
        $availablePlatforms = [];
        foreach ($platforms as $platformKey) {
            $capabilities = $this->configService->getCapabilities($userPlan, $platformKey);
            if ($capabilities && ($capabilities['can_publish'] ?? false)) {
                $availablePlatforms[] = [
                    'key' => $platformKey,
                    'platform' => $this->configService->getPlatform($platformKey),
                    'capabilities' => $capabilities,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'content_type' => $contentType,
            'user_plan' => $userPlan,
            'available_platforms' => $availablePlatforms,
            'count' => count($availablePlatforms),
        ]);
    }

    /**
     * POST /api/platform-configuration/validate-content
     * Valida contenido contra plataformas seleccionadas
     * 
     * Request body:
     * {
     *   "publication_id": 1,
     *   "platforms": ["facebook", "instagram"],
     *   "user_plan": "pro"
     * }
     */
    public function validateContent(ValidateContentRequest $request): JsonResponse
    {

        $publication = Publication::findOrFail($request->get('publication_id'));
        $platforms = $request->get('platforms');
        $userPlan = $request->get('user_plan', auth()->user()->plan ?? 'free');

        // Validar contenido
        $validationResult = $this->contentValidator->validate(
            $publication,
            $platforms,
            $userPlan
        );

        // Obtener resumen
        $summary = $this->contentValidator->getSummary($validationResult);

        return response()->json([
            'success' => true,
            'publication_id' => $publication->id,
            'can_publish_to_any' => $summary['can_publish_to_any'],
            'compatible_count' => $summary['compatible_count'],
            'incompatible_count' => $summary['incompatible_count'],
            'compatible_platforms' => $summary['compatible_platforms'],
            'incompatible_platforms' => $summary['incompatible_platforms'],
            'warnings' => $summary['warnings'],
            'details' => $validationResult,
        ]);
    }

    /**
     * GET /api/platform-configuration/statistics
     * Obtiene estadísticas de configuración
     */
    public function getStatistics(): JsonResponse
    {
        $stats = $this->configService->getConfigurationStats();

        return response()->json([
            'success' => true,
            'statistics' => $stats,
        ]);
    }
}

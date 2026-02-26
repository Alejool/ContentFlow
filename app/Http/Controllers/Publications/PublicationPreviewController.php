<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Publications\Publication;
use App\Services\Publish\PreviewService;
use App\Services\Publish\AutoConfigurationService;
use Illuminate\Support\Facades\Log;

class PublicationPreviewController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PreviewService $previewService,
        protected AutoConfigurationService $autoConfigService
    ) {}

    /**
     * Genera la previsualización de una publicación
     */
    public function preview(Request $request, Publication $publication)
    {
        $request->validate([
            'platform_ids' => 'required|array',
            'platform_ids.*' => 'integer|exists:social_accounts,id',
            'auto_optimize' => 'boolean',
        ]);

        try {
            $preview = $this->previewService->generatePreview(
                $publication,
                $request->input('platform_ids'),
                $request->input('auto_optimize', false)
            );

            return $this->successResponse($preview->toArray());
        } catch (\Exception $e) {
            Log::error('Failed to generate preview', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->errorResponse(
                'Error al generar la previsualización: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Actualiza la configuración de una plataforma específica
     */
    public function updatePlatformConfig(Request $request, Publication $publication, int $accountId)
    {
        $request->validate([
            'type' => 'required|string|in:feed,reel,story,short,standard,video,tweet,post',
            'custom_settings' => 'array',
        ]);

        try {
            $config = $this->previewService->updatePlatformConfiguration(
                $publication,
                $accountId,
                $request->input('type'),
                $request->input('custom_settings', [])
            );

            return $this->successResponse($config->toArray());
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            Log::error('Failed to update platform configuration', [
                'publication_id' => $publication->id,
                'account_id' => $accountId,
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse(
                'Error al actualizar la configuración: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Aplica optimización automática a todas las plataformas
     */
    public function autoOptimize(Request $request, Publication $publication)
    {
        $request->validate([
            'platform_ids' => 'required|array',
            'platform_ids.*' => 'integer|exists:social_accounts,id',
        ]);

        try {
            $preview = $this->previewService->generatePreview(
                $publication,
                $request->input('platform_ids'),
                true // auto_optimize = true
            );

            return $this->successResponse([
                'message' => __('messages.publication.config_optimized'),
                'preview' => $preview->toArray()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to auto-optimize', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse(
                'Error al optimizar automáticamente: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Obtiene las configuraciones guardadas de una publicación
     */
    public function getSavedConfigurations(Publication $publication)
    {
        try {
            $platformSettings = $publication->platform_settings ?? [];

            return $this->successResponse([
                'platform_settings' => $platformSettings
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get saved configurations', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse(
                'Error al obtener configuraciones: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Genera miniatura personalizada para una plataforma
     */
    public function generateThumbnail(Request $request, Publication $publication)
    {
        $request->validate([
            'platform' => 'required|string',
            'timestamp' => 'numeric|min:0', // Segundo del video para extraer
        ]);

        try {
            // TODO: Implementar generación de miniatura personalizada
            // Por ahora, retornar la miniatura principal

            $mediaFile = $publication->mediaFiles->first();
            
            if (!$mediaFile) {
                return $this->errorResponse('No hay archivos multimedia', 404);
            }

            return $this->successResponse([
                'thumbnail_url' => $mediaFile->thumbnail_path 
                    ? \Storage::url($mediaFile->thumbnail_path)
                    : null
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate thumbnail', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage()
            ]);

            return $this->errorResponse(
                'Error al generar miniatura: ' . $e->getMessage(),
                500
            );
        }
    }
}

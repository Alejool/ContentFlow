<?php

namespace App\Http\Requests\Publications;

use App\Services\PlatformConfigurationService;
use App\Services\ContentValidator;
use App\Models\Publications\Publication;
use Illuminate\Foundation\Http\FormRequest;

/**
 * INTEGRACIÓN: Validador de publicaciones usando configuración centralizada
 * 
 * Reemplaza lógica hardcodeada con validación del sistema de configuración.
 * Integra ContentValidator y PlatformConfigurationService.
 */
class ValidatePublicationForPlatformsRequest extends FormRequest
{
    private PlatformConfigurationService $configService;
    private ContentValidator $validator;

    public function authorize(): bool
    {
        return $this->user()->can('manage-content', $this->user()->current_workspace_id);
    }

    public function rules(): array
    {
        return [
            'content_type' => 'required|in:post,reel,story,poll,carousel,community,thread',
            'social_account_ids' => 'required|array|min:1',
            'social_account_ids.*' => 'integer|exists:social_accounts,id',
            'publication_id' => 'nullable|integer|exists:publications,id',
        ];
    }

    /**
     * Validación personalizada usando configuración centralizada
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $this->configService = app(PlatformConfigurationService::class);
            $this->validator = app(ContentValidator::class);

            $contentType = $this->input('content_type');
            $publication = null;

            // Si es edición, obtener la publicación actual
            if ($this->input('publication_id')) {
                $publication = Publication::find($this->input('publication_id'));
                
                // Validar que no cambien el tipo de contenido si está publicado
                if ($publication && $publication->isPublishedOrScheduled()) {
                    if ($contentType !== $publication->content_type) {
                        $validator->errors()->add(
                            'content_type',
                            'No puedes cambiar el tipo de contenido de una publicación que ya está publicada o agendada.'
                        );
                        return;
                    }
                }
            }

            // Obtener plataformas de las cuentas seleccionadas
            $platforms = \App\Models\Social\SocialAccount::whereIn(
                'id',
                $this->input('social_account_ids', [])
            )->pluck('platform')->unique()->toArray();

            // Validar que cada plataforma soporte el tipo de contenido
            $incompatiblePlatforms = [];
            foreach ($platforms as $platform) {
                $platformValidation = $this->validator->validateForPlatform(
                    $platform,
                    $contentType,
                    $platforms
                );

                if (!$platformValidation['compatible']) {
                    $incompatiblePlatforms[$platform] = $platformValidation['reason'] ?? 'No soportado';
                }
            }

            // Agregar errores si hay plataformas incompatibles
            if (!empty($incompatiblePlatforms)) {
                foreach ($incompatiblePlatforms as $platform => $reason) {
                    $validator->errors()->add(
                        "platform.{$platform}",
                        "La plataforma {$platform} no soporta el tipo de contenido '{$contentType}': {$reason}"
                    );
                }
            }

            // Validar capacidades del usuario por plan
            $userPlan = auth()->user()->getActivePlan();
            foreach ($platforms as $platform) {
                if (!$this->configService->hasCapability($userPlan, $platform, 'can_publish')) {
                    $validator->errors()->add(
                        "plan.{$platform}",
                        "Tu plan actual no permite publicar en {$platform}. Actualiza para acceder."
                    );
                }
            }
        });
    }
}

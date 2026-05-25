<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Http\Requests\Publications\ValidatePublicationForPlatformsRequest;
use App\Actions\Publications\GetPublicationPlatformValidationAction;
use App\Models\Publications\Publication;
use Illuminate\Http\JsonResponse;

/**
 * INTEGRACIÓN: Controller para validación de plataformas en publicaciones
 * 
 * Proporciona endpoints para validar qué plataformas soportan un tipo de contenido
 * antes de crear o editar una publicación.
 */
class PublicationPlatformValidationController extends Controller
{
    private GetPublicationPlatformValidationAction $validationAction;

    public function __construct(GetPublicationPlatformValidationAction $validationAction)
    {
        $this->middleware('auth');
        $this->validationAction = $validationAction;
    }

    /**
     * POST /api/publications/validate-platforms
     * 
     * Valida qué plataformas soportan un tipo de contenido específico
     */
    public function validate(ValidatePublicationForPlatformsRequest $request): JsonResponse
    {
        $publication = null;
        if ($request->input('publication_id')) {
            $publication = Publication::find($request->input('publication_id'));
            $this->authorize('update', $publication);
        }

        $validation = $this->validationAction->execute(
            publication: $publication,
            contentType: $request->input('content_type'),
            socialAccountIds: $request->input('social_account_ids', [])
        );

        return response()->json([
            'success' => true,
            'data' => $validation,
        ]);
    }

    /**
     * GET /api/publications/{publication}/platform-validation
     * 
     * Obtiene validación para una publicación existente
     */
    public function showForPublication(Publication $publication): JsonResponse
    {
        $this->authorize('view', $publication);

        // Obtener cuentas actualmente vinculadas
        $socialAccountIds = $publication->socialPostLogs()
            ->distinct()
            ->pluck('social_account_id')
            ->toArray();

        $validation = $this->validationAction->execute(
            publication: $publication,
            contentType: $publication->content_type,
            socialAccountIds: $socialAccountIds
        );

        return response()->json([
            'success' => true,
            'data' => $validation,
        ]);
    }

    /**
     * GET /api/publications/content-type/{contentType}/compatible-platforms
     * 
     * Obtiene plataformas compatibles con un tipo de contenido
     */
    public function getCompatiblePlatforms(string $contentType): JsonResponse
    {
        $user = auth()->user();
        $userPlan = $user->getActivePlan() ?? 'free';

        // Obtener todas las cuentas del usuario
        $socialAccounts = \App\Models\Social\SocialAccount::where(
            'workspace_id',
            $user->current_workspace_id
        )->get();

        $platforms = $socialAccounts->pluck('platform')->unique()->toArray();

        $validation = $this->validationAction->execute(
            publication: null,
            contentType: $contentType,
            socialAccountIds: $socialAccounts->pluck('id')->toArray()
        );

        return response()->json([
            'success' => true,
            'content_type' => $contentType,
            'user_plan' => $userPlan,
            'compatible_platforms' => $validation['compatible_platforms'],
            'incompatible_platforms' => $validation['incompatible_platforms'],
            'platforms' => $validation['platforms'],
        ]);
    }
}

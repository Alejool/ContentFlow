<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Models\Workspace\Workspace;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiTokenController extends Controller
{
  use ApiResponse;

  /**
   * List tokens for a workspace.
   *
   * Returns all tokens, distinguishing between:
   *  - Dashboard tokens  (created via UI): no expiry, live until manually revoked.
   *  - Programmatic tokens (created via API): named 'api-access:...' or 'api-refresh:...', expire in 24h/30d.
   */
  public function index(Workspace $workspace)
  {
    if (Auth::id() !== $workspace->created_by) {
      abort(403);
    }

    if ($workspace->getPlanName() !== 'enterprise') {
      return $this->errorResponse('API access is only available for Enterprise plans.', 403);
    }

    $tokens = $workspace->tokens()->orderBy('created_at', 'desc')->get()->map(function ($token) {
      // Determine token origin so the UI can label them
      $isProgrammatic = str_starts_with($token->name, 'api-access:')
        || str_starts_with($token->name, 'api-refresh:');

      return array_merge($token->toArray(), [
        'token_type'  => $isProgrammatic ? 'programmatic' : 'dashboard',
        'never_expires' => is_null($token->expires_at) && !$isProgrammatic,
      ]);
    });

    return $this->successResponse(['tokens' => $tokens]);
  }

  /**
   * Create a new DASHBOARD token for a workspace.
   *
   * These tokens have NO expiry — they are permanent until the user explicitly
   * revokes them from the dashboard. This is intentional: dashboard tokens are
   * meant for long-lived integrations where the user manages the lifecycle manually.
   *
   * For programmatic short-lived tokens with automatic refresh, use:
   *   POST /api/auth/token  (via ApiAuthController)
   */
  public function store(Request $request, Workspace $workspace)
  {
    if (Auth::id() !== $workspace->created_by) {
      abort(403);
    }

    if ($workspace->getPlanName() !== 'enterprise') {
      return $this->errorResponse('API access is only available for Enterprise plans.', 403);
    }

    $request->validate([
      'name' => 'required|string|max:255',
    ]);

    // Create token WITHOUT an expiry date — it lives until the user revokes it.
    // Sanctum's createToken() with null expiration = no expiry.
    $token = $workspace->createToken(
      $request->name,
      ['*'],    // full abilities (all scopes)
      null      // expires_at = null → never expires
    );

    return $this->successResponse([
      'token'       => $token->plainTextToken,
      'name'        => $request->name,
      'token_type'  => 'dashboard',
      'never_expires' => true,
      'expires_at'  => null,
    ], 'API token created successfully. This token will NOT expire — it is valid until you revoke it.', 201);
  }

  /**
   * Revoke a token.
   */
  public function destroy(Workspace $workspace, $token)
  {
    if (Auth::id() !== $workspace->created_by) {
      abort(403);
    }

    $tokenInstance = $workspace->tokens()->findOrFail($token);
    $tokenInstance->delete();

    return $this->successResponse(null, 'API token revoked successfully.');
  }

  /**
   * Download API documentation files (Enterprise only).
   * Supports: ?type=markdown or ?type=openapi
   */
  public function downloadDocs(Request $request, Workspace $workspace)
  {
    if (Auth::id() !== $workspace->created_by) {
      abort(403);
    }

    if ($workspace->getPlanName() !== 'enterprise') {
      return $this->errorResponse('API documentation download is only available for Enterprise plans.', 403);
    }

    $type = $request->query('type', 'markdown');

    if ($type === 'openapi') {
      $filePath = base_path('docs/api/api_definition.json');
      $fileName = 'contentflow_API_OpenAPI.json';
      $mimeType = 'application/json';
    } else {
      $filePath = base_path('docs/api/API_ENTERPRISE_V1.md');
      $fileName = 'contentflow_API_Enterprise_Guide.md';
      $mimeType = 'text/markdown';
    }

    if (!file_exists($filePath)) {
      return $this->errorResponse('Documentation file not found.', 404);
    }

    return response()->download($filePath, $fileName, [
      'Content-Type' => $mimeType,
    ]);
  }
}

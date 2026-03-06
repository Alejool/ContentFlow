<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

/**
 * ApiAuthController — Token generation & refresh for Enterprise API access.
 *
 * Used to obtain short-lived access tokens and long-lived refresh tokens
 * so external systems can authenticate programmatically via email + password.
 *
 * Plan validation:
 *  - Only workspace owners with an active Enterprise plan may obtain tokens.
 *  - Any attempt by Free / Starter / Professional plan owners returns 403.
 */
class ApiAuthController extends Controller
{
  use ApiResponse;

  /** Access token lifetime in minutes (24 hours) */
  const ACCESS_TOKEN_TTL = 60 * 24;

  /** Refresh token lifetime in minutes (30 days) */
  const REFRESH_TOKEN_TTL = 60 * 24 * 30;

  /**
   * Generate an access token + refresh token for a workspace owner.
   *
   * POST /api/v1/auth/token
   *
   * Body:
   *   email         string  required — Workspace owner's email
   *   password      string  required — Workspace owner's password
   *   workspace     string  required — Workspace ID or slug
   *
   * Returns:
   *   access_token  string  — Short-lived token (24h). Use in Authorization: Bearer header.
   *   refresh_token string  — Long-lived token (30 days). Use to request new access tokens.
   *   token_type    string  — Always "Bearer"
   *   expires_in    int     — Access token TTL in seconds
   *   workspace     object  — Workspace info
   *   user          object  — Authenticated user info
   */
  public function generateToken(Request $request)
  {
    $request->validate([
      'email'     => 'required|email',
      'password'  => 'required|string',
      'workspace' => 'required|string',
    ]);

    // 1 — Authenticate user credentials
    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
      return $this->errorResponse('Invalid credentials. Please check your email and password.', 401);
    }

    // 2 — Find the workspace (by ID or slug)
    $workspace = Workspace::where(function ($q) use ($request) {
      if (is_numeric($request->workspace)) {
        $q->where('id', $request->workspace);
      }
      $q->orWhere('slug', $request->workspace);
    })->first();

    if (!$workspace) {
      return $this->errorResponse('Workspace not found.', 404);
    }

    // 3 — Verify the user is the workspace owner (creator)
    if ($workspace->created_by !== $user->id) {
      return $this->errorResponse(
        'Only the workspace owner can generate API tokens for this workspace.',
        403
      );
    }

    // 4 — Verify Enterprise plan (only paying Enterprise customers get API access)
    $plan = $workspace->getPlanName();
    $allowedPlans = ['enterprise'];

    if (!in_array($plan, $allowedPlans)) {
      return $this->errorResponse(
        "API access is only available for Enterprise plans. Your current plan is \"{$plan}\". Please upgrade to enable API access.",
        402,
        [
          'current_plan'    => $plan,
          'required_plan'   => 'enterprise',
          'upgrade_url'     => url('/pricing'),
        ]
      );
    }

    // 5 — Revoke old tokens of the same type to avoid orphaned tokens
    // (keep manual-named tokens the user created, only remove programmatic ones)
    $user->tokens()
      ->where('name', 'LIKE', 'api-access:%')
      ->orWhere('name', 'LIKE', 'api-refresh:%')
      ->where('tokenable_id', $user->id)
      ->get()
      ->filter(function ($token) use ($workspace) {
        // Only clean up tokens tagged for THIS workspace
        return str_contains($token->name, ":{$workspace->id}");
      })
      ->each(fn($token) => $token->delete());

    // 6 — Create new access token (24h)
    $accessTokenName = "api-access:{$workspace->id}:" . now()->timestamp;
    $accessTokenResult = $user->createToken(
      $accessTokenName,
      ['*'],
      now()->addMinutes(self::ACCESS_TOKEN_TTL)
    );

    // 7 — Create new refresh token (30 days)
    $refreshTokenName = "api-refresh:{$workspace->id}:" . now()->timestamp;
    $refreshTokenResult = $user->createToken(
      $refreshTokenName,
      ['refresh'],
      now()->addMinutes(self::REFRESH_TOKEN_TTL)
    );

    Log::info('API token generated for workspace owner', [
      'user_id'      => $user->id,
      'workspace_id' => $workspace->id,
      'plan'         => $plan,
    ]);

    return $this->successResponse([
      'access_token'  => $accessTokenResult->plainTextToken,
      'refresh_token' => $refreshTokenResult->plainTextToken,
      'token_type'    => 'Bearer',
      'expires_in'    => self::ACCESS_TOKEN_TTL * 60,
      'refresh_expires_in' => self::REFRESH_TOKEN_TTL * 60,
      'workspace' => [
        'id'   => $workspace->id,
        'name' => $workspace->name,
        'slug' => $workspace->slug,
        'plan' => $plan,
      ],
      'user' => [
        'id'    => $user->id,
        'name'  => $user->name,
        'email' => $user->email,
      ],
    ], 'API tokens generated successfully. Store your refresh token securely.', 201);
  }

  /**
   * Refresh an access token using a valid refresh token.
   *
   * POST /api/v1/auth/token/refresh
   *
   * Body:
   *   refresh_token  string  required — The refresh token obtained from /auth/token
   *   workspace      string  required — Workspace ID or slug
   *
   * Returns a new access_token and a new refresh_token (rotation).
   */
  public function refreshToken(Request $request)
  {
    $request->validate([
      'refresh_token' => 'required|string',
      'workspace'     => 'required|string',
    ]);

    // 1 — Parse the refresh token from the Sanctum formatted string (id|token)
    $parts = explode('|', $request->refresh_token, 2);
    if (count($parts) !== 2) {
      return $this->errorResponse('Invalid refresh token format.', 401);
    }

    [$tokenId, $plainToken] = $parts;

    // 2 — Find the token record in the database
    $tokenModel = \Laravel\Sanctum\PersonalAccessToken::find($tokenId);

    if (!$tokenModel) {
      return $this->errorResponse('Refresh token not found or already revoked.', 401);
    }

    // 3 — Verify it's a refresh token (not an access token)
    if (!str_starts_with($tokenModel->name, 'api-refresh:')) {
      return $this->errorResponse('The provided token is not a refresh token.', 401);
    }

    // 4 — Verify the token hash
    if (!Hash::check($plainToken, $tokenModel->token)) {
      return $this->errorResponse('Invalid refresh token.', 401);
    }

    // 5 — Check expiry
    if ($tokenModel->expires_at && $tokenModel->expires_at->isPast()) {
      $tokenModel->delete();
      return $this->errorResponse('Refresh token has expired. Please authenticate again.', 401);
    }

        // 6 — Find the associated user
    /** @var User $user */
    $user = $tokenModel->tokenable;

    if (!$user) {
      return $this->errorResponse('User not found.', 401);
    }

    // 7 — Find and validate the workspace
    $workspace = Workspace::where(function ($q) use ($request) {
      if (is_numeric($request->workspace)) {
        $q->where('id', $request->workspace);
      }
      $q->orWhere('slug', $request->workspace);
    })->first();

    if (!$workspace || $workspace->created_by !== $user->id) {
      return $this->errorResponse('This refresh token is not valid for the specified workspace.', 403);
    }

    // 8 — Re-validate plan (in case it changed since token was issued)
    $plan = $workspace->getPlanName();
    if (!in_array($plan, ['enterprise'])) {
      $tokenModel->delete();
      return $this->errorResponse(
        "Your workspace plan has changed to \"{$plan}\". API access requires an Enterprise plan.",
        402,
        ['current_plan' => $plan, 'upgrade_url' => url('/pricing')]
      );
    }

    // 9 — Rotate: delete old refresh token, issue new pair
    $tokenModel->delete();

    $now = now()->timestamp;
    $newAccessToken = $user->createToken(
      "api-access:{$workspace->id}:{$now}",
      ['*'],
      now()->addMinutes(self::ACCESS_TOKEN_TTL)
    );

    $newRefreshToken = $user->createToken(
      "api-refresh:{$workspace->id}:{$now}",
      ['refresh'],
      now()->addMinutes(self::REFRESH_TOKEN_TTL)
    );

    Log::info('API token refreshed for workspace owner', [
      'user_id'      => $user->id,
      'workspace_id' => $workspace->id,
    ]);

    return $this->successResponse([
      'access_token'       => $newAccessToken->plainTextToken,
      'refresh_token'      => $newRefreshToken->plainTextToken,
      'token_type'         => 'Bearer',
      'expires_in'         => self::ACCESS_TOKEN_TTL * 60,
      'refresh_expires_in' => self::REFRESH_TOKEN_TTL * 60,
    ], 'Tokens refreshed successfully.');
  }

  /**
   * Revoke all API tokens for the authenticated user (logout API session).
   *
   * POST /api/v1/auth/token/revoke
   * Requires: Authorization: Bearer <access_token>
   *
   * Optionally pass ?workspace=slug to only revoke tokens for that workspace.
   */
  public function revokeToken(Request $request)
  {
    /** @var User $user */
    $user = Auth::user();

    $workspace = $request->query('workspace');

    $query = $user->tokens()
      ->where(function ($q) {
        $q->where('name', 'LIKE', 'api-access:%')
          ->orWhere('name', 'LIKE', 'api-refresh:%');
      });

    if ($workspace) {
      // Find workspace ID
      $ws = Workspace::where('slug', $workspace)->orWhere('id', $workspace)->first();
      if ($ws) {
        $query->where('name', 'LIKE', "%:{$ws->id}:%");
      }
    }

    $count = $query->count();
    $query->delete();

    return $this->successResponse(
      ['revoked_count' => $count],
      "Revoked {$count} API token(s) successfully."
    );
  }

  /**
   * Validate an access token and return workspace + user info.
   *
   * GET /api/v1/auth/token/validate
   * Requires: Authorization: Bearer <access_token>
   *
   * Useful for external systems to verify their token is still valid.
   */
  public function validateToken(Request $request)
  {
    /** @var User $user */
    $user = Auth::user();
    $token = $user->currentAccessToken();

    // Determine the workspace from the token name
    $workspaceId = null;
    if ($token && str_starts_with($token->name, 'api-access:')) {
      $parts = explode(':', $token->name);
      $workspaceId = $parts[1] ?? null;
    }

    $workspace = $workspaceId ? Workspace::find($workspaceId) : $user->currentWorkspace;

    // Validate plan is still active
    $plan = $workspace?->getPlanName() ?? 'unknown';
    $hasApiAccess = in_array($plan, ['enterprise']);

    return $this->successResponse([
      'valid'           => true,
      'has_api_access'  => $hasApiAccess,
      'token_name'      => $token?->name,
      'token_expires_at' => $token?->expires_at?->toIso8601String(),
      'user' => [
        'id'    => $user->id,
        'name'  => $user->name,
        'email' => $user->email,
      ],
      'workspace' => $workspace ? [
        'id'           => $workspace->id,
        'name'         => $workspace->name,
        'slug'         => $workspace->slug,
        'plan'         => $plan,
        'api_access'   => $hasApiAccess,
      ] : null,
    ], 'Token is valid.');
  }
}

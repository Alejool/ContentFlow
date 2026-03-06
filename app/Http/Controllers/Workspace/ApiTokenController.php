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
     */
    public function index(Workspace $workspace)
    {
        if (Auth::id() !== $workspace->created_by) {
            abort(403);
        }

        if ($workspace->getPlanName() !== 'enterprise') {
            return $this->errorResponse('API access is only available for Enterprise plans.', 403);
        }

        return $this->successResponse([
            'tokens' => $workspace->tokens()->orderBy('created_at', 'desc')->get()
        ]);
    }

    /**
     * Create a new token for a workspace.
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

        $token = $workspace->createToken($request->name);

        return $this->successResponse([
            'token' => $token->plainTextToken,
            'name' => $request->name,
        ], 'API token created successfully. Please copy it now, as you won\'t be able to see it again.', 201);
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
}

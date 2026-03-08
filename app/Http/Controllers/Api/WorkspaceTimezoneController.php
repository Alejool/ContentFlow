<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Traits\ApiResponse;

class WorkspaceTimezoneController extends Controller
{
    use ApiResponse;

    /**
     * Actualiza la zona horaria del workspace actual.
     * Solo el owner o admin del workspace puede cambiarla.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'timezone' => ['required', 'string', 'timezone'],
        ]);

        $workspace = Auth::user()->currentWorkspace;

        if (!$workspace) {
            return $this->errorResponse('No active workspace found.', 404);
        }

        // Verificar permisos (solo owner/admin)
        if (!Auth::user()->hasPermission('manage-workspace', $workspace->id)) {
            return $this->errorResponse('You do not have permission to update workspace settings.', 403);
        }

        $workspace->timezone = $validated['timezone'];
        $workspace->save();

        return $this->successResponse([
            'message' => 'Workspace timezone updated successfully',
            'timezone' => $workspace->timezone,
        ]);
    }

    /**
     * Obtiene la zona horaria del workspace actual.
     */
    public function show()
    {
        $workspace = Auth::user()->currentWorkspace;

        if (!$workspace) {
            return $this->errorResponse('No active workspace found.', 404);
        }

        return $this->successResponse([
            'timezone' => $workspace->timezone ?? 'UTC',
            'workspace_id' => $workspace->id,
            'workspace_name' => $workspace->name,
        ]);
    }
}

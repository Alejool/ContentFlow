<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationLock;
use App\Events\Publications\PublicationLockChanged;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PublicationLockController extends Controller
{
    use ApiResponse;

    public function lock(Request $request, Publication $publication)
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;

        // Ensure publication belongs to current workspace
        if ($publication->workspace_id !== $workspaceId) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Clean up expired locks first
        PublicationLock::where('expires_at', '<', now())->delete();

        $existingLock = PublicationLock::where('publication_id', $publication->id)->first();
        $sessionId = session()->getId();

        if ($existingLock) {
            // Check if it's the SAME user and SAME session
            if ($existingLock->user_id === $user->id && $existingLock->session_id === $sessionId) {
                // Refresh our own lock
                $existingLock->update(['expires_at' => now()->addMinutes(2)]);
                return $this->successResponse(['lock' => $existingLock], 'Lock refreshed');
            }

            // If it's the same user but DIFFERENT session
            if ($existingLock->user_id === $user->id) {
                return $this->errorResponse('Publication is open in another window/device.', 423, [
                    'locked_by' => 'session',
                    'user_name' => 'You',
                    'user_id' => $user->id,
                    'ip_address' => $existingLock->ip_address,
                    'user_agent' => $existingLock->user_agent,
                    'expires_at' => $existingLock->expires_at->toIso8601String(),
                ]);
            }

            return $this->errorResponse('Publication is being edited by ' . $existingLock->user->name, 423, [
                'locked_by' => 'user',
                'user_name' => $existingLock->user->name,
                'user_id' => $existingLock->user_id,
                'ip_address' => $existingLock->ip_address,
                'user_agent' => $existingLock->user_agent,
                'expires_at' => $existingLock->expires_at->toIso8601String(),
            ]);
        }

        // Use updateOrCreate to handle race conditions where lock might still exist
        $lock = PublicationLock::updateOrCreate(
            ['publication_id' => $publication->id],
            [
                'user_id' => $user->id,
                'session_id' => $sessionId,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'expires_at' => now()->addMinutes(2),
            ]
        );

        broadcast(new PublicationLockChanged($publication->id, $lock->load('user'), $workspaceId))->toOthers();

        return $this->successResponse(['lock' => $lock], 'Lock acquired');
    }

    public function unlock(Request $request, Publication $publication)
    {
        $user = Auth::user();
        $sessionId = session()->getId();

        // Match by both user_id AND session_id to ensure we're releasing the correct lock
        $lock = PublicationLock::where('publication_id', $publication->id)
            ->where('user_id', $user->id)
            ->where('session_id', $sessionId)
            ->first();

        if ($lock) {
            $lock->delete();
            broadcast(new PublicationLockChanged($publication->id, null, $user->current_workspace_id))->toOthers();
        }

        return $this->successResponse(null, 'Lock released');
    }
}

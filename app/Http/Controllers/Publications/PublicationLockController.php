<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Models\Publications\PublicationLock;
use App\Events\Publications\PublicationLockChanged;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PublicationLockController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user->current_workspace_id) {
            return $this->successResponse(['locks' => []]);
        }

        PublicationLock::where('expires_at', '<', now())->delete();

        $locks = PublicationLock::whereHas('publication', function ($q) use ($user) {
            $q->where('workspace_id', $user->current_workspace_id);
        })
            ->where('expires_at', '>', now())
            ->with('user:id,name')
            ->get();

        return $this->successResponse(['locks' => $locks]);
    }

    public function lock(Request $request, Publication $publication)
    {
        $user = Auth::user();
        $workspaceId = $user->current_workspace_id;
        $sessionId = session()->getId();

        Log::info("🔐 Lock attempt: pub {$publication->id}, user {$user->id}, session {$sessionId}");

        // Ensure publication belongs to current workspace
        if ($publication->workspace_id !== $workspaceId) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Clean up expired locks first
        PublicationLock::where('expires_at', '<', now())->delete();

        $existingLock = PublicationLock::where('publication_id', $publication->id)->first();
        $sessionId = session()->getId();

        if ($existingLock) {
            $force = $request->input('force', false);

            // Allow handover if it's the SAME user (even with different session) OR if force is requested
            // Force is usually requested when a frontend survivor detects the locker left the presence channel
            if ($existingLock->user_id === $user->id || $force) {
                $oldUser = $existingLock->user->name ?? 'otro editor';
                $existingLock->delete();
                Log::info("🔄 Lock handover: pub {$publication->id}, user {$user->id} taking over (previous session: {$existingLock->session_id}, force: " . ($force ? 'true' : 'false') . ")");
            } else {
                return $this->errorResponse('Publication is being edited by ' . $existingLock->user->name, 423, [
                    'locked_by' => 'user',
                    'user_name' => $existingLock->user->name,
                    'user_id' => $existingLock->user_id,
                    'ip_address' => $existingLock->ip_address,
                    'user_agent' => $existingLock->user_agent,
                    'expires_at' => $existingLock->expires_at->toIso8601String(),
                ]);
            }
        }

        // Use updateOrCreate to handle race conditions where lock might still exist
        $lock = PublicationLock::updateOrCreate(
            ['publication_id' => $publication->id],
            [
                'user_id' => $user->id,
                'session_id' => $sessionId,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'expires_at' => now()->addSeconds(40),
            ]
        );

        broadcast(new PublicationLockChanged($publication->id, $lock->load('user'), $workspaceId))->toOthers();

        return $this->successResponse(['lock' => $lock], 'Lock acquired');
    }

    public function unlock(Request $request, Publication $publication)
    {
        $user = Auth::user();
        $sessionId = session()->getId();

        // Relaxed check: Match by user_id to ensure we're releasing the correct lock
        // Session ID check is secondary to avoid "sticky" locks across multi-tab usage
        $lock = PublicationLock::where('publication_id', $publication->id)
            ->where('user_id', $user->id)
            ->first();

        if ($lock) {
            Log::info("🔓 Lock released successfully: pub {$publication->id}, user {$user->id}");
            $lock->delete();
            broadcast(new PublicationLockChanged($publication->id, null, $user->current_workspace_id))->toOthers();
        } else {
            Log::warning("⚠️ Unlock failed - lock not found for user: pub {$publication->id}, user {$user->id}");
        }

        return $this->successResponse(null, 'Lock released');
    }

    /**
     * Get current lock status for a publication
     */
    public function status(Request $request, Publication $publication)
    {
        PublicationLock::where('expires_at', '<', now())->delete();

        $lock = PublicationLock::where('publication_id', $publication->id)->first();

        if ($lock) {
            return $this->successResponse(['lock' => $lock->load('user')]);
        }

        return $this->successResponse(['lock' => null]);
    }
}

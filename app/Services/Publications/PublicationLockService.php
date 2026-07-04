<?php

namespace App\Services\Publications;

use App\Events\Publications\PublicationLockChanged;
use App\Models\Publications\Publication;
use App\Models\User;
use App\Repositories\PublicationLockRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Edit-lock lifecycle for publications (acquire / release / status).
 * Controller stays thin; all guard rules and broadcasts live here.
 */
class PublicationLockService
{
    /** Lock lifetime — short for fast handovers when an editor leaves. */
    private const LOCK_TTL_SECONDS = 20;

    public function __construct(private PublicationLockRepository $locks)
    {
    }

    public function listForWorkspace(?int $workspaceId): Collection
    {
        if (!$workspaceId) {
            return collect();
        }

        $this->locks->deleteExpired();

        return $this->locks->activeForWorkspace($workspaceId);
    }

    /**
     * Attempt to acquire (or hand over) the edit lock.
     *
     * @return array{ok: bool, status?: int, error?: string, meta?: array, lock?: mixed}
     */
    public function acquire(Publication $publication, User $user, bool $force, string $ip, ?string $userAgent): array
    {
        $workspaceId = $user->current_workspace_id;

        if ($publication->workspace_id !== $workspaceId) {
            return ['ok' => false, 'status' => 403, 'error' => 'Unauthorized'];
        }

        if ($publication->isLockedForEditing()) {
            return [
                'ok' => false,
                'status' => 423,
                'error' => 'This publication is awaiting approval and cannot be edited.',
                'meta' => [
                    'locked_by' => 'approval_workflow',
                    'status' => $publication->status,
                    'reason' => 'This publication is awaiting approval and cannot be edited.',
                ],
            ];
        }

        $this->locks->deleteExpired();

        $existingLock = $this->locks->forPublication($publication->id);

        if ($existingLock) {
            // Same user (any session) or forced handover may take over.
            if ($existingLock->user_id === $user->id || $force) {
                $existingLock->delete();
                Log::info("🔄 Lock handover: pub {$publication->id}, user {$user->id} taking over (force: " . ($force ? 'true' : 'false') . ')');
            } else {
                return [
                    'ok' => false,
                    'status' => 423,
                    'error' => 'Publication is being edited by ' . $existingLock->user->name,
                    'meta' => [
                        'locked_by' => 'user',
                        'user_name' => $existingLock->user->name,
                        'user_id' => $existingLock->user_id,
                        'ip_address' => $existingLock->ip_address,
                        'user_agent' => $existingLock->user_agent,
                        'expires_at' => $existingLock->expires_at->toIso8601String(),
                    ],
                ];
            }
        }

        $lock = $this->locks->upsert($publication->id, [
            'user_id' => $user->id,
            'session_id' => session()->getId(),
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'expires_at' => now()->addSeconds(self::LOCK_TTL_SECONDS),
        ]);

        broadcast(new PublicationLockChanged($publication->id, $lock->load('user'), $workspaceId))->toOthers();

        return ['ok' => true, 'lock' => $lock];
    }

    public function release(Publication $publication, User $user): void
    {
        $lock = $this->locks->forPublicationAndUser($publication->id, $user->id);

        if ($lock) {
            Log::info("🔓 Lock released: pub {$publication->id}, user {$user->id}");
            $lock->delete();
            broadcast(new PublicationLockChanged($publication->id, null, $user->current_workspace_id))->toOthers();
        } else {
            Log::warning("⚠️ Unlock failed - lock not found: pub {$publication->id}, user {$user->id}");
        }
    }

    /**
     * Current lock payload for a publication (approval lock takes priority).
     */
    public function status(Publication $publication): ?array
    {
        $this->locks->deleteExpired();

        if ($publication->isLockedForEditing()) {
            return [
                'locked_by' => 'approval_workflow',
                'status' => $publication->status,
                'reason' => 'This publication is awaiting approval and cannot be edited.',
                'publication_id' => $publication->id,
            ];
        }

        $lock = $this->locks->forPublication($publication->id);

        return $lock ? $lock->load('user')->toArray() : null;
    }
}

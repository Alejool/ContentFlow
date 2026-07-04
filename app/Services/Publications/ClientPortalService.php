<?php

namespace App\Services\Publications;

use App\Models\Logs\ApprovalLog;
use App\Models\Publications\Publication;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Approve / reject / token-generation logic for the external client portal.
 * Controller stays thin; transactions and logging live here.
 */
class ClientPortalService
{
    /** @return array{ok: bool, status?: int, error?: string, message?: string} */
    public function approve(Publication $publication): array
    {
        if ($publication->status !== 'pending_review') {
            return ['ok' => false, 'status' => 400, 'error' => 'This publication is not pending review.'];
        }

        try {
            DB::transaction(function () use ($publication) {
                $publication->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                ]);

                ApprovalLog::create([
                    'publication_id' => $publication->id,
                    'action' => 'approved',
                    'requested_at' => $publication->updated_at,
                    'reviewed_at' => now(),
                    // reviewer_id is null for the external client portal
                    'notes' => 'Approved via Client Portal',
                ]);

                $publication->logActivity('approved', 'Approved via Client Portal');
            });

            return ['ok' => true, 'message' => __('messages.publication.approved')];
        } catch (\Exception $e) {
            return ['ok' => false, 'status' => 500, 'error' => 'Failed to approve publication: ' . $e->getMessage()];
        }
    }

    /** @return array{ok: bool, status?: int, error?: string, message?: string} */
    public function reject(Publication $publication, ?string $reason): array
    {
        if ($publication->status !== 'pending_review') {
            return ['ok' => false, 'status' => 400, 'error' => 'This publication is not pending review.'];
        }

        try {
            DB::transaction(function () use ($publication, $reason) {
                $publication->update([
                    'status' => 'rejected',
                    'rejected_at' => now(),
                    'rejection_reason' => $reason,
                ]);

                ApprovalLog::create([
                    'publication_id' => $publication->id,
                    'action' => 'rejected',
                    'requested_at' => $publication->updated_at,
                    'reviewed_at' => now(),
                    'notes' => $reason,
                ]);

                $publication->logActivity('rejected', 'Rejected via Client Portal: ' . $reason);
            });

            return ['ok' => true, 'message' => __('messages.publication.rejected')];
        } catch (\Exception $e) {
            return ['ok' => false, 'status' => 500, 'error' => 'Failed to reject publication: ' . $e->getMessage()];
        }
    }

    /** Ensure the publication has a portal token and return token + url. */
    public function ensureToken(Publication $publication): array
    {
        if (!$publication->portal_token) {
            $publication->update(['portal_token' => Str::random(64)]);
        }

        return [
            'portal_token' => $publication->portal_token,
            'portal_url' => url("/portal/{$publication->portal_token}"),
        ];
    }
}

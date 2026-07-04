<?php

namespace App\Repositories;

use App\Models\Publications\Publication;

/**
 * Lookups for the external client portal (token-based publication access).
 */
class PublicationPortalRepository
{
    private const PORTAL_RELATIONS = ['mediaFiles', 'user:id,name', 'workspace:id,name'];

    /** Token lookup bypassing global scopes (for public portal render). */
    public function findByTokenUnscoped(string $token): Publication
    {
        return Publication::withoutGlobalScopes()
            ->where('portal_token', $token)
            ->with(self::PORTAL_RELATIONS)
            ->firstOrFail();
    }

    /** Token lookup with portal relations, or null. */
    public function findByTokenWithRelations(string $token): ?Publication
    {
        return Publication::where('portal_token', $token)
            ->with(self::PORTAL_RELATIONS)
            ->first();
    }

    public function findByToken(string $token): ?Publication
    {
        return Publication::where('portal_token', $token)->first();
    }

    public function findById(int|string $id): Publication
    {
        return Publication::findOrFail($id);
    }
}

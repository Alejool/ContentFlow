<?php

namespace App\Integrations\Contracts;

use App\Models\Integration;
use Illuminate\Support\Collection;

interface SyncableInterface extends IntegrationInterface
{
    /**
     * Sync data from the external service
     */
    public function sync(Integration $integration): Collection;

    /**
     * Get the last sync timestamp
     */
    public function getLastSyncAt(Integration $integration): ?string;

    /**
     * Check if sync is needed
     */
    public function needsSync(Integration $integration): bool;
}

<?php

namespace App\Services\Calendar;

use App\Models\Calendar\ExternalCalendarConnection;
use App\Models\Calendar\ExternalCalendarEvent;
use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\User\UserCalendarEvent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExternalCalendarSyncService
{
    private array $providers = [];

    public function __construct()
    {
        // Register available providers
        $this->providers['google'] = GoogleCalendarProvider::class;
        $this->providers['outlook'] = OutlookCalendarProvider::class;
    }

    /**
     * Sync a single publication to all connected external calendars
     */
    public function syncPublication(Publication $publication, User $user): void
    {
        try {
            $workspaceId = $publication->workspace_id;

            Log::info('Starting publication sync', [
                'publication_id' => $publication->id,
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
            ]);

            // Get all active connections for this user and workspace
            $connections = ExternalCalendarConnection::where('user_id', $user->id)
                ->where('workspace_id', $workspaceId)
                ->where('sync_enabled', true)
                ->where('status', 'connected')
                ->get();

            Log::info('Found calendar connections', [
                'count' => $connections->count(),
                'connections' => $connections->map(fn($c) => [
                    'provider' => $c->provider,
                    'email' => $c->email,
                    'sync_enabled' => $c->sync_enabled,
                    'status' => $c->status,
                ])->toArray(),
            ]);

            if ($connections->isEmpty()) {
                Log::warning('No active calendar connections found for user', [
                    'user_id' => $user->id,
                    'workspace_id' => $workspaceId,
                ]);
                return;
            }

            foreach ($connections as $connection) {
                try {
                    Log::info('Processing connection', [
                        'provider' => $connection->provider,
                        'email' => $connection->email,
                    ]);

                    // Check if publication should be synced based on sync_config
                    if (!$this->shouldSyncPublication($publication, $connection)) {
                        Log::info('Publication filtered out by sync config', [
                            'publication_id' => $publication->id,
                            'provider' => $connection->provider,
                            'sync_config' => $connection->sync_config,
                        ]);
                        continue;
                    }

                    // Check if event already exists
                    $existingEvent = ExternalCalendarEvent::where('connection_id', $connection->id)
                        ->where('publication_id', $publication->id)
                        ->first();

                    if ($existingEvent) {
                        Log::info('Updating existing calendar event', [
                            'event_id' => $existingEvent->external_event_id,
                        ]);
                        // Update existing event
                        $this->updateExternalEvent($connection, $existingEvent, $publication);
                    } else {
                        Log::info('Creating new calendar event');
                        // Create new event
                        $this->createExternalEvent($connection, $publication);
                    }

                    // Update last sync time
                    $connection->update(['last_sync_at' => now()]);
                } catch (\Exception $e) {
                    // Log error but don't block local operations
                    $this->handleSyncError($connection, $e);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to sync publication to external calendars', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Don't throw - sync errors should not block local operations
        }
    }

    /**
     * Sync multiple publications in bulk
     */
    public function syncBulkPublications(Collection $publications, User $user): array
    {
        $results = [
            'successful' => [],
            'failed' => [],
        ];

        foreach ($publications as $publication) {
            try {
                $this->syncPublication($publication, $user);
                $results['successful'][] = $publication->id;
            } catch (\Exception $e) {
                $results['failed'][] = [
                    'id' => $publication->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    /**
     * Perform full sync of all publications for a connection
     * Used when reconnecting or enabling sync
     */
    public function fullSync(ExternalCalendarConnection $connection): array
    {
        try {
            $workspaceId = $connection->workspace_id;
            $userId = $connection->user_id;
            
            // Get all publications for this workspace that should be synced
            $publications = Publication::where('workspace_id', $workspaceId)
                ->whereNotNull('scheduled_at')
                ->get()
                ->filter(function ($publication) use ($connection) {
                    return $this->shouldSyncPublication($publication, $connection);
                });

            // Get all user calendar events for this workspace
            // Include public events and private events owned by the connection user
            $userEvents = UserCalendarEvent::where('workspace_id', $workspaceId)
                ->where(function ($query) use ($userId) {
                    $query->where('is_public', true)
                        ->orWhere('user_id', $userId);
                })
                ->get();

            $results = [
                'successful' => [],
                'failed' => [],
                'total' => $publications->count() + $userEvents->count(),
                'publications' => 0,
                'user_events' => 0,
            ];

            // Sync publications
            foreach ($publications as $publication) {
                try {
                    // Check if event already exists
                    $existingEvent = ExternalCalendarEvent::where('connection_id', $connection->id)
                        ->where('publication_id', $publication->id)
                        ->first();

                    if ($existingEvent) {
                        // Update existing event
                        $this->updateExternalEvent($connection, $existingEvent, $publication);
                    } else {
                        // Create new event
                        $this->createExternalEvent($connection, $publication);
                    }

                    $results['successful'][] = ['type' => 'publication', 'id' => $publication->id];
                    $results['publications']++;
                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'type' => 'publication',
                        'id' => $publication->id,
                        'error' => $e->getMessage(),
                    ];
                    Log::warning('Failed to sync publication during full sync', [
                        'publication_id' => $publication->id,
                        'connection_id' => $connection->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Sync user calendar events
            foreach ($userEvents as $userEvent) {
                try {
                    // Check if event already exists
                    $existingEvent = ExternalCalendarEvent::where('connection_id', $connection->id)
                        ->where('user_calendar_event_id', $userEvent->id)
                        ->first();

                    if ($existingEvent) {
                        // Update existing event
                        $this->updateExternalUserEvent($connection, $existingEvent, $userEvent);
                    } else {
                        // Create new event
                        $this->createExternalUserEvent($connection, $userEvent);
                    }

                    $results['successful'][] = ['type' => 'user_event', 'id' => $userEvent->id];
                    $results['user_events']++;
                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'type' => 'user_event',
                        'id' => $userEvent->id,
                        'error' => $e->getMessage(),
                    ];
                    Log::warning('Failed to sync user event during full sync', [
                        'user_event_id' => $userEvent->id,
                        'connection_id' => $connection->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Update last sync time
            $connection->update(['last_sync_at' => now()]);

            Log::info('Full sync completed', [
                'connection_id' => $connection->id,
                'provider' => $connection->provider,
                'total' => $results['total'],
                'successful' => count($results['successful']),
                'failed' => count($results['failed']),
                'publications' => $results['publications'],
                'user_events' => $results['user_events'],
            ]);

            return $results;
        } catch (\Exception $e) {
            Log::error('Full sync failed', [
                'connection_id' => $connection->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle publication updated event
     */
    public function handlePublicationUpdated(Publication $publication): void
    {
        try {
            $user = $publication->user;
            
            if (!$user) {
                Log::debug('Skipping calendar sync - publication has no user', [
                    'publication_id' => $publication->id,
                ]);
                return;
            }

            // Get all external events for this publication
            $externalEvents = ExternalCalendarEvent::where('publication_id', $publication->id)
                ->with('connection')
                ->get();

            // If publication no longer has scheduled_at, delete all external events
            if (!$publication->scheduled_at) {
                Log::info('Publication no longer scheduled, removing from external calendars', [
                    'publication_id' => $publication->id,
                ]);
                
                foreach ($externalEvents as $externalEvent) {
                    $connection = $externalEvent->connection;
                    if ($connection) {
                        try {
                            $this->deleteExternalEvent($connection, $externalEvent);
                        } catch (\Exception $e) {
                            $this->handleSyncError($connection, $e);
                        }
                    }
                }
                return;
            }

            // If publication has scheduled_at but no external events exist, create them
            if ($externalEvents->isEmpty()) {
                Log::info('Publication now scheduled, creating external calendar events', [
                    'publication_id' => $publication->id,
                ]);
                
                $this->syncPublication($publication, $user);
                return;
            }

            // Update existing events
            foreach ($externalEvents as $externalEvent) {
                $connection = $externalEvent->connection;

                // Skip if connection is not active
                if (!$connection || !$connection->sync_enabled || $connection->status !== 'connected') {
                    continue;
                }

                try {
                    // Check if publication should still be synced
                    if (!$this->shouldSyncPublication($publication, $connection)) {
                        // Remove from external calendar if no longer matches criteria
                        Log::info('Publication no longer matches sync criteria, removing', [
                            'publication_id' => $publication->id,
                            'connection_id' => $connection->id,
                        ]);
                        $this->deleteExternalEvent($connection, $externalEvent);
                        continue;
                    }

                    // Update the event
                    $this->updateExternalEvent($connection, $externalEvent, $publication);

                    // Update last sync time
                    $connection->update(['last_sync_at' => now()]);
                } catch (\Exception $e) {
                    $this->handleSyncError($connection, $e);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to handle publication updated event', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle publication deleted event
     */
    public function handlePublicationDeleted(Publication $publication): void
    {
        try {
            // Get all external events for this publication
            $externalEvents = ExternalCalendarEvent::where('publication_id', $publication->id)
                ->with('connection')
                ->get();

            foreach ($externalEvents as $externalEvent) {
                $connection = $externalEvent->connection;

                if (!$connection) {
                    continue;
                }

                try {
                    $this->deleteExternalEvent($connection, $externalEvent);
                } catch (\Exception $e) {
                    $this->handleSyncError($connection, $e);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to handle publication deleted event', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Create a new event in external calendar
     */
    private function createExternalEvent(ExternalCalendarConnection $connection, Publication $publication): void
    {
        // Check if event already exists to prevent duplicates
        $existingEvent = ExternalCalendarEvent::where('connection_id', $connection->id)
            ->where('publication_id', $publication->id)
            ->first();

        if ($existingEvent) {
            Log::warning('External calendar event already exists, updating instead', [
                'publication_id' => $publication->id,
                'connection_id' => $connection->id,
                'external_event_id' => $existingEvent->external_event_id,
            ]);
            $this->updateExternalEvent($connection, $existingEvent, $publication);
            return;
        }

        $provider = $this->getProviderInstance($connection);

        // Refresh token if needed
        if ($connection->needsRefresh()) {
            $this->refreshConnectionToken($connection, $provider);
        }

        // Set access token
        $provider->setAccessToken(decrypt($connection->access_token));

        // Create event
        $externalEventId = $provider->createEvent($publication);

        // Save to database
        ExternalCalendarEvent::create([
            'connection_id' => $connection->id,
            'publication_id' => $publication->id,
            'external_event_id' => $externalEventId,
            'provider' => $connection->provider,
        ]);

        Log::info('External calendar event created', [
            'publication_id' => $publication->id,
            'provider' => $connection->provider,
            'external_event_id' => $externalEventId,
        ]);
    }

    /**
     * Update an existing event in external calendar
     */
    private function updateExternalEvent(
        ExternalCalendarConnection $connection,
        ExternalCalendarEvent $externalEvent,
        Publication $publication
    ): void {
        $provider = $this->getProviderInstance($connection);

        // Refresh token if needed
        if ($connection->needsRefresh()) {
            $this->refreshConnectionToken($connection, $provider);
        }

        // Set access token
        $provider->setAccessToken(decrypt($connection->access_token));

        // Update event
        $provider->updateEvent($externalEvent->external_event_id, $publication);

        // Update timestamp
        $externalEvent->touch('last_updated_at');

        Log::info('External calendar event updated', [
            'publication_id' => $publication->id,
            'provider' => $connection->provider,
            'external_event_id' => $externalEvent->external_event_id,
        ]);
    }

    /**
     * Delete an event from external calendar
     */
    private function deleteExternalEvent(
        ExternalCalendarConnection $connection,
        ExternalCalendarEvent $externalEvent
    ): void {
        $provider = $this->getProviderInstance($connection);

        // Refresh token if needed
        if ($connection->needsRefresh()) {
            $this->refreshConnectionToken($connection, $provider);
        }

        // Set access token
        $provider->setAccessToken(decrypt($connection->access_token));

        // Delete event
        $provider->deleteEvent($externalEvent->external_event_id);

        // Delete from database
        $externalEvent->delete();

        Log::info('External calendar event deleted', [
            'provider' => $connection->provider,
            'external_event_id' => $externalEvent->external_event_id,
        ]);
    }

    /**
     * Create a new user calendar event in external calendar
     */
    private function createExternalUserEvent(ExternalCalendarConnection $connection, UserCalendarEvent $userEvent): void
    {
        // Check if event already exists to prevent duplicates
        $existingEvent = ExternalCalendarEvent::where('connection_id', $connection->id)
            ->where('user_calendar_event_id', $userEvent->id)
            ->first();

        if ($existingEvent) {
            Log::warning('External calendar user event already exists, updating instead', [
                'user_event_id' => $userEvent->id,
                'connection_id' => $connection->id,
                'external_event_id' => $existingEvent->external_event_id,
            ]);
            $this->updateExternalUserEvent($connection, $existingEvent, $userEvent);
            return;
        }

        $provider = $this->getProviderInstance($connection);

        // Refresh token if needed
        if ($connection->needsRefresh()) {
            $this->refreshConnectionToken($connection, $provider);
        }

        // Set access token
        $provider->setAccessToken(decrypt($connection->access_token));

        // Create event
        $externalEventId = $provider->createUserEvent($userEvent);

        // Save to database
        ExternalCalendarEvent::create([
            'connection_id' => $connection->id,
            'user_calendar_event_id' => $userEvent->id,
            'external_event_id' => $externalEventId,
            'provider' => $connection->provider,
        ]);

        Log::info('External calendar user event created', [
            'user_event_id' => $userEvent->id,
            'provider' => $connection->provider,
            'external_event_id' => $externalEventId,
        ]);
    }

    /**
     * Update an existing user calendar event in external calendar
     */
    private function updateExternalUserEvent(
        ExternalCalendarConnection $connection,
        ExternalCalendarEvent $externalEvent,
        UserCalendarEvent $userEvent
    ): void {
        $provider = $this->getProviderInstance($connection);

        // Refresh token if needed
        if ($connection->needsRefresh()) {
            $this->refreshConnectionToken($connection, $provider);
        }

        // Set access token
        $provider->setAccessToken(decrypt($connection->access_token));

        // Update event
        $provider->updateUserEvent($externalEvent->external_event_id, $userEvent);

        // Update timestamp
        $externalEvent->touch('last_updated_at');

        Log::info('External calendar user event updated', [
            'user_event_id' => $userEvent->id,
            'provider' => $connection->provider,
            'external_event_id' => $externalEvent->external_event_id,
        ]);
    }

    /**
     * Check if publication should be synced based on connection's sync_config
     */
    private function shouldSyncPublication(Publication $publication, ExternalCalendarConnection $connection): bool
    {
        $syncConfig = $connection->sync_config ?? [];

        // Check campaign filter
        if (!empty($syncConfig['sync_campaigns'])) {
            if (!in_array($publication->campaign_id, $syncConfig['sync_campaigns'])) {
                return false;
            }
        }

        // Check platform filter
        if (!empty($syncConfig['sync_platforms'])) {
            // Get platforms from scheduled_posts
            $publicationPlatforms = $publication->scheduled_posts()
                ->pluck('platform')
                ->map(fn($p) => strtolower($p))
                ->toArray();
            
            $syncPlatforms = array_map('strtolower', $syncConfig['sync_platforms']);
            $hasMatchingPlatform = !empty(array_intersect($publicationPlatforms, $syncPlatforms));
            
            if (!$hasMatchingPlatform) {
                return false;
            }
        }

        return true;
    }

    /**
     * Refresh connection token
     */
    public function refreshConnectionToken(ExternalCalendarConnection $connection, ExternalCalendarProvider $provider): void
    {
        try {
            $refreshToken = decrypt($connection->refresh_token);
            $tokenData = $provider->refreshToken($refreshToken);

            $connection->update([
                'access_token' => encrypt($tokenData['access_token']),
                'token_expires_at' => now()->addSeconds($tokenData['expires_in']),
                'status' => 'connected',
                'error_message' => null,
            ]);

            Log::info('External calendar token refreshed', [
                'connection_id' => $connection->id,
                'provider' => $connection->provider,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to refresh external calendar token', [
                'connection_id' => $connection->id,
                'provider' => $connection->provider,
                'error' => $e->getMessage(),
            ]);

            $connection->update([
                'status' => 'error',
                'error_message' => 'Token refresh failed: ' . $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle sync error
     */
    private function handleSyncError(ExternalCalendarConnection $connection, \Exception $e): void
    {
        Log::error('External calendar sync error', [
            'connection_id' => $connection->id,
            'provider' => $connection->provider,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        // Update connection status
        $connection->update([
            'status' => 'error',
            'error_message' => substr($e->getMessage(), 0, 500),
        ]);

        // Note: We don't throw the exception to prevent blocking local operations
    }

    /**
     * Get provider instance
     */
    public function getProviderInstance(ExternalCalendarConnection $connection): ExternalCalendarProvider
    {
        $providerClass = $this->providers[$connection->provider] ?? null;

        if (!$providerClass) {
            throw new \InvalidArgumentException('Unsupported provider: ' . $connection->provider);
        }

        return new $providerClass();
    }
}

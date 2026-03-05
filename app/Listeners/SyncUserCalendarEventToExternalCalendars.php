<?php

namespace App\Listeners;

use App\Events\UserCalendarEventCreated;
use App\Events\UserCalendarEventUpdated;
use App\Events\UserCalendarEventDeleted;
use App\Models\Calendar\ExternalCalendarConnection;
use App\Models\Calendar\ExternalCalendarEvent;
use App\Services\Calendar\ExternalCalendarSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SyncUserCalendarEventToExternalCalendars implements ShouldQueue
{
    use InteractsWithQueue;

    private ExternalCalendarSyncService $syncService;

    public function __construct(ExternalCalendarSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Handle UserCalendarEventCreated event
     */
    public function handleCreated(UserCalendarEventCreated $event): void
    {
        try {
            $userEvent = $event->userEvent;
            $workspaceId = $userEvent->workspace_id;
            $userId = $userEvent->user_id;

            Log::info('Syncing created user calendar event to external calendars', [
                'user_event_id' => $userEvent->id,
                'workspace_id' => $workspaceId,
                'user_id' => $userId,
            ]);

            // Get all active connections for this workspace
            // Sync to connections owned by the event creator or if event is public
            $connections = ExternalCalendarConnection::where('workspace_id', $workspaceId)
                ->where('sync_enabled', true)
                ->where('status', 'connected')
                ->where(function ($query) use ($userId, $userEvent) {
                    if ($userEvent->is_public) {
                        // Public events sync to all connections in workspace
                        $query->whereNotNull('id');
                    } else {
                        // Private events only sync to owner's connections
                        $query->where('user_id', $userId);
                    }
                })
                ->get();

            foreach ($connections as $connection) {
                try {
                    $provider = $this->syncService->getProviderInstance($connection);
                    
                    if ($connection->needsRefresh()) {
                        $this->syncService->refreshConnectionToken($connection, $provider);
                    }

                    $provider->setAccessToken(decrypt($connection->access_token));
                    $externalEventId = $provider->createUserEvent($userEvent);

                    ExternalCalendarEvent::create([
                        'connection_id' => $connection->id,
                        'user_calendar_event_id' => $userEvent->id,
                        'external_event_id' => $externalEventId,
                        'provider' => $connection->provider,
                    ]);

                    $connection->update(['last_sync_at' => now()]);
                } catch (\Exception $e) {
                    Log::error('Failed to sync user event to external calendar', [
                        'user_event_id' => $userEvent->id,
                        'connection_id' => $connection->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('User calendar event synced successfully', [
                'user_event_id' => $userEvent->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync created user calendar event', [
                'user_event_id' => $event->userEvent->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle UserCalendarEventUpdated event
     */
    public function handleUpdated(UserCalendarEventUpdated $event): void
    {
        try {
            $userEvent = $event->userEvent;

            Log::info('Syncing updated user calendar event', [
                'user_event_id' => $userEvent->id,
            ]);

            $externalEvents = ExternalCalendarEvent::where('user_calendar_event_id', $userEvent->id)
                ->with('connection')
                ->get();

            // If no external events exist, create them (in case event was created before sync was enabled)
            if ($externalEvents->isEmpty()) {
                Log::info('No external events found, creating them', [
                    'user_event_id' => $userEvent->id,
                ]);
                $this->handleCreated(new UserCalendarEventCreated($userEvent));
                return;
            }

            foreach ($externalEvents as $externalEvent) {
                $connection = $externalEvent->connection;

                if (!$connection || !$connection->sync_enabled) {
                    continue;
                }

                try {
                    $provider = $this->syncService->getProviderInstance($connection);
                    
                    if ($connection->needsRefresh()) {
                        $this->syncService->refreshConnectionToken($connection, $provider);
                    }

                    $provider->setAccessToken(decrypt($connection->access_token));
                    $provider->updateUserEvent($externalEvent->external_event_id, $userEvent);

                    $connection->update(['last_sync_at' => now()]);
                    
                    Log::info('User event updated in external calendar', [
                        'user_event_id' => $userEvent->id,
                        'connection_id' => $connection->id,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to update user event in external calendar', [
                        'user_event_id' => $userEvent->id,
                        'connection_id' => $connection->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to handle user calendar event update', [
                'user_event_id' => $event->userEvent->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle UserCalendarEventDeleted event
     */
    public function handleDeleted(UserCalendarEventDeleted $event): void
    {
        try {
            $userEvent = $event->userEvent;

            $externalEvents = ExternalCalendarEvent::where('user_calendar_event_id', $userEvent->id)
                ->with('connection')
                ->get();

            foreach ($externalEvents as $externalEvent) {
                $connection = $externalEvent->connection;

                if (!$connection) {
                    continue;
                }

                try {
                    $provider = $this->syncService->getProviderInstance($connection);
                    
                    if ($connection->needsRefresh()) {
                        $this->syncService->refreshConnectionToken($connection, $provider);
                    }

                    $provider->setAccessToken(decrypt($connection->access_token));
                    $provider->deleteEvent($externalEvent->external_event_id);

                    $externalEvent->delete();
                } catch (\Exception $e) {
                    Log::error('Failed to delete user event from external calendar', [
                        'user_event_id' => $userEvent->id,
                        'connection_id' => $connection->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to handle user calendar event deletion', [
                'user_event_id' => $event->userEvent->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

<?php

namespace App\Services\Calendar;

use App\Models\Publications\Publication;
use App\Models\ScheduledPost;
use App\Models\UserCalendarEvent;
use Illuminate\Support\Facades\Log;

class DataIntegrityValidator
{
    /**
     * Validate that an event exists and belongs to the user's workspace
     *
     * @param string $eventId
     * @param string $eventType
     * @param int $workspaceId
     * @return array{valid: bool, model: mixed, error: string|null}
     */
    public function validateEventAccess(string $eventId, string $eventType, int $workspaceId): array
    {
        try {
            $model = $this->getEventModel($eventId, $eventType);

            if (!$model) {
                return [
                    'valid' => false,
                    'model' => null,
                    'error' => 'Event not found.',
                ];
            }

            // Check workspace ownership
            if (!$this->belongsToWorkspace($model, $workspaceId)) {
                return [
                    'valid' => false,
                    'model' => null,
                    'error' => 'You do not have permission to access this event.',
                ];
            }

            return [
                'valid' => true,
                'model' => $model,
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error('Event validation error', [
                'event_id' => $eventId,
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return [
                'valid' => false,
                'model' => null,
                'error' => 'An error occurred while validating the event.',
            ];
        }
    }

    /**
     * Get the model instance for an event
     *
     * @param string $eventId
     * @param string $eventType
     * @return mixed
     */
    private function getEventModel(string $eventId, string $eventType)
    {
        return match ($eventType) {
            'publication' => Publication::find($eventId),
            'post' => ScheduledPost::find($eventId),
            'user_event' => UserCalendarEvent::find($eventId),
            default => null,
        };
    }

    /**
     * Check if a model belongs to the specified workspace
     *
     * @param mixed $model
     * @param int $workspaceId
     * @return bool
     */
    private function belongsToWorkspace($model, int $workspaceId): bool
    {
        if (!$model) {
            return false;
        }

        // Check if model has workspace_id directly
        if (isset($model->workspace_id)) {
            return $model->workspace_id == $workspaceId;
        }

        // For publications, check through campaign
        if ($model instanceof Publication && $model->campaign) {
            return $model->campaign->workspace_id == $workspaceId;
        }

        // For scheduled posts, check through publication
        if ($model instanceof ScheduledPost && $model->publication) {
            return $model->publication->campaign 
                && $model->publication->campaign->workspace_id == $workspaceId;
        }

        return false;
    }

    /**
     * Validate date integrity
     *
     * @param string $date
     * @return array{valid: bool, error: string|null}
     */
    public function validateDate(string $date): array
    {
        try {
            $dateTime = new \DateTime($date);
            
            // Check if date is too far in the past (more than 1 day)
            $yesterday = new \DateTime('-1 day');
            if ($dateTime < $yesterday) {
                return [
                    'valid' => false,
                    'error' => 'Date cannot be more than one day in the past.',
                ];
            }

            // Check if date is too far in the future (more than 5 years)
            $maxFuture = new \DateTime('+5 years');
            if ($dateTime > $maxFuture) {
                return [
                    'valid' => false,
                    'error' => 'Date cannot be more than 5 years in the future.',
                ];
            }

            return [
                'valid' => true,
                'error' => null,
            ];
        } catch (\Exception $e) {
            return [
                'valid' => false,
                'error' => 'Invalid date format.',
            ];
        }
    }

    /**
     * Detect version conflicts
     *
     * @param mixed $model
     * @param string|null $clientVersion
     * @return array{conflict: bool, server_version: string|null, server_timestamp: string|null}
     */
    public function detectConflict($model, ?string $clientVersion): array
    {
        if (!$clientVersion) {
            return [
                'conflict' => false,
                'server_version' => null,
                'server_timestamp' => null,
            ];
        }

        // Get server version (using updated_at as version)
        $serverVersion = $model->updated_at->timestamp;
        $clientVersionTimestamp = (int) $clientVersion;

        // If client version is older than server version, there's a conflict
        if ($clientVersionTimestamp < $serverVersion) {
            return [
                'conflict' => true,
                'server_version' => (string) $serverVersion,
                'server_timestamp' => $model->updated_at->toISOString(),
                'server_user' => $model->updated_by_user->name ?? 'Unknown',
            ];
        }

        return [
            'conflict' => false,
            'server_version' => (string) $serverVersion,
            'server_timestamp' => null,
        ];
    }

    /**
     * Validate bulk operation limits
     *
     * @param array $eventIds
     * @return array{valid: bool, error: string|null}
     */
    public function validateBulkOperationLimits(array $eventIds): array
    {
        $count = count($eventIds);

        if ($count === 0) {
            return [
                'valid' => false,
                'error' => 'No events selected for bulk operation.',
            ];
        }

        if ($count > 100) {
            return [
                'valid' => false,
                'error' => 'Cannot perform bulk operations on more than 100 events at once.',
            ];
        }

        return [
            'valid' => true,
            'error' => null,
        ];
    }
}

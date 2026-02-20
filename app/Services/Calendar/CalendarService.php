<?php

namespace App\Services\Calendar;

use App\Models\Publications\Publication;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class CalendarService
{
    /**
     * Get events for a specific date range with optional filters
     */
    public function getEvents(
        int $workspaceId,
        Carbon $start,
        Carbon $end,
        CalendarFilters $filters
    ): Collection {
        $query = Publication::where('workspace_id', $workspaceId)
            ->whereBetween('scheduled_at', [$start, $end])
            ->with(['campaigns', 'mediaFiles', 'user']);

        // Apply filters if provided
        if (!$filters->isEmpty()) {
            $query = $filters->apply($query);
        }

        return $query->orderBy('scheduled_at', 'asc')->get();
    }

    /**
     * Update the date of a single event
     */
    public function updateEventDate(
        int $publicationId,
        Carbon $newDate,
        int $workspaceId
    ): bool {
        try {
            $publication = Publication::where('id', $publicationId)
                ->where('workspace_id', $workspaceId)
                ->firstOrFail();

            $publication->scheduled_at = $newDate;
            $publication->save();

            Log::info('Publication date updated', [
                'publication_id' => $publicationId,
                'new_date' => $newDate->toDateTimeString(),
                'workspace_id' => $workspaceId,
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Failed to update publication date', [
                'publication_id' => $publicationId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Bulk update dates for multiple publications
     * 
     * This method processes each publication in its own transaction to ensure
     * that partial failures don't prevent successful updates from being saved.
     * 
     * @param array $publicationIds Array of publication IDs to update
     * @param Carbon $newDate The new scheduled date for all publications
     * @param int $workspaceId The workspace ID for authorization
     * @return BulkOperationResult Result object containing successful and failed operations
     */
    public function bulkUpdateDates(
        array $publicationIds,
        Carbon $newDate,
        int $workspaceId
    ): BulkOperationResult {
        $result = new BulkOperationResult();

        foreach ($publicationIds as $publicationId) {
            try {
                // Use individual transactions for each publication
                // This ensures partial failures don't rollback successful updates
                DB::transaction(function () use ($publicationId, $newDate, $workspaceId) {
                    $publication = Publication::where('id', $publicationId)
                        ->where('workspace_id', $workspaceId)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $publication->scheduled_at = $newDate;
                    $publication->save();
                });

                $result->addSuccess($publicationId);

                Log::info('Bulk operation: Publication date updated', [
                    'publication_id' => $publicationId,
                    'new_date' => $newDate->toDateTimeString(),
                ]);
            } catch (Exception $e) {
                $result->addFailure($publicationId, $e->getMessage());

                Log::error('Bulk operation: Failed to update publication date', [
                    'publication_id' => $publicationId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Bulk update operation completed', [
            'total_requested' => count($publicationIds),
            'successful' => $result->getSuccessCount(),
            'failed' => $result->getFailureCount(),
            'workspace_id' => $workspaceId,
        ]);

        return $result;
    }

    /**
     * Get publications by IDs for a specific workspace
     */
    public function getPublicationsByIds(
        array $publicationIds,
        int $workspaceId
    ): Collection {
        return Publication::where('workspace_id', $workspaceId)
            ->whereIn('id', $publicationIds)
            ->with(['campaigns', 'mediaFiles', 'user'])
            ->get();
    }

    /**
     * Validate that all publication IDs belong to the workspace
     */
    public function validatePublicationsInWorkspace(
        array $publicationIds,
        int $workspaceId
    ): bool {
        $count = Publication::where('workspace_id', $workspaceId)
            ->whereIn('id', $publicationIds)
            ->count();

        return $count === count($publicationIds);
    }
}

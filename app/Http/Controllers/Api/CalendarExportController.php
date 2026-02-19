<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\IcalendarGenerator\Components\Calendar;
use Spatie\IcalendarGenerator\Components\Event;

class CalendarExportController extends Controller
{
    use ApiResponse;

    /**
     * Export events to Google Calendar format (iCal)
     */
    public function exportToGoogle(Request $request)
    {
        $validated = $request->validate([
            'events' => 'required|array',
            'events.*.title' => 'required|string',
            'events.*.start' => 'required|date',
            'events.*.end' => 'nullable|date',
            'events.*.description' => 'nullable|string',
        ]);

        $calendar = Calendar::create(Auth::user()->name . "'s Calendar");

        foreach ($validated['events'] as $eventData) {
            $event = Event::create($eventData['title'])
                ->startsAt(new \DateTime($eventData['start']))
                ->description($eventData['description'] ?? '');

            if (!empty($eventData['end'])) {
                $event->endsAt(new \DateTime($eventData['end']));
            }

            $calendar->event($event);
        }

        $icsContent = $calendar->get();
        $filename = 'calendar_' . date('Y-m-d') . '.ics';

        // Store temporarily and return download URL
        $path = storage_path('app/temp/' . $filename);
        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        file_put_contents($path, $icsContent);

        return $this->successResponse([
            'url' => route('api.v1.calendar.download', ['filename' => $filename]),
            'filename' => $filename,
        ]);
    }

    /**
     * Export events to Outlook format (iCal)
     */
    public function exportToOutlook(Request $request)
    {
        // Outlook uses the same iCal format as Google Calendar
        return $this->exportToGoogle($request);
    }

    /**
     * Download the generated calendar file
     */
    public function download($filename)
    {
        $path = storage_path('app/temp/' . $filename);

        if (!file_exists($path)) {
            abort(404);
        }

        return response()->download($path, $filename, [
            'Content-Type' => 'text/calendar',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Bulk update events
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'event_ids' => 'required|array',
            'event_ids.*' => 'required|string',
            'scheduled_at' => 'required|date',
        ]);

        $workspaceId = Auth::user()->current_workspace_id;
        $updatedCount = 0;

        foreach ($validated['event_ids'] as $eventId) {
            // Parse event ID to get type and resource ID
            $parts = explode('_', $eventId);
            $type = $parts[0];
            $resourceId = end($parts);

            try {
                if ($type === 'pub') {
                    $model = \App\Models\Publications\Publication::where('workspace_id', $workspaceId)
                        ->findOrFail($resourceId);
                    $model->update(['scheduled_at' => $validated['scheduled_at']]);
                    $updatedCount++;
                } elseif ($type === 'post') {
                    $model = \App\Models\Social\ScheduledPost::whereHas('publication', function ($q) use ($workspaceId) {
                        $q->where('workspace_id', $workspaceId);
                    })->findOrFail($resourceId);
                    $model->update(['scheduled_at' => $validated['scheduled_at']]);
                    $updatedCount++;
                } elseif ($type === 'user') {
                    $model = \App\Models\User\UserCalendarEvent::where('workspace_id', $workspaceId)
                        ->where('user_id', Auth::id())
                        ->findOrFail($resourceId);
                    
                    $duration = $model->end_date ? $model->start_date->diffInSeconds($model->end_date) : null;
                    $newDate = new \DateTime($validated['scheduled_at']);
                    
                    $model->update([
                        'start_date' => $newDate,
                        'end_date' => $duration ? (clone $newDate)->modify("+{$duration} seconds") : null,
                    ]);
                    $updatedCount++;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        // Clear cache
        try {
            cache()->increment("publications:{$workspaceId}:version");
        } catch (\Exception $e) {
            cache()->put("publications:{$workspaceId}:version", time(), now()->addDays(7));
        }

        return $this->successResponse([
            'updated_count' => $updatedCount,
        ], "Successfully updated {$updatedCount} events");
    }
}

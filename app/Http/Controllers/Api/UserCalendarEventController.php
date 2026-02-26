<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User\UserCalendarEvent;
use Illuminate\Support\Facades\Auth;

use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class UserCalendarEventController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  use ApiResponse;

  public function index(Request $request)
  {
    // Return public events in the current workspace (any user)
    // plus private events that belong to the authenticated user.
    $workspaceId = Auth::user()->current_workspace_id;
    $userId = Auth::id();

    $events = UserCalendarEvent::where('workspace_id', $workspaceId)
      ->where(function ($query) use ($userId) {
        $query->where('is_public', true)
          ->orWhere('user_id', $userId);
      })
      ->with('user:id,name,photo_url')
      ->orderBy('start_date')
      ->get();

    return $this->successResponse($events);
  }

  public function store(Request $request)
  {
    Log::debug('UserCalendarEventController@store hit', [
      'url' => $request->fullUrl(),
      'method' => $request->method(),
      'data' => $request->all()
    ]);

    $validated = $request->validate([
      'title' => 'required|string|max:255',
      'description' => 'nullable|string',
      'start_date' => 'required|date|after:now',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'color' => 'nullable|string|max:20',
      'remind_at' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) use ($request) {
          $start = $request->input('start_date');
          $end = $request->input('end_date');

          if (empty($value) || empty($start)) return;

          // If multi-day event (has end_date), reminder must be before end_date
          if (!empty($end)) {
            if (strtotime($value) > strtotime($end)) {
              $fail('The reminder must be before the end of the event.');
            }
          } else {
            // Single day event: reminder must be strictly before start
            if (strtotime($value) >= strtotime($start)) {
              $fail('The reminder must be before the event starts.');
            }
          }
        },
      ],
      'is_public' => 'nullable|boolean',
    ]);

    // Normalize incoming datetimes using client's timezone header and store in UTC
    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    $normalized = $validated;
    try {
      if (!empty($validated['start_date'])) {
        $normalized['start_date'] = Carbon::parse($validated['start_date'], $clientTz)->setTimezone('UTC');
      }
      if (!empty($validated['end_date'])) {
        $normalized['end_date'] = Carbon::parse($validated['end_date'], $clientTz)->setTimezone('UTC');
      }
      if (!empty($validated['remind_at'])) {
        $normalized['remind_at'] = Carbon::parse($validated['remind_at'], $clientTz)->setTimezone('UTC');
      }
    } catch (\Exception $e) {
      // If parsing fails, leave values as-is and let model/DB handle validation
    }

    $event = UserCalendarEvent::create([
      ...$normalized,
      'user_id' => Auth::id(),
      'workspace_id' => Auth::user()->current_workspace_id,
    ]);

    return $this->successResponse($event, 'Event created successfully', 201);
  }

  public function update(Request $request, string $id)
  {
    Log::debug('UserCalendarEventController@update hit', [
      'id' => $id,
      'url' => $request->fullUrl(),
      'method' => $request->method(),
      'data' => $request->all()
    ]);

    $event = UserCalendarEvent::where('workspace_id', Auth::user()->current_workspace_id)
      ->where('user_id', Auth::id())
      ->findOrFail($id);

    $validated = $request->validate([
      'title' => 'sometimes|required|string|max:255',
      'description' => 'nullable|string',
      'start_date' => 'sometimes|required|date|after:now',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'color' => 'nullable|string|max:20',
      'remind_at' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) use ($request, $event) {
          // Get start/end from request or fallback to existing event data
          $start = $request->input('start_date') ?? $event->start_date;
          $end = $request->input('end_date') ?? $event->end_date;

          if (empty($value)) return;

          // If multi-day event (has end_date), reminder must be before end_date
          if (!empty($end)) {
            if (strtotime($value) > strtotime($end)) {
              $fail('The reminder must be before the end of the event.');
            }
          } else {
            // Single day event: reminder must be strictly before start
            if (strtotime($value) >= strtotime($start)) {
              $fail('The reminder must be before the event starts.');
            }
          }
        },
      ],
      'is_public' => 'nullable|boolean',
    ]);

    // Normalize incoming datetimes using client's timezone header and store in UTC
    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    $normalized = $validated;
    try {
      if (array_key_exists('start_date', $validated) && !empty($validated['start_date'])) {
        $normalized['start_date'] = Carbon::parse($validated['start_date'], $clientTz)->setTimezone('UTC');
      }
      if (array_key_exists('end_date', $validated) && !empty($validated['end_date'])) {
        $normalized['end_date'] = Carbon::parse($validated['end_date'], $clientTz)->setTimezone('UTC');
      }
      if (array_key_exists('remind_at', $validated) && !empty($validated['remind_at'])) {
        $normalized['remind_at'] = Carbon::parse($validated['remind_at'], $clientTz)->setTimezone('UTC');
      }
    } catch (\Exception $e) {
    }

    $event->update($normalized);

    return $this->successResponse($event, 'Event updated successfully');
  }

  public function destroy(string $id)
  {
    // Disabled: Events should only be moved, not deleted
    // Users should reschedule events instead of deleting them
    return $this->errorResponse('Event deletion is not allowed. Please move the event to a different date instead.', 403);
    
    /* Original code commented out:
    $event = UserCalendarEvent::where('workspace_id', Auth::user()->current_workspace_id)
      ->where('user_id', Auth::id())
      ->findOrFail($id);

    $event->delete();

    return $this->successResponse(null, 'Event deleted successfully');
    */
  }
}

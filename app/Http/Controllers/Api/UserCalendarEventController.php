<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserCalendarEvent;
use Illuminate\Support\Facades\Auth;

use App\Traits\ApiResponse;
use Illuminate\Support\Facades\Log;

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
      'start_date' => 'required|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'color' => 'nullable|string|max:20',
      'remind_at' => 'nullable|date|before:start_date',
      'is_public' => 'nullable|boolean',
    ]);

    // Normalize incoming datetimes using client's timezone header and store in UTC
    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    $normalized = $validated;
    try {
      if (!empty($validated['start_date'])) {
        $normalized['start_date'] = \Carbon\Carbon::parse($validated['start_date'], $clientTz)->setTimezone('UTC');
      }
      if (!empty($validated['end_date'])) {
        $normalized['end_date'] = \Carbon\Carbon::parse($validated['end_date'], $clientTz)->setTimezone('UTC');
      }
      if (!empty($validated['remind_at'])) {
        $normalized['remind_at'] = \Carbon\Carbon::parse($validated['remind_at'], $clientTz)->setTimezone('UTC');
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
      'start_date' => 'sometimes|required|date',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'color' => 'nullable|string|max:20',
      'remind_at' => 'nullable|date|before:start_date',
      'is_public' => 'nullable|boolean',
    ]);

    // Normalize incoming datetimes using client's timezone header and store in UTC
    $clientTz = $request->header('X-User-Timezone') ?? config('app.timezone', 'UTC');
    $normalized = $validated;
    try {
      if (array_key_exists('start_date', $validated) && !empty($validated['start_date'])) {
        $normalized['start_date'] = \Carbon\Carbon::parse($validated['start_date'], $clientTz)->setTimezone('UTC');
      }
      if (array_key_exists('end_date', $validated) && !empty($validated['end_date'])) {
        $normalized['end_date'] = \Carbon\Carbon::parse($validated['end_date'], $clientTz)->setTimezone('UTC');
      }
      if (array_key_exists('remind_at', $validated) && !empty($validated['remind_at'])) {
        $normalized['remind_at'] = \Carbon\Carbon::parse($validated['remind_at'], $clientTz)->setTimezone('UTC');
      }
    } catch (\Exception $e) {
      // ignore parsing errors
    }

    $event->update($normalized);

    return $this->successResponse($event, 'Event updated successfully');
  }

  public function destroy(string $id)
  {
    $event = UserCalendarEvent::where('workspace_id', Auth::user()->current_workspace_id)
      ->where('user_id', Auth::id())
      ->findOrFail($id);

    $event->delete();

    return $this->successResponse(null, 'Event deleted successfully');
  }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendSystemNotificationJob;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemNotificationController extends Controller
{
  /**
   * Display the system notification creation page.
   */
  public function index()
  {
    \Illuminate\Support\Facades\Log::emergency('--- CONTROLLER SystemNotificationController@index EXECUTING ---');
    \Illuminate\Support\Facades\Log::warning('HIT SystemNotificationController@index', [
      'user_id' => \Illuminate\Support\Facades\Auth::id(),
      'is_super_admin' => \Illuminate\Support\Facades\Auth::user()?->is_super_admin,
    ]);
    return Inertia::render('Admin/SystemNotifications');
  }

  /**
   * Send a system notification to all users.
   */
  public function send(Request $request)
  {
    $request->validate([
      'title' => 'required|string|max:255',
      'message' => 'required|string',
      'description' => 'nullable|string',
      'type' => 'required|string|in:info,success,warning,error',
      'icon' => 'nullable|string',
    ]);

    SendSystemNotificationJob::dispatch(
      $request->title,
      $request->message,
      $request->description,
      $request->type,
      $request->icon ?? 'Bell'
    );

    return back()->with('success', 'Notification dispatching to all users.');
  }
}

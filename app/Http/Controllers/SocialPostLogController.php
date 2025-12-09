<?php

namespace App\Http\Controllers;

use App\Models\SocialPostLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SocialPostLogController extends Controller
{
  /**
   * Display a listing of social post logs.
   */
  public function index(Request $request)
  {
    $query = SocialPostLog::where('user_id', Auth::id())
      ->with(['socialAccount', 'publication', 'mediaFile']);

    if ($request->has('status') && $request->status !== 'all') {
      $query->where('status', $request->status);
    }

    if ($request->has('platform') && $request->platform !== 'all') {
      $query->where('platform', $request->platform);
    }

    if ($request->has('date_start') && $request->has('date_end')) {
      $query->whereBetween('created_at', [$request->date_start, $request->date_end]);
    }

    $logs = $query->orderBy('created_at', 'desc')->paginate(5);

    return response()->json([
      'success' => true,
      'logs' => $logs,
    ]);
  }
}

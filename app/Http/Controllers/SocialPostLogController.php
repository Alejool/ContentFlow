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
    $query = SocialPostLog::where('workspace_id', Auth::user()->current_workspace_id)
      ->with(['socialAccount', 'publication.campaigns', 'mediaFile']);

    if ($request->has('status') && $request->status !== 'all') {
      $query->where('status', $request->status);
    }

    if ($request->has('platform') && $request->platform !== 'all') {
      $query->where('platform', $request->platform);
    }

    if ($request->has('date_start') && $request->has('date_end')) {
      $query->whereBetween('created_at', [$request->date_start, $request->date_end]);
    }

    $logs = $query->orderBy('updated_at', 'desc')->paginate($request->query('per_page', 10));

    return response()->json([
      'success' => true,
      'logs' => $logs,
    ]);
  }
}

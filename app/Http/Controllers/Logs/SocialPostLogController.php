<?php

namespace App\Http\Controllers\Logs;

use App\Models\Social\SocialPostLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class SocialPostLogController extends Controller
{
  public function index(Request $request)
  {
    $query = SocialPostLog::where('workspace_id', Auth::user()->current_workspace_id)
      ->with(['socialAccount', 'publication.campaigns', 'mediaFile']);

    if ($request->has('status') && $request->status !== 'all') {
      $query->where('status', $request->status);
    }

    if ($request->has('platform') && $request->platform !== 'all' && !empty($request->platform)) {
      $platforms = is_array($request->platform) ? $request->platform : [$request->platform];
      \Log::info('Platform filter:', ['platforms' => $platforms, 'raw' => $request->platform]);
      $query->whereIn('platform', $platforms);
    }

    if ($request->has('date_start') && $request->date_start) {
      $query->where('created_at', '>=', $request->date_start . ' 00:00:00');
    }

    if ($request->has('date_end') && $request->date_end) {
      $query->where('created_at', '<=', $request->date_end . ' 23:59:59');
    }

    $logs = $query->orderBy('updated_at', 'desc')->paginate($request->query('per_page', 10));

    return response()->json([
      'success' => true,
      'logs' => $logs,
    ]);
  }
}

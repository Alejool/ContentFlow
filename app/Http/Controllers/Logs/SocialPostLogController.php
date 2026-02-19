<?php

namespace App\Http\Controllers\Logs;

use App\Models\Social\SocialPostLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;

class SocialPostLogController extends Controller
{
  public function index(Request $request)
  {
    $query = SocialPostLog::where('workspace_id', Auth::user()->current_workspace_id)
      ->with(['socialAccount', 'publication.campaigns', 'mediaFile']);

    if ($request->has('status') && $request->status !== 'all') {
      $query->where('status', $request->status);
    }

    if ($request->has('platform') && !empty($request->platform)) {
      $platforms = $request->input('platform', []);
      if (!is_array($platforms)) {
        $platforms = [$platforms];
      }
      if (!empty($platforms)) {
        $query->whereIn('platform', $platforms);
      }
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

  public function export(Request $request)
  {
    $workspaceId = Auth::user()->current_workspace_id;
    $format = $request->input('format', 'xlsx');
    $filters = $request->only(['status', 'platform', 'date_start', 'date_end']);

    try {
      $export = new \App\Exports\SocialPostLogsExport($filters);
      $filename = 'logs_' . date('Y-m-d_His') . '.' . $format;

      if ($format === 'pdf') {
        return Excel::download($export, $filename, \Maatwebsite\Excel\Excel::DOMPDF);
      }

      return Excel::download($export, $filename);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Export failed: ' . $e->getMessage()
      ], 500);
    }
  }
}

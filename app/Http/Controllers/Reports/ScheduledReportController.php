<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Reports\ScheduledReport;
use App\Services\Reports\ReportGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ScheduledReportController extends Controller
{
    public function index()
    {
        $reports = ScheduledReport::where('workspace_id', Auth::user()->current_workspace_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:publications,analytics,campaigns',
            'frequency' => 'required|in:daily,weekly,monthly',
            'recipients' => 'required|array',
            'recipients.*' => 'email',
            'filters' => 'nullable|array',
        ]);

        $report = ScheduledReport::create([
            ...$validated,
            'workspace_id' => Auth::user()->current_workspace_id,
            'user_id' => Auth::id(),
            'next_send_at' => $this->calculateNextSendDate($validated['frequency']),
        ]);

        return response()->json($report, 201);
    }

    public function update(Request $request, ScheduledReport $report)
    {
        $this->authorize('update', $report);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'type' => 'in:publications,analytics,campaigns',
            'frequency' => 'in:daily,weekly,monthly',
            'recipients' => 'array',
            'recipients.*' => 'email',
            'filters' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['frequency'])) {
            $validated['next_send_at'] = $this->calculateNextSendDate($validated['frequency']);
        }

        $report->update($validated);

        return response()->json($report);
    }

    public function destroy(ScheduledReport $report)
    {
        $this->authorize('delete', $report);

        $report->delete();

        return response()->json(null, 204);
    }

    public function preview(ScheduledReport $report, ReportGeneratorService $reportService)
    {
        $this->authorize('view', $report);

        $data = $reportService->generateReport($report);

        return response()->json($data);
    }

    protected function calculateNextSendDate(string $frequency): Carbon
    {
        return match ($frequency) {
            'daily' => Carbon::tomorrow()->hour(8),
            'weekly' => Carbon::now()->addWeek()->startOfWeek()->hour(8),
            'monthly' => Carbon::now()->addMonth()->startOfMonth()->hour(8),
            default => Carbon::tomorrow()->hour(8),
        };
    }
}

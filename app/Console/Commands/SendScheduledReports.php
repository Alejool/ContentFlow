<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Reports\ScheduledReport;
use App\Services\Reports\ReportGeneratorService;
use App\Mail\ScheduledReportMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendScheduledReports extends Command
{
    protected $signature = 'reports:send';
    protected $description = 'Send scheduled reports via email';

    public function handle(ReportGeneratorService $reportService): int
    {
        $reports = ScheduledReport::dueToSend()->get();

        $this->info("Found {$reports->count()} reports to send");

        foreach ($reports as $report) {
            try {
                $data = $reportService->generateReport($report);

                foreach ($report->recipients as $recipient) {
                    Mail::to($recipient)->send(new ScheduledReportMail($report, $data));
                }

                $report->update([
                    'last_sent_at' => now(),
                    'next_send_at' => $this->calculateNextSendDate($report->frequency),
                ]);

                $this->info("Sent report: {$report->name}");
            } catch (\Exception $e) {
                $this->error("Failed to send report {$report->name}: {$e->getMessage()}");
            }
        }

        return Command::SUCCESS;
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

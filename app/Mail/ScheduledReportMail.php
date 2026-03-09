<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Reports\ScheduledReport;

class ScheduledReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ScheduledReport $report,
        public array $data
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->report->name} - {$this->data['period']}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.scheduled-report',
            with: [
                'report' => $this->report,
                'data' => $this->data,
            ],
        );
    }
}

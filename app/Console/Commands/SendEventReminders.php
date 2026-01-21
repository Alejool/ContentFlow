<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\UserCalendarEvent;
use App\Notifications\EventReminderNotification;

class SendEventReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-event-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications for calendar events that have a pending reminder';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $events = UserCalendarEvent::where('notification_sent', false)
            ->whereNotNull('remind_at')
            ->where('remind_at', '<=', now())
            ->with('user')
            ->get();

        $count = 0;
        foreach ($events as $event) {
            if ($event->user) {
                $event->user->notify(new EventReminderNotification($event));
                $event->update(['notification_sent' => true]);
                $count++;
            }
        }

        $this->info("Sent {$count} event reminders.");
    }
}

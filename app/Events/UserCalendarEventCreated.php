<?php

namespace App\Events;

use App\Models\User\UserCalendarEvent;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserCalendarEventCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public UserCalendarEvent $userEvent;

    public function __construct(UserCalendarEvent $userEvent)
    {
        $this->userEvent = $userEvent;
    }
}

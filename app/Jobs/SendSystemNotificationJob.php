<?php

namespace App\Jobs;

use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Notification;

class SendSystemNotificationJob implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  /**
   * Create a new job instance.
   */
  public function __construct(
    protected string $title,
    protected string $message,
    protected ?string $description = null,
    protected string $type = 'info',
    protected ?string $icon = 'Bell'
  ) {}

  /**
   * Execute the job.
   */
  public function handle(): void
  {
    User::query()->chunk(100, function ($users) {
      $notification = new SystemNotification(
        $this->title,
        $this->message,
        $this->description,
        $this->type,
        $this->icon
      );

      Notification::send($users, $notification);
    });
  }
}

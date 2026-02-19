<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class ProcessingProgressUpdated implements ShouldBroadcast
{
  public function __construct(
    public int $userId,
    public string $jobId,
    public int $publicationId,
    public array $progressData
  ) {}

  public function broadcastOn()
  {
    return new PrivateChannel("users.{$this->userId}");
  }

  public function broadcastAs()
  {
    return 'ProcessingProgressUpdated';
  }

  public function broadcastWith()
  {
    return [
      'jobId' => $this->jobId,
      'publicationId' => $this->publicationId,
      'progress' => $this->progressData['progress'] ?? 0,
      'currentStep' => $this->progressData['current_step'] ?? '',
      'completedSteps' => $this->progressData['completed_steps'] ?? 0,
      'totalSteps' => $this->progressData['total_steps'] ?? 0,
      'eta' => $this->progressData['eta'] ?? null,
      'updatedAt' => $this->progressData['updated_at'] ?? now()->timestamp,
    ];
  }
}

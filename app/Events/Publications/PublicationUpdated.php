<?php

namespace App\Events\Publications;

use App\Models\Publications\Publication;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use App\Models\User;

class PublicationUpdated implements ShouldBroadcast
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public $publication;
  public $workspaceId;

  /**
   * Create a new event instance.
   */
  public function __construct(Publication $publication)
  {
    $this->publication = $publication;
    $this->workspaceId = $publication->workspace_id;
  }

  /**
   * Get the channels the event should broadcast on.
   *
   * @return array<int, \Illuminate\Broadcasting\Channel>
   */
  public function broadcastOn(): array
  {
    return [
      new PrivateChannel('workspace.' . $this->workspaceId),
    ];
  }

  public function broadcastAs()
  {
    return 'publication.updated';
  }

  public function broadcastWith()
  {
    // Load relationships if not already loaded
    if (!$this->publication->relationLoaded('scheduled_posts')) {
      $this->publication->load('scheduled_posts.socialAccount');
    }
    if (!$this->publication->relationLoaded('socialPostLogs')) {
      $this->publication->load('socialPostLogs.socialAccount');
    }

    return [
      'publication' => [
        'id' => $this->publication->id,
        'title' => $this->publication->title,
        'status' => $this->publication->status,
        'workspace_id' => $this->publication->workspace_id,
        'updated_at' => $this->publication->updated_at,
        'scheduled_at' => $this->publication->scheduled_at,
        'scheduled_posts' => $this->publication->scheduled_posts->map(function ($sp) {
          return [
            'id' => $sp->id,
            'social_account_id' => $sp->social_account_id,
            'scheduled_at' => $sp->scheduled_at,
            'status' => $sp->status,
            'platform' => $sp->platform,
            'account_name' => $sp->account_name,
          ];
        }),
        'social_post_logs' => $this->publication->socialPostLogs->map(function ($log) {
          return [
            'id' => $log->id,
            'social_account_id' => $log->social_account_id,
            'status' => $log->status,
            'platform' => $log->platform,
          ];
        }),
      ],
    ];
  }
}

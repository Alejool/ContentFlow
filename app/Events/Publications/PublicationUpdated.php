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
    // Load only essential relationships to keep payload small
    // Activities and approval logs should be fetched separately when needed
    $this->publication->load([
      'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name', 'media_files.size', 'media_files.mime_type')->limit(5),
      'mediaFiles.thumbnail' => fn($q) => $q->select('id', 'media_file_id', 'file_path', 'file_name', 'derivative_type'),
      'scheduled_posts' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'scheduled_at'),
      'scheduled_posts.socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'socialPostLogs' => fn($q) => $q->select('id', 'publication_id', 'social_account_id', 'status', 'published_at'),
      'campaigns' => fn($q) => $q->select('campaigns.id', 'campaigns.name', 'campaigns.status'),
      'user' => fn($q) => $q->select('users.id', 'users.name', 'users.email', 'users.photo_url'),
      'publisher' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
      'rejector' => fn($q) => $q->select('users.id', 'users.name', 'users.photo_url'),
    ]);

    // Append media lock info
    $mediaLockUserId = cache()->get("publication:{$this->publication->id}:media_lock");
    $mediaLockedBy = null;
    if ($mediaLockUserId) {
      $mediaLockedBy = User::find($mediaLockUserId)?->only(['id', 'name', 'photo_url']);
    }
    $this->publication->media_locked_by = $mediaLockedBy;

    return [
      'publication' => $this->publication,
    ];
  }
}

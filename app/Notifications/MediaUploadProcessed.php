<?php

namespace App\Notifications;

use App\Models\MediaFiles\MediaFile;
use App\Models\Publications\Publication;

class MediaUploadProcessed extends BaseNotification
{
  protected string $priority = self::PRIORITY_NORMAL;
  protected string $category = self::CATEGORY_APPLICATION;

  public function __construct(
    protected Publication $publication,
    protected MediaFile $mediaFile,
    protected string $status
  ) {}

  public function toArray($notifiable): array
  {
    $isSuccess = $this->status === 'success';

    return [
      'id' => $this->id,
      'title' => $isSuccess ? 'Media Processing Complete' : 'Media Processing Failed',
      'message' => $isSuccess
        ? "Your media file '{$this->mediaFile->file_name}' for '{$this->publication->title}' is ready."
        : "Failed to process '{$this->mediaFile->file_name}'. Please try again.",
      'type' => $isSuccess ? 'success' : 'error',
      'publication_id' => $this->publication->id,
      'status' => $this->status,
      'action' => $this->createAction(
        'View Publication',
        route('publications.show', $this->publication->id)
      ),
    ];
  }
}

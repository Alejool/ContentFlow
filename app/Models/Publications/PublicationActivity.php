<?php

namespace App\Models\Publications;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class PublicationActivity extends Model
{
  use HasFactory;

  // Activity type constants
  const TYPE_CREATED = 'created';
  const TYPE_UPDATED = 'updated';
  const TYPE_TITLE_CHANGED = 'title_changed';
  const TYPE_CONTENT_CHANGED = 'content_changed';
  const TYPE_IMAGE_CHANGED = 'image_changed';
  const TYPE_CAPTION_CHANGED = 'caption_changed';
  const TYPE_SCHEDULED_TIME_CHANGED = 'scheduled_time_changed';
  const TYPE_STATUS_CHANGED = 'status_changed';
  const TYPE_PLATFORMS_CHANGED = 'platforms_changed';
  const TYPE_MEDIA_CHANGED = 'media_changed';
  const TYPE_HASHTAGS_CHANGED = 'hashtags_changed';
  const TYPE_REQUESTED_APPROVAL = 'requested_approval';
  const TYPE_APPROVED = 'approved';
  const TYPE_REJECTED = 'rejected';
  const TYPE_SCHEDULED = 'scheduled';
  const TYPE_PUBLISHING = 'publishing';
  const TYPE_PUBLISHED = 'published';
  const TYPE_FAILED = 'failed';
  const TYPE_CANCELLED = 'cancelled';

  protected $fillable = [
    'publication_id',
    'user_id',
    'type',
    'details',
  ];

  protected $casts = [
    'details' => 'array',
  ];

  protected $appends = ['formatted_changes'];

  public function getFormattedChangesAttribute()
  {
    return $this->getFormattedChanges();
  }

  public function getDescriptionAttribute()
  {
    return $this->getDescription();
  }

  public function publication(): BelongsTo
  {
    return $this->belongsTo(Publication::class);
  }

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * Get human-readable description of the activity
   *
   * @return string
   */
  public function getDescription(): string
  {
    $userName = $this->user ? $this->user->name : 'Sistema';
    $details = $this->details ?? [];

    return match ($this->type) {
      self::TYPE_CREATED => "{$userName} creó la publicación",

      self::TYPE_TITLE_CHANGED => sprintf(
        "%s cambió el título de '%s' a '%s'",
        $userName,
        $details['before'] ?? '',
        $details['after'] ?? ''
      ),

      self::TYPE_CONTENT_CHANGED => "{$userName} editó el contenido",

      self::TYPE_IMAGE_CHANGED => $this->getImageChangeDescription($userName, $details),

      self::TYPE_CAPTION_CHANGED => "{$userName} editó el pie de foto",

      self::TYPE_SCHEDULED_TIME_CHANGED => sprintf(
        "%s cambió la fecha de programación a %s",
        $userName,
        isset($details['after']) ? Carbon::parse($details['after'])->format('d/m/Y H:i') : ''
      ),

      self::TYPE_STATUS_CHANGED => sprintf(
        "%s cambió el estado de '%s' a '%s'",
        $userName,
        $this->translateStatus($details['before'] ?? ''),
        $this->translateStatus($details['after'] ?? '')
      ),

      self::TYPE_PLATFORMS_CHANGED => $this->getPlatformsChangeDescription($userName, $details),

      self::TYPE_MEDIA_CHANGED => "{$userName} cambió los archivos multimedia",

      self::TYPE_HASHTAGS_CHANGED => "{$userName} modificó los hashtags",

      self::TYPE_REQUESTED_APPROVAL => "{$userName} solicitó revisión",

      self::TYPE_APPROVED => "{$userName} aprobó la publicación",

      self::TYPE_REJECTED => "{$userName} rechazó la publicación" . (isset($details['reason']) ? ": {$details['reason']}" : ""),

      self::TYPE_SCHEDULED => "{$userName} programó la publicación",

      self::TYPE_PUBLISHING => "{$userName} inició la publicación",

      self::TYPE_PUBLISHED => "{$userName} completó la publicación",

      self::TYPE_FAILED => "{$userName} falló al publicar",

      self::TYPE_CANCELLED => "{$userName} canceló la publicación",

      default => "{$userName} actualizó la publicación",
    };
  }

  /**
   * Get description for image changes
   */
  private function getImageChangeDescription(string $userName, array $details): string
  {
    $action = $details['action'] ?? 'replaced';

    return match ($action) {
      'added' => "{$userName} agregó una imagen",
      'removed' => "{$userName} eliminó la imagen",
      'replaced' => "{$userName} cambió la imagen",
      default => "{$userName} modificó la imagen",
    };
  }

  /**
   * Get description for platform changes
   */
  private function getPlatformsChangeDescription(string $userName, array $details): string
  {
    $added = $details['added'] ?? [];
    $removed = $details['removed'] ?? [];

    $parts = [];

    if (!empty($added)) {
      $platforms = implode(', ', array_map('ucfirst', $added));
      $parts[] = "agregó {$platforms}";
    }

    if (!empty($removed)) {
      $platforms = implode(', ', array_map('ucfirst', $removed));
      $parts[] = "eliminó {$platforms}";
    }

    $changes = implode(' y ', $parts);
    return "{$userName} {$changes}";
  }

  /**
   * Translate status to Spanish
   */
  private function translateStatus(string $status): string
  {
    return match ($status) {
      'draft' => 'borrador',
      'scheduled' => 'programada',
      'published' => 'publicada',
      'publishing' => 'publicando',
      'failed' => 'fallida',
      'pending_review' => 'pendiente de revisión',
      'approved' => 'aprobada',
      default => $status,
    };
  }

  /**
   * Get formatted changes for display
   *
   * @return array
   */
  public function getFormattedChanges(): array
  {
    $details = $this->details ?? [];

    if (isset($details['before']) && isset($details['after'])) {
      return [
        'has_comparison' => true,
        'before' => $details['before'],
        'after' => $details['after'],
      ];
    }

    return [
      'has_comparison' => false,
      'data' => $details,
      'added' => $details['added'] ?? [],
      'removed' => $details['removed'] ?? [],
    ];
  }

  /**
   * Scope to get recent activities
   */
  public function scopeRecent($query, int $limit = 20)
  {
    return $query->latest()->limit($limit);
  }
}

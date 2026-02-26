<?php

namespace App\Observers;

use App\Models\Publications\Publication;
use App\Models\Publications\PublicationActivity;
use Illuminate\Support\Facades\Auth;

class PublicationObserver
{
  /**
   * Handle the Publication "created" event.
   */
  public function created(Publication $publication): void
  {
    PublicationActivity::create([
      'publication_id' => $publication->id,
      'user_id' => Auth::id(),
      'type' => PublicationActivity::TYPE_CREATED,
      'details' => [
        'title' => $publication->title,
        'platforms' => $publication->platforms ?? [],
        'status' => $publication->status,
      ],
    ]);

    // Dispatch event for external calendar sync
    event(new \App\Events\Publications\PublicationCreated($publication));
  }

  /**
   * Handle the Publication "updated" event.
   */
  public function updated(Publication $publication): void
  {
    // Dispatch event for external calendar sync
    event(new \App\Events\Publications\PublicationUpdated($publication));
  }

  /**
   * Handle the Publication "deleting" event.
   */
  public function deleting(Publication $publication): void
  {
    // Dispatch event for external calendar sync before deletion
    event(new \App\Events\Publications\PublicationDeleted($publication));
  }

  /**
   * Handle the Publication "updating" event.
   * This fires BEFORE the update, so we can capture before/after
   */
  public function updating(Publication $publication): void
  {
    // Check if approval should be revoked due to content changes
    $this->checkApprovalRevocation($publication);

    $changes = $publication->getDirty();
    $original = $publication->getOriginal();

    foreach ($changes as $field => $newValue) {
      $oldValue = $original[$field] ?? null;

      // Skip if values are the same
      if ($oldValue === $newValue) {
        continue;
      }

      $this->logFieldChange($publication, $field, $oldValue, $newValue);
    }
  }

  /**
   * Check if approval should be revoked due to content changes
   */
  private function checkApprovalRevocation(Publication $publication): void
  {
    // Only check if currently approved
    if ($publication->getOriginal('status') !== 'approved') {
      return;
    }

    // Critical fields that require re-approval if changed
    $criticalFields = ['title', 'body', 'description', 'hashtags', 'platform_settings'];
    
    $changes = $publication->getDirty();
    
    // Don't revoke if only status is changing (system processes)
    if (count($changes) === 1 && isset($changes['status'])) {
      return;
    }

    $hasCriticalChanges = !empty(array_intersect(array_keys($changes), $criticalFields));

    if ($hasCriticalChanges) {
      // Revoke approval
      $publication->status = 'draft';
      $publication->approved_by = null;
      $publication->approved_at = null;
      $publication->approved_retries_remaining = 2;

      // Log the revocation
      PublicationActivity::create([
        'publication_id' => $publication->id,
        'user_id' => Auth::id(),
        'type' => 'approval_revoked',
        'details' => [
          'reason' => 'Content was modified after approval',
          'modified_fields' => array_keys(array_intersect_key($changes, array_flip($criticalFields))),
        ],
      ]);
    }
  }

  /**
   * Log a specific field change
   */
  private function logFieldChange(Publication $publication, string $field, $oldValue, $newValue): void
  {
    $activityType = $this->getActivityTypeForField($field);

    if (!$activityType) {
      return; // Skip fields we don't track
    }

    $details = $this->formatFieldChange($field, $oldValue, $newValue);

    PublicationActivity::create([
      'publication_id' => $publication->id,
      'user_id' => Auth::id(),
      'type' => $activityType,
      'details' => $details,
    ]);
  }

  /**
   * Map field names to activity types
   */
  private function getActivityTypeForField(string $field): ?string
  {
    return match ($field) {
      'title' => PublicationActivity::TYPE_TITLE_CHANGED,
      'content' => PublicationActivity::TYPE_CONTENT_CHANGED,
      'caption' => PublicationActivity::TYPE_CAPTION_CHANGED,
      'scheduled_at' => PublicationActivity::TYPE_SCHEDULED_TIME_CHANGED,
      'platforms' => PublicationActivity::TYPE_PLATFORMS_CHANGED,
      'hashtags' => PublicationActivity::TYPE_HASHTAGS_CHANGED,
      default => null, // Don't track this field
    };
  }

  /**
   * Format the change details based on field type
   */
  private function formatFieldChange(string $field, $oldValue, $newValue): array
  {
    // Handle special cases
    if ($field === 'platforms') {
      return $this->formatPlatformsChange($oldValue, $newValue);
    }

    if ($field === 'hashtags') {
      return $this->formatHashtagsChange($oldValue, $newValue);
    }

    // Default: simple before/after
    return [
      'before' => $oldValue,
      'after' => $newValue,
    ];
  }

  /**
   * Format platforms change to show added/removed
   */
  private function formatPlatformsChange($oldPlatforms, $newPlatforms): array
  {
    $oldRaw = is_array($oldPlatforms) ? $oldPlatforms : json_decode($oldPlatforms ?? '[]', true);
    $old = is_array($oldRaw) ? $oldRaw : [];

    $newRaw = is_array($newPlatforms) ? $newPlatforms : json_decode($newPlatforms ?? '[]', true);
    $new = is_array($newRaw) ? $newRaw : [];

    $added = array_diff($new, $old);
    $removed = array_diff($old, $new);

    return [
      'added' => array_values($added),
      'removed' => array_values($removed),
      'before' => $old,
      'after' => $new,
    ];
  }

  /**
   * Format hashtags change
   */
  private function formatHashtagsChange($oldHashtags, $newHashtags): array
  {
    $oldRaw = is_array($oldHashtags) ? $oldHashtags : json_decode($oldHashtags ?? '[]', true);
    $old = is_array($oldRaw) ? $oldRaw : [];

    $newRaw = is_array($newHashtags) ? $newHashtags : json_decode($newHashtags ?? '[]', true);
    $new = is_array($newRaw) ? $newRaw : [];

    return [
      'before' => $old,
      'after' => $new,
      'added' => array_values(array_diff($new, $old)),
      'removed' => array_values(array_diff($old, $new)),
    ];
  }
}

<?php

namespace App\Traits;

use Carbon\Carbon;

trait HandlesUtcDates
{
  /**
   * Boot the trait and register the saving observer.
   */
  protected static function bootHandlesUtcDates()
  {
    static::saving(function ($model) {
      $utcFields = $model->getUtcDateFields();

      foreach ($utcFields as $field) {
        if (isset($model->{$field}) && !empty($model->{$field})) {
          // Explicit UTC conversion
          $model->{$field} = Carbon::parse($model->{$field})->utc();
        }
      }
    });
  }

  /**
   * Get the fields that should be converted to UTC.
   * Override this in the model if necessary.
   */
  protected function getUtcDateFields(): array
  {
    return property_exists($this, 'utcDateFields') ? $this->utcDateFields : [];
  }
}

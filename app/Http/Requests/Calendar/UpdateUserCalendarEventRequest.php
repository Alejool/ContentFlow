<?php

namespace App\Http\Requests\Calendar;

use App\Models\User\UserCalendarEvent;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserCalendarEventRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }

  public function rules(): array
  {
    return [
      'title' => 'sometimes|required|string|max:255',
      'description' => 'nullable|string',
      'start_date' => 'sometimes|required|date|after:now',
      'end_date' => 'nullable|date|after_or_equal:start_date',
      'color' => 'nullable|string|max:20',
      'remind_at' => [
        'nullable',
        'date',
        function ($attribute, $value, $fail) {
          // Get start/end from request or fallback to existing event data
          $event = UserCalendarEvent::find($this->route('id'));
          $start = $this->input('start_date') ?? $event?->start_date;
          $end = $this->input('end_date') ?? $event?->end_date;

          if (empty($value)) return;

          // If multi-day event (has end_date), reminder must be before end_date
          if (!empty($end)) {
            if (strtotime($value) > strtotime($end)) {
              $fail('The reminder must be before the end of the event.');
            }
          } else {
            // Single day event: reminder must be strictly before start
            if (strtotime($value) >= strtotime($start)) {
              $fail('The reminder must be before the event starts.');
            }
          }
        },
      ],
      'is_public' => 'nullable|boolean',
    ];
  }
}

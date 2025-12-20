<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Publications\Publication;

class StorePublicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (Publication::where('title', $value)->exists()) {
                        $fail('Publication already exists');
                    }
                },
            ],
            'description' => 'required|string',
            'hashtags' => 'nullable|string',
            'goal' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:draft,published',
            'scheduled_at' => 'nullable|date|after:now',
            'social_accounts' => 'nullable|array',
            'social_accounts.*' => 'exists:social_accounts,id',
            'platform_settings' => 'nullable|string',
            'campaign_id' => 'nullable|exists:campaigns,id',
            'media' => 'nullable|array',
            'media.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi|max:51200',
            'youtube_types' => 'nullable|array',
            'durations' => 'nullable|array',
            'thumbnails' => 'nullable|array',
        ];
    }
}

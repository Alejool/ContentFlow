<?php

namespace App\Http\Requests\Media;

use Illuminate\Foundation\Http\FormRequest;

class DownloadMediaRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'key' => 'required|string',
            'type' => 'nullable|string|in:image,video,pdf,audio',
        ];
    }
}

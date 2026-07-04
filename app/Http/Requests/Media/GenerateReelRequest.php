<?php

namespace App\Http\Requests\Media;

use Illuminate\Foundation\Http\FormRequest;

class GenerateReelRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'media_file_id' => 'required|exists:media_files,id',
            'publication_id' => 'nullable|exists:publications,id',
            'platforms' => 'nullable|array',
            'platforms.*' => 'in:instagram,tiktok,youtube_shorts',
            'add_subtitles' => 'nullable|boolean',
            'language' => 'nullable|string|in:es,en,fr,de,pt',
        ];
    }
}

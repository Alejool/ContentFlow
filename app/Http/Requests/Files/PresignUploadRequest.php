<?php

namespace App\Http\Requests\Files;

use Illuminate\Foundation\Http\FormRequest;

class PresignUploadRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'fileName' => 'required|string|max:255',
            'mimeType' => 'required|string|max:100',
            'size' => 'required|integer|min:1|max:5368709120', // 5GB max
            'uploadType' => 'sometimes|string|in:publication,avatar,reel,document',
        ];
    }
}

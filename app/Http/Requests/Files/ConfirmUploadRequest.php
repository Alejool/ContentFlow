<?php

namespace App\Http\Requests\Files;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmUploadRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            's3Key' => 'required|string',
            'fileName' => 'required|string|max:255',
            'mimeType' => 'required|string|max:100',
            'size' => 'required|integer|min:1',
        ];
    }
}

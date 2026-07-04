<?php

namespace App\Http\Requests\Publications;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:publication_comments,id',
        ];
    }
}

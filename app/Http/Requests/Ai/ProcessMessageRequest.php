<?php

namespace App\Http\Requests\Ai;

use Illuminate\Foundation\Http\FormRequest;

class ProcessMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => 'required|string|max:2000',
            'context' => 'nullable|array',
            'provider' => 'nullable|string|in:deepseek,gemini,openai,anthropic',
            'source' => 'nullable|string|in:chat,assistant',
        ];
    }
}

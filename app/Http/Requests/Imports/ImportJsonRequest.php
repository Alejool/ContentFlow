<?php

namespace App\Http\Requests\Imports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

class ImportJsonRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $workspaceId = $user?->current_workspace_id ?? $user?->workspaces()->first()?->id;

        return $workspaceId && $user->hasPermission('manage-content', $workspaceId);
    }

    public function rules(): array
    {
        return [
            'file' => 'required_without:payload|file|extensions:json,txt|max:10240',
            'payload' => 'required_without:file|string',
        ];
    }

    /**
     * Decoded JSON body, from the uploaded file or the raw payload field.
     *
     * @throws ValidationException when the content is not valid JSON
     */
    public function jsonPayload(): array
    {
        $content = $this->hasFile('file')
            ? $this->file('file')->get()
            : (string) $this->input('payload');

        $decoded = json_decode($content, true);

        if (!is_array($decoded)) {
            throw ValidationException::withMessages([
                'file' => ['El contenido no es un JSON válido: ' . json_last_error_msg()],
            ]);
        }

        return $decoded;
    }
}

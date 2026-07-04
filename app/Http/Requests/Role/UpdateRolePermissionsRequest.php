<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
            'name'        => 'sometimes|string|max:64',
            'description' => 'sometimes|nullable|string|max:255',
            'color_hex'   => ['sometimes', 'nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'icon_slug'   => 'sometimes|nullable|string|max:64',
        ];
    }
}

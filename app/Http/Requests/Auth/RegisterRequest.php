<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|max:255',
            'provider' => 'nullable|string',
            'provider_id' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'locale' => 'nullable|string|in:en,es',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Ya existe una cuenta con ese correo electrónico.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'name.required' => 'El nombre es obligatorio.',
        ];
    }
}

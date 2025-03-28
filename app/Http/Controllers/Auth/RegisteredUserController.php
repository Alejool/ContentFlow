<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
     
        // Validar los datos del usuario
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'provider' => 'nullable|string', // Proveedor (google, etc.)
            'provider_id' => 'nullable|string', // ID único del proveedor
            'photo_url' => 'nullable|string', // URL de la foto de perfil
        ]);

        // Crear o actualizar el usuario
        $user = User::updateOrCreate(
            ['email' => $request->email], // Buscar por email
            [
                'name' => $request->name,
                'email' => $request->email,
                'provider' => $request->provider,
                'provider_id' => $request->provider_id,
                'photo_url' => $request->photo_url,
                'password' => Hash::make(uniqid()), // Generar una contraseña aleatoria
            ]
        );

        return response()->json([
            'message' => 'user saved successfully.',
            'user' => $user,
        ]);
    }
}



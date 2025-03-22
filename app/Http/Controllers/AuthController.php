<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\FirebaseService;

class AuthController extends Controller
{
    protected $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    public function verifyFirebaseToken(Request $request)
    {
        // Validar que el token esté presente en la solicitud
        $request->validate([
            'token' => 'required|string',
        ]);

        // Obtener el token de la solicitud
        $token = $request->input('token');

        // Verificar el token usando FirebaseService
        $uid = $this->firebaseService->verifyToken($token);

        if ($uid) {
            // El token es válido
            return response()->json([
                'message' => 'Authenticated',
                'uid' => $uid,
            ], 200);
        }

        // El token no es válido
        return response()->json([
            'error' => 'Invalid token',
        ], 401);
    }
}
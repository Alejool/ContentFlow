<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserLocaleController extends Controller
{
    /**
     * Actualiza el idioma preferido del usuario
     */
    public function update(UpdateUserLocaleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'User not authenticated',
            ], 401);
        }

        $user->locale = $validated['locale'];
        $user->save();

        return response()->json([
            'message' => 'Locale updated successfully',
            'locale' => $user->locale,
        ]);
    }

    /**
     * Obtiene el idioma preferido del usuario
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'locale' => 'es', // Default
            ]);
        }

        return response()->json([
            'locale' => $user->locale ?? 'es',
        ]);
    }
}

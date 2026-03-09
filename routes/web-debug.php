<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Models\WorkspaceAddon;

// Ruta temporal de diagnóstico - ELIMINAR EN PRODUCCIÓN
Route::get('/debug/current-user-addons', function () {
    $user = Auth::user();
    
    if (!$user) {
        return response()->json([
            'error' => 'No hay usuario autenticado',
            'message' => 'Debes iniciar sesión primero'
        ]);
    }
    
    $workspace = $user->currentWorkspace;
    
    $data = [
        'user' => [
            'id' => $user->id,
            'email' => $user->email,
            'current_workspace_id' => $user->current_workspace_id,
        ],
        'workspace' => $workspace ? [
            'id' => $workspace->id,
            'name' => $workspace->name,
        ] : null,
        'addons_in_current_workspace' => $workspace ? WorkspaceAddon::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'sku' => $a->addon_sku,
                'type' => $a->addon_type,
                'amount' => $a->total_amount,
                'used' => $a->used_amount,
            ]) : [],
        'all_addons' => WorkspaceAddon::all()->map(fn($a) => [
            'id' => $a->id,
            'workspace_id' => $a->workspace_id,
            'sku' => $a->addon_sku,
            'type' => $a->addon_type,
        ]),
    ];
    
    return response()->json($data, 200, [], JSON_PRETTY_PRINT);
})->middleware('auth');

<?php

namespace App\Console\Commands;

use App\Models\WorkspaceAddon;
use App\Models\User;
use Illuminate\Console\Command;

class AddTestAddonToCurrentUser extends Command
{
    protected $signature = 'addons:add-test {user_id?}';
    protected $description = 'Agregar un addon de prueba al workspace del usuario especificado o al primero disponible';

    public function handle()
    {
        $userId = $this->argument('user_id');
        
        if ($userId) {
            $user = User::find($userId);
        } else {
            // Obtener el primer usuario disponible
            $user = User::first();
        }
        
        if (!$user) {
            $this->error('No se encontró ningún usuario');
            return 1;
        }
        
        $this->info("Usuario: {$user->email} (ID: {$user->id})");
        
        $workspace = $user->currentWorkspace;
        
        if (!$workspace) {
            $this->error('El usuario no tiene un workspace actual asignado');
            $this->line('Asignando el primer workspace disponible...');
            
            $workspace = $user->workspaces()->first();
            
            if (!$workspace) {
                $this->error('El usuario no pertenece a ningún workspace');
                return 1;
            }
            
            $user->current_workspace_id = $workspace->id;
            $user->save();
            
            $this->info("Workspace asignado: {$workspace->name} (ID: {$workspace->id})");
        } else {
            $this->info("Workspace actual: {$workspace->name} (ID: {$workspace->id})");
        }
        
        // Verificar si ya tiene addons
        $existingAddons = WorkspaceAddon::where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->count();
        
        $this->line("Addons activos existentes: {$existingAddons}");
        
        // Crear addon de prueba
        $addon = WorkspaceAddon::create([
            'workspace_id' => $workspace->id,
            'addon_type' => 'ai_credits',
            'addon_sku' => 'ai_500',
            'quantity' => 1,
            'total_amount' => 500,
            'used_amount' => 120,
            'price_paid' => 39.99,
            'purchased_at' => now(),
            'expires_at' => null,
            'is_active' => true,
        ]);
        
        $this->info("✓ Addon creado exitosamente:");
        $this->line("  - ID: {$addon->id}");
        $this->line("  - SKU: {$addon->addon_sku}");
        $this->line("  - Tipo: {$addon->addon_type}");
        $this->line("  - Cantidad: {$addon->total_amount}");
        $this->line("  - Usado: {$addon->used_amount}");
        $this->line("  - Restante: " . ($addon->total_amount - $addon->used_amount));
        
        $this->newLine();
        $this->info('Ahora recarga la página de addons en el navegador');
        
        return 0;
    }
}

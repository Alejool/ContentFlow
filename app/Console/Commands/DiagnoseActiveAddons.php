<?php

namespace App\Console\Commands;

use App\Models\WorkspaceAddon;
use App\Models\Workspace\Workspace;
use App\Models\User;
use Illuminate\Console\Command;

class DiagnoseActiveAddons extends Command
{
    protected $signature = 'diagnose:active-addons';
    protected $description = 'Diagnosticar por qué no se muestran los addons activos';

    public function handle()
    {
        $this->info('=== DIAGNÓSTICO DE ADDONS ACTIVOS ===');
        $this->newLine();

        // 1. Verificar addons en la base de datos
        $this->info('1. Addons en la base de datos:');
        $addons = WorkspaceAddon::all();
        $this->table(
            ['ID', 'Workspace ID', 'SKU', 'Type', 'Amount', 'Used', 'Active'],
            $addons->map(fn($a) => [
                $a->id,
                $a->workspace_id,
                $a->addon_sku,
                $a->addon_type,
                $a->total_amount,
                $a->used_amount,
                $a->is_active ? 'Sí' : 'No'
            ])
        );
        $this->newLine();

        // 2. Verificar workspace
        $this->info('2. Información del Workspace:');
        $workspace = Workspace::find(35);
        if ($workspace) {
            $this->line("  - ID: {$workspace->id}");
            $this->line("  - Nombre: {$workspace->name}");
            $this->line("  - Owner ID: {$workspace->owner_id}");
        } else {
            $this->error('  Workspace 35 no encontrado');
        }
        $this->newLine();

        // 3. Verificar usuarios con acceso al workspace
        $this->info('3. Usuarios con acceso al workspace 35:');
        if ($workspace) {
            $members = $workspace->users()->get();
            if ($members->count() > 0) {
                $this->table(
                    ['User ID', 'Email', 'Current Workspace ID'],
                    $members->map(fn($u) => [
                        $u->id,
                        $u->email,
                        $u->current_workspace_id ?? 'NULL'
                    ])
                );
            } else {
                $this->warn('  No hay miembros en este workspace');
            }
        }
        $this->newLine();

        // 4. Probar el controlador
        $this->info('4. Probando el endpoint de la API:');
        if ($workspace && $workspace->users()->count() > 0) {
            $user = $workspace->users()->first();
            $this->line("  - Usuario de prueba: {$user->email}");
            $this->line("  - Current workspace: " . ($user->current_workspace_id ?? 'NULL'));
            
            // Simular la lógica del controlador
            $currentWorkspace = $user->currentWorkspace;
            if ($currentWorkspace) {
                $this->line("  - Current workspace ID: {$currentWorkspace->id}");
                $this->line("  - Current workspace nombre: {$currentWorkspace->name}");
                
                $workspaceAddons = WorkspaceAddon::where('workspace_id', $currentWorkspace->id)
                    ->where('is_active', true)
                    ->get();
                
                $this->line("  - Addons activos encontrados: {$workspaceAddons->count()}");
            } else {
                $this->error('  El usuario no tiene un workspace actual asignado');
            }
        }
        $this->newLine();

        // 5. Recomendaciones
        $this->info('5. Recomendaciones:');
        if ($workspace && $workspace->users()->count() > 0) {
            $user = $workspace->users()->first();
            if (!$user->current_workspace_id || $user->current_workspace_id != 35) {
                $this->warn("  ⚠ El usuario necesita tener current_workspace_id = 35");
                $this->line("  Ejecuta: UPDATE users SET current_workspace_id = 35 WHERE id = {$user->id};");
            } else {
                $this->info("  ✓ Todo parece estar configurado correctamente");
            }
        }

        return 0;
    }
}

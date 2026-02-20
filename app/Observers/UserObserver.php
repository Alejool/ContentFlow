<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;;

class UserObserver
{
    public function created(User $user): void
    {
        if ($user->workspaces()->count() > 0) {
            return;
        }

        $workspaceName = $user->name ? $user->name . "'s Workspace" : "Default Workspace";
        if ($user->locale === 'es') {
            $workspaceName = $user->name ? "Espacio de " . $user->name : "Mi Espacio";
        }

        $workspace = Workspace::create([
            'name' => $workspaceName,
            'created_by' => $user->id,
            'description' => $user->locale === 'es'
                ? 'Tu espacio personal para empezar a crear contenido.'
                : 'Your personal workspace to start creating content.',
        ]);
        $ownerRole = Role::where('slug', 'owner')->first();

        if ($ownerRole) {
            $user->workspaces()->attach($workspace->id, [
                'role_id' => $ownerRole->id
            ]);
        }

        $user->update(['current_workspace_id' => $workspace->id]);
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        // Detectar cambios en is_super_admin (rol de administrador)
        if ($user->isDirty('is_super_admin')) {
            event(new \App\Events\RoleChanged(
                action: 'super_admin_changed',
                auditable: $user,
                oldValues: ['is_super_admin' => $user->getOriginal('is_super_admin')],
                newValues: ['is_super_admin' => $user->is_super_admin],
            ));
        }
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        event(new \App\Events\CriticalDataDeleted(
            action: 'user_deleted',
            auditable: $user,
            oldValues: $user->toArray(),
        ));
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        //
    }
}

<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Role;

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
        //
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        //
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

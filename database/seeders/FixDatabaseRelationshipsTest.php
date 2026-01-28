<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class FixDatabaseRelationshipsTest extends Seeder
{
  /**
   * Test the correct way to load user workspaces with roles and permissions.
   */
  public function run(): void
  {
    Log::info('Testing database relationships...');

    // Get first user
    $user = User::first();

    if (!$user) {
      Log::error('No users found in database');
      return;
    }

    Log::info("Testing relationships for user: {$user->name} (ID: {$user->id})");
    Log::info("Current workspace ID: {$user->current_workspace_id}");

    // CORRECT WAY 1: Load workspaces with pivot role and role's permissions
    $userWithWorkspaces = User::with([
      'workspaces' => function ($query) {
        // The WorkspaceUser pivot already auto-loads 'role' via $with = ['role']
        // But we need to also load the role's permissions
        $query->with(['pivot.role.permissions']);
      }
    ])->find($user->id);

    Log::info("Loaded {$userWithWorkspaces->workspaces->count()} workspaces");

    foreach ($userWithWorkspaces->workspaces as $workspace) {
      $role = $workspace->pivot->role;
      $permissions = $role ? $role->permissions : collect();

      Log::info("Workspace: {$workspace->name}");
      Log::info("  - Role: " . ($role ? $role->name : 'No role'));
      Log::info("  - Permissions: " . $permissions->pluck('slug')->implode(', '));
    }

    // CORRECT WAY 2: Using eager loading with nested relationships
    $user2 = User::with('workspaces.pivot.role.permissions')->first();

    Log::info("\nAlternative loading method:");
    foreach ($user2->workspaces as $workspace) {
      $role = $workspace->pivot->role;
      Log::info("Workspace: {$workspace->name}, Role: " . ($role ? $role->name : 'No role'));
    }

    Log::info('Database relationship test completed successfully');
  }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TestCorrectRelationshipsSeeder extends Seeder
{
  /**
   * Demonstrate the CORRECT way to access workspaces with roles and permissions.
   */
  public function run(): void
  {
    echo "\n=== Testing Correct Workspace/Role/Permission Relationships ===\n\n";

    // Get first user
    $user = User::first();

    if (!$user) {
      echo "❌ No users found in database\n";
      return;
    }

    echo "User: {$user->name}\n";
    echo "Current Workspace ID: {$user->current_workspace_id}\n\n";

    // ✅ CORRECT METHOD 1: Use the helper method
    echo "--- Method 1: Using helper method ---\n";
    $workspaces = $user->getWorkspacesWithRolesAndPermissions();

    foreach ($workspaces as $workspace) {
      echo "Workspace: {$workspace->name}\n";

      $role = $workspace->pivot->role; // Access role through pivot

      if ($role) {
        echo "  Role: {$role->name} ({$role->slug})\n";

        // Load permissions
        $role->load('permissions');
        $permissionSlugs = $role->permissions->pluck('slug')->toArray();
        echo "  Permissions: " . implode(', ', $permissionSlugs) . "\n";
      } else {
        echo "  Role: No role assigned\n";
      }
      echo "\n";
    }

    // ✅ CORRECT METHOD 2: Direct access with eager loading
    echo "--- Method 2: Direct access ---\n";
    $user2 = User::with('workspaces')->find($user->id);

    foreach ($user2->workspaces as $workspace) {
      $role = $workspace->pivot->role; // WorkspaceUser auto-loads role

      if ($role) {
        echo "Workspace: {$workspace->name}, Role: {$role->name}\n";
      }
    }

    echo "\n✅ All tests completed successfully!\n";
    echo "\nRemember:\n";
    echo "  - Roles are GLOBAL (no workspace_id column)\n";
    echo "  - Access roles through: \$workspace->pivot->role\n";
    echo "  - WorkspaceUser pivot auto-loads role\n";
    echo "  - Never use: \$user->workspaces->roles (doesn't exist!)\n\n";
  }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FixUserRolesSeeder extends Seeder
{
  /**
   * Fix all users without roles in their workspaces.
   * This seeder ensures every user in workspace_user has a valid role_id.
   */
  public function run(): void
  {
    Log::info('Starting FixUserRolesSeeder...');
    $this->command->info('🔧 Fixing user roles in workspaces...');

    // 1. Ensure roles exist
    $this->ensureRolesExist();

    // 2. Get the Owner role (default for workspace creators)
    $ownerRole = Role::where('slug', 'owner')->first();
    $editorRole = Role::where('slug', 'editor')->first();

    if (!$ownerRole || !$editorRole) {
      $this->command->error('❌ Roles not found! Run RolesAndPermissionsSeeder first.');
      Log::error('Owner or Editor role not found');
      return;
    }

    $this->command->info("✓ Roles found: Owner (ID: {$ownerRole->id}), Editor (ID: {$editorRole->id})");

    // 3. Fix all workspace_user records with NULL or invalid role_id
    $this->fixWorkspaceUserRoles($ownerRole, $editorRole);

    // 4. Ensure all users have at least one workspace
    $this->ensureAllUsersHaveWorkspace($ownerRole);

    // 5. Verify all users have current_workspace_id set
    $this->ensureCurrentWorkspace();

    $this->command->info('✅ All user roles fixed successfully!');
    Log::info('FixUserRolesSeeder completed successfully');
  }

  /**
   * Ensure all required roles exist
   */
  private function ensureRolesExist(): void
  {
    $roles = [
      ['name' => 'Owner', 'slug' => 'owner', 'description' => 'Workspace owner with full permissions'],
      ['name' => 'Admin', 'slug' => 'admin', 'description' => 'Administrator with most permissions'],
      ['name' => 'Editor', 'slug' => 'editor', 'description' => 'Can create and edit content'],
      ['name' => 'Viewer', 'slug' => 'viewer', 'description' => 'Read-only access'],
    ];

    foreach ($roles as $roleData) {
      Role::firstOrCreate(
        ['slug' => $roleData['slug']],
        $roleData
      );
    }

    $this->command->info('✓ Roles ensured');
  }

  /**
   * Fix workspace_user records with NULL or invalid role_id
   */
  private function fixWorkspaceUserRoles(Role $ownerRole, Role $editorRole): void
  {
    $this->command->info('Checking workspace_user records...');

    // Get all workspace_user records
    $workspaceUsers = DB::table('workspace_user')->get();
    $fixed = 0;
    $alreadyOk = 0;

    foreach ($workspaceUsers as $wu) {
      // Check if role_id is NULL or invalid
      if (!$wu->role_id || !Role::find($wu->role_id)) {
        // Get workspace to check if user is creator
        $workspace = Workspace::find($wu->workspace_id);

        if ($workspace && $workspace->created_by === $wu->user_id) {
          // User is workspace creator, assign Owner role
          DB::table('workspace_user')
            ->where('id', $wu->id)
            ->update(['role_id' => $ownerRole->id]);

          $this->command->info("  ✓ Fixed: User {$wu->user_id} → Owner in Workspace {$wu->workspace_id}");
          $fixed++;
        } else {
          // User is not creator, assign Editor role
          DB::table('workspace_user')
            ->where('id', $wu->id)
            ->update(['role_id' => $editorRole->id]);

          $this->command->info("  ✓ Fixed: User {$wu->user_id} → Editor in Workspace {$wu->workspace_id}");
          $fixed++;
        }
      } else {
        $alreadyOk++;
      }
    }

    $this->command->info("✓ Fixed {$fixed} records, {$alreadyOk} were already OK");
    Log::info("Fixed {$fixed} workspace_user records");
  }

  /**
   * Ensure all users have at least one workspace
   */
  private function ensureAllUsersHaveWorkspace(Role $ownerRole): void
  {
    $this->command->info('Ensuring all users have workspaces...');

    $users = User::all();
    $created = 0;

    foreach ($users as $user) {
      // Check if user has any workspaces
      if ($user->workspaces()->count() === 0) {
        $this->command->warn("  User {$user->email} has no workspace, creating one...");

        // Create personal workspace
        $workspace = Workspace::create([
          'name' => "{$user->name}'s Workspace",
          'slug' => \Illuminate\Support\Str::slug($user->name . '-workspace-' . \Illuminate\Support\Str::random(4)),
          'description' => 'Personal workspace',
          'created_by' => $user->id,
        ]);

        // Attach user as owner
        $user->workspaces()->attach($workspace->id, ['role_id' => $ownerRole->id]);

        // Set as current workspace
        $user->update(['current_workspace_id' => $workspace->id]);

        $this->command->info("  ✓ Created workspace '{$workspace->name}' for {$user->email}");
        $created++;
      }
    }

    $this->command->info("✓ Created {$created} new workspaces");
    Log::info("Created {$created} workspaces for users without any");
  }

  /**
   * Ensure all users have current_workspace_id set
   */
  private function ensureCurrentWorkspace(): void
  {
    $this->command->info('Ensuring all users have current_workspace_id...');

    $users = User::whereNull('current_workspace_id')
      ->orWhere('current_workspace_id', 0)
      ->get();

    $fixed = 0;

    foreach ($users as $user) {
      $firstWorkspace = $user->workspaces()->first();

      if ($firstWorkspace) {
        $user->update(['current_workspace_id' => $firstWorkspace->id]);
        $this->command->info("  ✓ Set current workspace for {$user->email}");
        $fixed++;
      } else {
        $this->command->warn("  ⚠ User {$user->email} has no workspaces!");
      }
    }

    $this->command->info("✓ Fixed {$fixed} users' current_workspace_id");
    Log::info("Fixed {$fixed} users' current_workspace_id");
  }
}

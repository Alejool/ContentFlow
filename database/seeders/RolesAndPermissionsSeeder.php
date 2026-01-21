<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class RolesAndPermissionsSeeder extends Seeder
{
  /**
   * Run the database seeds.
   * This seeder is idempotent and can be run multiple times safely.
   */
  public function run(): void
  {
    Log::info('Starting RolesAndPermissionsSeeder...');

    // 1. Create Permissions
    $permissions = [
      ['name' => 'Publish', 'slug' => 'publish', 'description' => 'Allow publishing content to social media'],
      ['name' => 'Approve', 'slug' => 'approve', 'description' => 'Allow approving content for publication'],
      ['name' => 'View Analytics', 'slug' => 'view-analytics', 'description' => 'Allow viewing workspace analytics'],
      ['name' => 'Manage Accounts', 'slug' => 'manage-accounts', 'description' => 'Allow adding/removing social accounts'],
      ['name' => 'Manage Team', 'slug' => 'manage-team', 'description' => 'Allow inviting/removing members'],
      ['name' => 'Manage Content', 'slug' => 'manage-content', 'description' => 'Allow creating and editing publications'],
      ['name' => 'Manage Campaigns', 'slug' => 'manage-campaigns', 'description' => 'Allow creating and editing campaigns'],
      ['name' => 'View Content', 'slug' => 'view-content', 'description' => 'Allow viewing workspace content (read-only)'],
    ];

    foreach ($permissions as $p) {
      $permission = Permission::firstOrCreate(['slug' => $p['slug']], $p);
      Log::info("Permission '{$p['slug']}' ensured (ID: {$permission->id})");
    }

    // 2. Create Roles and Sync Permissions
    $roles = [
      'Owner' => ['publish', 'approve', 'view-analytics', 'manage-accounts', 'manage-team', 'manage-content', 'manage-campaigns', 'view-content'],
      'Admin' => ['publish', 'approve', 'view-analytics', 'manage-accounts', 'manage-content', 'manage-campaigns', 'view-content'],
      'Editor' => ['view-analytics', 'manage-content', 'manage-campaigns', 'view-content'],
      'Viewer' => ['view-analytics', 'view-content'],
    ];

    foreach ($roles as $name => $permSlugs) {
      $role = Role::firstOrCreate(
        ['slug' => \Illuminate\Support\Str::slug($name)],
        ['name' => $name, 'description' => "Default $name role"]
      );

      // Get permission IDs
      $permissionIds = Permission::whereIn('slug', $permSlugs)->pluck('id');

      // Sync permissions (this will add/remove as needed)
      $role->permissions()->sync($permissionIds);

      Log::info("Role '{$name}' synced with " . count($permissionIds) . " permissions");
    }

    // 3. Verify Owner Role
    $ownerRole = Role::where('slug', 'owner')->first();
    if ($ownerRole) {
      $ownerPerms = $ownerRole->permissions->pluck('slug')->toArray();
      Log::info("Owner role verified with permissions: " . implode(', ', $ownerPerms));

      if (count($ownerPerms) !== 7) {
        Log::warning("Owner role has " . count($ownerPerms) . " permissions, expected 7!");
      }
    } else {
      Log::error("Owner role not found after seeding!");
    }

    Log::info('RolesAndPermissionsSeeder completed successfully');
  }
}

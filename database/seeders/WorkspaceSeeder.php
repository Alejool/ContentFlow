<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Str;

class WorkspaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Permissions
        $permissions = [
            ['name' => 'Publish', 'slug' => 'publish', 'description' => 'Allow publishing content to social media'],
            ['name' => 'Approve', 'slug' => 'approve', 'description' => 'Allow approving content for publication'],
            ['name' => 'View Analytics', 'slug' => 'view-analytics', 'description' => 'Allow viewing workspace analytics'],
            ['name' => 'Manage Accounts', 'slug' => 'manage-accounts', 'description' => 'Allow adding/removing social accounts'],
            ['name' => 'Manage Team', 'slug' => 'manage-team', 'description' => 'Allow inviting/removing members'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // 2. Create Roles
        $roles = [
            'Owner' => ['publish', 'approve', 'view-analytics', 'manage-accounts', 'manage-team'],
            'Admin' => ['publish', 'approve', 'view-analytics', 'manage-accounts'],
            'Editor' => ['publish', 'approve', 'view-analytics'],
            'Viewer' => ['view-analytics'],
        ];

        foreach ($roles as $name => $permSlugs) {
            $role = Role::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'description' => "Default $name role"]
            );

            $ids = Permission::whereIn('slug', $permSlugs)->pluck('id');
            $role->permissions()->sync($ids);
        }

        // 3. Migrate existing users to a "Personal" workspace
        $ownerRole = Role::where('slug', 'owner')->first();

        User::all()->each(function ($user) use ($ownerRole) {
            if ($user->workspaces()->count() === 0) {
                $workspace = Workspace::create([
                    'name' => 'Personal Workspace',
                    'slug' => Str::slug($user->name . ' Personal ' . Str::random(4)),
                    'created_by' => $user->id,
                ]);

                $user->workspaces()->attach($workspace->id, ['role_id' => $ownerRole->id]);
                $user->update(['current_workspace_id' => $workspace->id]);

                // Update existing data to this workspace
                $user->socialAccounts()->update(['workspace_id' => $workspace->id]);
                $user->publications()->update(['workspace_id' => $workspace->id]);
                $user->scheduledPosts()->update(['workspace_id' => $workspace->id]);
                $user->socialPostLogs()->update(['workspace_id' => $workspace->id]);
                $user->mediaFiles()->update(['workspace_id' => $workspace->id]);

                \App\Models\Campaign::where('user_id', $user->id)->update(['workspace_id' => $workspace->id]);
            }
        });

        // 4. Create a Demo Shared Workspace
        if (!Workspace::where('name', 'Demo Team Workspace')->exists()) {
            $mainUser = User::first();

            if ($mainUser) {
                $workspace = Workspace::create([
                    'name' => 'Demo Team Workspace',
                    'slug' => 'demo-team-workspace',
                    'created_by' => $mainUser->id,
                ]);

                $mainUser->workspaces()->attach($workspace->id, ['role_id' => Role::where('slug', 'owner')->first()->id]);

                $roles = ['admin', 'editor', 'viewer'];

                foreach ($roles as $roleSlug) {
                    $dummyUser = User::factory()->create([
                        'name' => ucfirst($roleSlug) . ' User',
                        'email' => $roleSlug . '@demo.com',
                        'password' => bcrypt('password'),
                    ]);

                    $dummyUser->workspaces()->attach($workspace->id, ['role_id' => Role::where('slug', $roleSlug)->first()->id]);
                    $dummyUser->update(['current_workspace_id' => $workspace->id]); // Safe even if fillable is missing, just adds to pivot or updates user
                }
            }
        }
    }
}

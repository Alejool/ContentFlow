<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Seed Roles if missing
        $ownerRoleId = DB::table('roles')->where('slug', 'owner')->value('id');
        if (!$ownerRoleId) {
            $ownerRoleId = DB::table('roles')->insertGetId([
                'name' => 'Owner',
                'slug' => 'owner',
                'description' => 'Workspace owner with full access',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Seed other basic roles
        $roles = [
            ['name' => 'Admin', 'slug' => 'admin', 'description' => 'Workspace administrator'],
            ['name' => 'Editor', 'slug' => 'editor', 'description' => 'Can create and edit content'],
            ['name' => 'Viewer', 'slug' => 'viewer', 'description' => 'Can only view content'],
        ];

        foreach ($roles as $role) {
            if (!DB::table('roles')->where('slug', $role['slug'])->exists()) {
                DB::table('roles')->insert(array_merge($role, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        // 2. Process each user to create a default workspace
        $users = DB::table('users')->get();

        foreach ($users as $user) {
            // Check if user already has a workspace they created
            $workspaceId = DB::table('workspaces')->where('created_by', $user->id)->value('id');

            if (!$workspaceId) {
                $workspaceName = $user->name . "'s Workspace";
                $workspaceId = DB::table('workspaces')->insertGetId([
                    'name' => $workspaceName,
                    'slug' => Str::slug($workspaceName) . '-' . Str::random(5),
                    'description' => 'Default workspace for ' . $user->name,
                    'created_by' => $user->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Join user to workspace as owner
                DB::table('workspace_user')->insert([
                    'workspace_id' => $workspaceId,
                    'user_id' => $user->id,
                    'role_id' => $ownerRoleId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Set current workspace if not set
            if (!$user->current_workspace_id) {
                DB::table('users')->where('id', $user->id)->update([
                    'current_workspace_id' => $workspaceId
                ]);
            }

            // 3. Backfill entities for this user
            $tables = [
                'social_accounts',
                'publications',
                'campaigns',
                'media_files',
                'scheduled_posts',
                'social_post_logs',
            ];

            foreach ($tables as $tableName) {
                DB::table($tableName)
                    ->where('user_id', $user->id)
                    ->whereNull('workspace_id')
                    ->update(['workspace_id' => $workspaceId]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')->update(['current_workspace_id' => null]);
    }
};

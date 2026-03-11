<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SimplifiedRolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define the five core permissions
        $permissions = [
            [
                'name' => 'view_content',
                'display_name' => 'View Content',
                'slug' => 'view-content',
                'description' => 'Ability to view content in the workspace'
            ],
            [
                'name' => 'create_content',
                'display_name' => 'Create Content',
                'slug' => 'create-content',
                'description' => 'Ability to create new content'
            ],
            [
                'name' => 'manage_content',
                'display_name' => 'Manage Content',
                'slug' => 'manage-content',
                'description' => 'Ability to edit and manage content'
            ],
            [
                'name' => 'publish_content',
                'display_name' => 'Publish Content',
                'slug' => 'publish-content',
                'description' => 'Ability to publish content and approve workflows'
            ],
            [
                'name' => 'manage_workspace',
                'display_name' => 'Manage Workspace',
                'slug' => 'manage-workspace',
                'description' => 'Ability to manage workspace settings and members'
            ],
        ];

        // Create permissions
        $permissionIds = [];
        foreach ($permissions as $permData) {
            $permission = \App\Models\Permission\Permission::updateOrCreate(
                ['slug' => $permData['slug']], // Use slug as unique key
                $permData
            );
            $permissionIds[$permData['name']] = $permission->id;
        }

        // Define the four predefined roles with their permissions
        $roles = [
            [
                'name' => 'owner',
                'display_name' => 'Owner',
                'slug' => 'owner',
                'description' => 'Workspace owner with full control and approval workflow bypass',
                'is_system_role' => true,
                'approval_participant' => true,
                'permissions' => ['view_content', 'create_content', 'manage_content', 'publish_content', 'manage_workspace']
            ],
            [
                'name' => 'admin',
                'display_name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Administrator with all permissions',
                'is_system_role' => true,
                'approval_participant' => true,
                'permissions' => ['view_content', 'create_content', 'manage_content', 'publish_content', 'manage_workspace']
            ],
            [
                'name' => 'editor',
                'display_name' => 'Editor',
                'slug' => 'editor',
                'description' => 'Can create and manage content',
                'is_system_role' => true,
                'approval_participant' => true,
                'permissions' => ['view_content', 'create_content', 'manage_content']
            ],
            [
                'name' => 'viewer',
                'display_name' => 'Viewer',
                'slug' => 'viewer',
                'description' => 'Can only view content',
                'is_system_role' => true,
                'approval_participant' => false,
                'permissions' => ['view_content']
            ],
        ];

        // Create roles and assign permissions
        foreach ($roles as $roleData) {
            $permissionNames = $roleData['permissions'];
            unset($roleData['permissions']);

            $role = \App\Models\Role\Role::updateOrCreate(
                ['slug' => $roleData['slug']], // Use slug as unique key
                $roleData
            );

            // Sync permissions for this role
            $rolePermissionIds = array_map(function($permName) use ($permissionIds) {
                return $permissionIds[$permName];
            }, $permissionNames);

            $role->permissions()->sync($rolePermissionIds);
        }

        $this->command->info('Simplified roles and permissions seeded successfully!');
        $this->command->info('Created 4 roles: Owner, Admin, Editor, Viewer');
        $this->command->info('Created 5 permissions: view_content, create_content, manage_content, publish_content, manage_workspace');
    }
}

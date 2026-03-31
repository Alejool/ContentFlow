<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\RoleMigrationService;
use App\Services\RoleService;
use App\Models\Role\Role;
use App\Models\Permission\Permission;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class RoleMigrationServiceTest extends TestCase
{
    use RefreshDatabase;

    private RoleMigrationService $service;
    private RoleService $roleService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->roleService = $this->app->make(RoleService::class);
        $this->service = new RoleMigrationService($this->roleService);
        
        // Seed predefined roles and permissions
        $this->seedRolesAndPermissions();
    }

    /**
     * Seed predefined roles and permissions for testing
     */
    private function seedRolesAndPermissions(): void
    {
        // Create permissions
        $permissions = [
            Permission::VIEW_CONTENT => ['display' => 'View Content', 'slug' => 'view-content'],
            Permission::CREATE_CONTENT => ['display' => 'Create Content', 'slug' => 'create-content'],
            Permission::MANAGE_CONTENT => ['display' => 'Manage Content', 'slug' => 'manage-content'],
            Permission::PUBLISH_CONTENT => ['display' => 'Publish Content', 'slug' => 'publish-content'],
            Permission::MANAGE_WORKSPACE => ['display' => 'Manage Workspace', 'slug' => 'manage-workspace'],
        ];

        foreach ($permissions as $name => $data) {
            Permission::create([
                'name' => $name,
                'slug' => $data['slug'],
                'description' => "Permission to {$data['display']}",
            ]);
        }

        // Create predefined roles
        $roles = [
            [
                'name' => Role::OWNER,
                'display_name' => 'Owner',
                'description' => 'Workspace owner with full control',
                'approval_participant' => true,
                'permissions' => [
                    Permission::VIEW_CONTENT,
                    Permission::CREATE_CONTENT,
                    Permission::MANAGE_CONTENT,
                    Permission::PUBLISH_CONTENT,
                    Permission::MANAGE_WORKSPACE,
                ],
            ],
            [
                'name' => Role::ADMIN,
                'display_name' => 'Admin',
                'description' => 'Administrator with full workspace management',
                'approval_participant' => true,
                'permissions' => [
                    Permission::VIEW_CONTENT,
                    Permission::CREATE_CONTENT,
                    Permission::MANAGE_CONTENT,
                    Permission::PUBLISH_CONTENT,
                    Permission::MANAGE_WORKSPACE,
                ],
            ],
            [
                'name' => Role::EDITOR,
                'display_name' => 'Editor',
                'description' => 'Can create and manage content',
                'approval_participant' => true,
                'permissions' => [
                    Permission::VIEW_CONTENT,
                    Permission::CREATE_CONTENT,
                    Permission::MANAGE_CONTENT,
                ],
            ],
            [
                'name' => Role::VIEWER,
                'display_name' => 'Viewer',
                'description' => 'Can only view content',
                'approval_participant' => false,
                'permissions' => [
                    Permission::VIEW_CONTENT,
                ],
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::create([
                'name' => $roleData['name'],
                'display_name' => $roleData['display_name'],
                'description' => $roleData['description'],
                'approval_participant' => $roleData['approval_participant'],
                'is_system_role' => true,
            ]);

            // Attach permissions
            $permissionIds = Permission::whereIn('name', $roleData['permissions'])->pluck('id');
            $role->permissions()->attach($permissionIds);
        }
    }

    /**
     * Test analyzeLegacyRole maps role with Publish_Content to Admin
     */
    public function test_analyze_legacy_role_with_publish_content_maps_to_admin(): void
    {
        // Create a legacy role with Publish_Content permission
        $legacyRole = Role::create([
            'name' => 'legacy_publisher',
            'display_name' => 'Legacy Publisher',
            'description' => 'Legacy role with publish permission',
            'is_system_role' => false,
        ]);

        $publishPermission = Permission::where('name', Permission::PUBLISH_CONTENT)->first();
        $viewPermission = Permission::where('name', Permission::VIEW_CONTENT)->first();
        $legacyRole->permissions()->attach([$publishPermission->id, $viewPermission->id]);

        // Analyze the role
        $targetRole = $this->service->analyzeLegacyRole($legacyRole);

        // Assert it maps to Admin
        $this->assertEquals(Role::ADMIN, $targetRole);
    }

    /**
     * Test analyzeLegacyRole maps role with Create_Content to Editor
     */
    public function test_analyze_legacy_role_with_create_content_maps_to_editor(): void
    {
        // Create a legacy role with Create_Content permission
        $legacyRole = Role::create([
            'name' => 'legacy_creator',
            'display_name' => 'Legacy Creator',
            'description' => 'Legacy role with create permission',
            'is_system_role' => false,
        ]);

        $createPermission = Permission::where('name', Permission::CREATE_CONTENT)->first();
        $viewPermission = Permission::where('name', Permission::VIEW_CONTENT)->first();
        $legacyRole->permissions()->attach([$createPermission->id, $viewPermission->id]);

        // Analyze the role
        $targetRole = $this->service->analyzeLegacyRole($legacyRole);

        // Assert it maps to Editor
        $this->assertEquals(Role::EDITOR, $targetRole);
    }

    /**
     * Test analyzeLegacyRole maps role with Manage_Content to Editor
     */
    public function test_analyze_legacy_role_with_manage_content_maps_to_editor(): void
    {
        // Create a legacy role with Manage_Content permission
        $legacyRole = Role::create([
            'name' => 'legacy_manager',
            'display_name' => 'Legacy Manager',
            'description' => 'Legacy role with manage permission',
            'is_system_role' => false,
        ]);

        $managePermission = Permission::where('name', Permission::MANAGE_CONTENT)->first();
        $viewPermission = Permission::where('name', Permission::VIEW_CONTENT)->first();
        $legacyRole->permissions()->attach([$managePermission->id, $viewPermission->id]);

        // Analyze the role
        $targetRole = $this->service->analyzeLegacyRole($legacyRole);

        // Assert it maps to Editor
        $this->assertEquals(Role::EDITOR, $targetRole);
    }

    /**
     * Test analyzeLegacyRole maps role with only View_Content to Viewer
     */
    public function test_analyze_legacy_role_with_only_view_content_maps_to_viewer(): void
    {
        // Create a legacy role with only View_Content permission
        $legacyRole = Role::create([
            'name' => 'legacy_viewer',
            'display_name' => 'Legacy Viewer',
            'description' => 'Legacy role with view permission only',
            'is_system_role' => false,
        ]);

        $viewPermission = Permission::where('name', Permission::VIEW_CONTENT)->first();
        $legacyRole->permissions()->attach([$viewPermission->id]);

        // Analyze the role
        $targetRole = $this->service->analyzeLegacyRole($legacyRole);

        // Assert it maps to Viewer
        $this->assertEquals(Role::VIEWER, $targetRole);
    }

    /**
     * Test migrateWorkspace successfully migrates users
     */
    public function test_migrate_workspace_successfully_migrates_users(): void
    {
        Notification::fake();

        // Create a workspace
        $workspace = Workspace::factory()->create(['name' => 'Test Workspace']);

        // Create a legacy role
        $legacyRole = Role::create([
            'name' => 'legacy_publisher',
            'display_name' => 'Legacy Publisher',
            'description' => 'Legacy role',
            'is_system_role' => false,
        ]);

        $publishPermission = Permission::where('name', Permission::PUBLISH_CONTENT)->first();
        $legacyRole->permissions()->attach([$publishPermission->id]);

        // Create users with legacy role
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        DB::table('role_user')->insert([
            [
                'user_id' => $user1->id,
                'role_id' => $legacyRole->id,
                'workspace_id' => $workspace->id,
                'assigned_at' => now(),
            ],
            [
                'user_id' => $user2->id,
                'role_id' => $legacyRole->id,
                'workspace_id' => $workspace->id,
                'assigned_at' => now(),
            ],
        ]);

        // Migrate the workspace
        $result = $this->service->migrateWorkspace($workspace);

        // Assert migration was successful
        $this->assertTrue($result->success);
        $this->assertEquals(2, $result->usersAffected);
        $this->assertArrayHasKey('legacy_publisher', $result->roleMappings);
        $this->assertEquals(Role::ADMIN, $result->roleMappings['legacy_publisher']);

        // Assert users now have Admin role
        $adminRole = Role::where('name', Role::ADMIN)->first();
        $user1RoleAssignment = DB::table('role_user')
            ->where('user_id', $user1->id)
            ->where('workspace_id', $workspace->id)
            ->first();
        $this->assertEquals($adminRole->id, $user1RoleAssignment->role_id);

        // Assert legacy_role_migrations record was created
        $migrationRecord = DB::table('legacy_role_migrations')
            ->where('workspace_id', $workspace->id)
            ->where('legacy_role_name', 'legacy_publisher')
            ->first();
        $this->assertNotNull($migrationRecord);
        $this->assertEquals(Role::ADMIN, $migrationRecord->mapped_to_role);
        $this->assertEquals(2, $migrationRecord->affected_user_count);
    }

    /**
     * Test migrateWorkspace skips users with predefined roles
     */
    public function test_migrate_workspace_skips_users_with_predefined_roles(): void
    {
        // Create a workspace
        $workspace = Workspace::factory()->create(['name' => 'Test Workspace']);

        // Create a user with Admin role (predefined)
        $user = User::factory()->create();
        $adminRole = Role::where('name', Role::ADMIN)->first();

        DB::table('role_user')->insert([
            'user_id' => $user->id,
            'role_id' => $adminRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Migrate the workspace
        $result = $this->service->migrateWorkspace($workspace);

        // Assert no users were affected (predefined role was skipped)
        $this->assertTrue($result->success);
        $this->assertEquals(0, $result->usersAffected);
        $this->assertEmpty($result->roleMappings);
    }

    /**
     * Test migrateAllWorkspaces aggregates results correctly
     */
    public function test_migrate_all_workspaces_aggregates_results(): void
    {
        Notification::fake();

        // Create workspaces
        $workspace1 = Workspace::factory()->create(['name' => 'Workspace 1']);
        $workspace2 = Workspace::factory()->create(['name' => 'Workspace 2']);

        // Create legacy roles
        $legacyRole1 = Role::create([
            'name' => 'legacy_publisher',
            'display_name' => 'Legacy Publisher',
            'is_system_role' => false,
        ]);
        $publishPermission = Permission::where('name', Permission::PUBLISH_CONTENT)->first();
        $legacyRole1->permissions()->attach([$publishPermission->id]);

        $legacyRole2 = Role::create([
            'name' => 'legacy_editor',
            'display_name' => 'Legacy Editor',
            'is_system_role' => false,
        ]);
        $createPermission = Permission::where('name', Permission::CREATE_CONTENT)->first();
        $legacyRole2->permissions()->attach([$createPermission->id]);

        // Create users
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        DB::table('role_user')->insert([
            [
                'user_id' => $user1->id,
                'role_id' => $legacyRole1->id,
                'workspace_id' => $workspace1->id,
                'assigned_at' => now(),
            ],
            [
                'user_id' => $user2->id,
                'role_id' => $legacyRole2->id,
                'workspace_id' => $workspace2->id,
                'assigned_at' => now(),
            ],
        ]);

        // Migrate all workspaces
        $report = $this->service->migrateAllWorkspaces();

        // Assert report contains correct data
        $this->assertEquals(2, $report->totalWorkspaces);
        $this->assertEquals(2, $report->totalUsersAffected);
        $this->assertArrayHasKey('legacy_publisher', $report->roleMapping);
        $this->assertArrayHasKey('legacy_editor', $report->roleMapping);
        $this->assertEquals(Role::ADMIN, $report->roleMapping['legacy_publisher']['new_role']);
        $this->assertEquals(Role::EDITOR, $report->roleMapping['legacy_editor']['new_role']);
        $this->assertEmpty($report->errors);
    }
}


<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\RoleService;
use App\Models\Role\Role;
use App\Models\Permission\Permission;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Exceptions\RoleNotFoundException;
use App\Exceptions\InsufficientPermissionsException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;

/**
 * Manual test for RoleService that creates the necessary database structure
 * This test is independent of the seeder and creates all required data
 */
class RoleServiceManualTest extends TestCase
{
    use RefreshDatabase;

    private RoleService $roleService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->roleService = new RoleService();
        
        // Clear Redis cache before each test
        Redis::flushdb();
        
        // Create the necessary database structure
        $this->setupDatabase();
    }

    protected function tearDown(): void
    {
        // Clear Redis cache after each test
        Redis::flushdb();
        parent::tearDown();
    }

    /**
     * Setup database with required roles and permissions
     */
    private function setupDatabase(): void
    {
        // Create permissions
        $viewContent = Permission::create([
            'name' => Permission::VIEW_CONTENT,
            'display_name' => 'View Content',
        ]);

        $createContent = Permission::create([
            'name' => Permission::CREATE_CONTENT,
            'display_name' => 'Create Content',
        ]);

        $manageContent = Permission::create([
            'name' => Permission::MANAGE_CONTENT,
            'display_name' => 'Manage Content',
        ]);

        $publishContent = Permission::create([
            'name' => Permission::PUBLISH_CONTENT,
            'display_name' => 'Publish Content',
        ]);

        $manageWorkspace = Permission::create([
            'name' => Permission::MANAGE_WORKSPACE,
            'display_name' => 'Manage Workspace',
        ]);

        // Create roles
        $ownerRole = Role::create([
            'name' => Role::OWNER,
            'display_name' => 'Owner',
            'is_system_role' => true,
            'approval_participant' => true,
        ]);

        $adminRole = Role::create([
            'name' => Role::ADMIN,
            'display_name' => 'Admin',
            'is_system_role' => true,
            'approval_participant' => true,
        ]);

        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'display_name' => 'Editor',
            'is_system_role' => true,
            'approval_participant' => true,
        ]);

        $viewerRole = Role::create([
            'name' => Role::VIEWER,
            'display_name' => 'Viewer',
            'is_system_role' => true,
            'approval_participant' => false,
        ]);

        // Assign permissions to roles
        $ownerRole->permissions()->attach([
            $viewContent->id,
            $createContent->id,
            $manageContent->id,
            $publishContent->id,
            $manageWorkspace->id,
        ]);

        $adminRole->permissions()->attach([
            $viewContent->id,
            $createContent->id,
            $manageContent->id,
            $publishContent->id,
            $manageWorkspace->id,
        ]);

        $editorRole->permissions()->attach([
            $viewContent->id,
            $createContent->id,
            $manageContent->id,
        ]);

        $viewerRole->permissions()->attach([
            $viewContent->id,
        ]);
    }

    /** @test */
    public function it_can_assign_a_role_to_a_user_in_a_workspace()
    {
        // Arrange
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => 1,
        ]);
        
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);
        
        $assigner = User::create([
            'name' => 'Assigner User',
            'email' => 'assigner@example.com',
            'password' => bcrypt('password'),
            'current_workspace_id' => $workspace->id,
        ]);
        
        $ownerRole = Role::where('name', Role::OWNER)->first();
        
        // Assign owner role to assigner
        DB::table('role_user')->insert([
            'user_id' => $assigner->id,
            'role_id' => $ownerRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Act
        $this->roleService->assignRole($user, $workspace, Role::EDITOR, $assigner);

        // Assert
        $editorRole = Role::where('name', Role::EDITOR)->first();
        $this->assertDatabaseHas('role_user', [
            'user_id' => $user->id,
            'role_id' => $editorRole->id,
            'workspace_id' => $workspace->id,
            'assigned_by' => $assigner->id,
        ]);
    }

    /** @test */
    public function it_throws_exception_when_role_not_found()
    {
        // Arrange
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => 1,
        ]);
        
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Assert
        $this->expectException(RoleNotFoundException::class);

        // Act
        $this->roleService->assignRole($user, $workspace, 'non_existent_role');
    }

    /** @test */
    public function owner_can_assign_any_role()
    {
        // Arrange
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => 1,
        ]);
        
        $owner = User::create([
            'name' => 'Owner User',
            'email' => 'owner@example.com',
            'password' => bcrypt('password'),
            'current_workspace_id' => $workspace->id,
        ]);
        
        $ownerRole = Role::where('name', Role::OWNER)->first();

        DB::table('role_user')->insert([
            'user_id' => $owner->id,
            'role_id' => $ownerRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Act & Assert
        $this->assertTrue($this->roleService->canAssignRole($owner, Role::ADMIN));
        $this->assertTrue($this->roleService->canAssignRole($owner, Role::EDITOR));
        $this->assertTrue($this->roleService->canAssignRole($owner, Role::VIEWER));
        $this->assertTrue($this->roleService->canAssignRole($owner, Role::OWNER));
    }

    /** @test */
    public function admin_can_only_assign_editor_and_viewer_roles()
    {
        // Arrange
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => 1,
        ]);
        
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'current_workspace_id' => $workspace->id,
        ]);
        
        $adminRole = Role::where('name', Role::ADMIN)->first();

        DB::table('role_user')->insert([
            'user_id' => $admin->id,
            'role_id' => $adminRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Act & Assert
        $this->assertFalse($this->roleService->canAssignRole($admin, Role::OWNER));
        $this->assertFalse($this->roleService->canAssignRole($admin, Role::ADMIN));
        $this->assertTrue($this->roleService->canAssignRole($admin, Role::EDITOR));
        $this->assertTrue($this->roleService->canAssignRole($admin, Role::VIEWER));
    }

    /** @test */
    public function workspace_owner_has_all_permissions()
    {
        // Arrange
        $user = User::create([
            'name' => 'Workspace Owner',
            'email' => 'workspace-owner@example.com',
            'password' => bcrypt('password'),
        ]);
        
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => $user->id,
        ]);

        // Act
        $hasPermission = $this->roleService->userHasPermission($user, $workspace, Permission::MANAGE_WORKSPACE);
        $allPermissions = $this->roleService->getUserPermissions($user, $workspace);

        // Assert
        $this->assertTrue($hasPermission);
        $this->assertCount(5, $allPermissions);
        $this->assertContains(Permission::VIEW_CONTENT, $allPermissions);
        $this->assertContains(Permission::CREATE_CONTENT, $allPermissions);
        $this->assertContains(Permission::MANAGE_CONTENT, $allPermissions);
        $this->assertContains(Permission::PUBLISH_CONTENT, $allPermissions);
        $this->assertContains(Permission::MANAGE_WORKSPACE, $allPermissions);
    }
}

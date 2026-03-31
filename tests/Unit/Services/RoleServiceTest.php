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

class RoleServiceTest extends TestCase
{
    use RefreshDatabase;

    private RoleService $roleService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->roleService = new RoleService();
        
        // Clear Redis cache before each test
        Redis::flushdb();
    }

    protected function tearDown(): void
    {
        // Clear Redis cache after each test
        Redis::flushdb();
        parent::tearDown();
    }

    /**
     * Helper method to create a workspace
     */
    private function createWorkspace(array $attributes = []): Workspace
    {
        // Create a user if created_by is not provided
        if (!isset($attributes['created_by'])) {
            $user = User::factory()->create();
            $attributes['created_by'] = $user->id;
        }
        
        return Workspace::create(array_merge([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace-' . uniqid(),
        ], $attributes));
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
        $user = User::factory()->create();
        $assigner = User::factory()->create();
        
        // Create roles
        $ownerRole = Role::create([
            'name' => Role::OWNER,
            'slug' => 'owner',
            'display_name' => 'Owner',
            'is_system_role' => true,
        ]);
        
        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'slug' => 'editor',
            'display_name' => 'Editor',
            'is_system_role' => true,
        ]);

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
        $workspace = $this->createWorkspace();
        $user = User::factory()->create();

        // Assert
        $this->expectException(RoleNotFoundException::class);

        // Act
        $this->roleService->assignRole($user, $workspace, 'non_existent_role');
    }

    /** @test */
    public function it_throws_exception_when_assigner_lacks_permission()
    {
        // Arrange
        $workspace = $this->createWorkspace();
        $user = User::factory()->create();
        $assigner = User::factory()->create(['current_workspace_id' => $workspace->id]);
        
        // Create roles
        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'slug' => 'editor',
            'display_name' => 'Editor',
            'is_system_role' => true,
        ]);
        
        $adminRole = Role::create([
            'name' => Role::ADMIN,
            'slug' => 'admin',
            'display_name' => 'Admin',
            'is_system_role' => true,
        ]);

        // Assign editor role to assigner (editors cannot assign roles)
        DB::table('role_user')->insert([
            'user_id' => $assigner->id,
            'role_id' => $editorRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Assert
        $this->expectException(InsufficientPermissionsException::class);

        // Act
        $this->roleService->assignRole($user, $workspace, Role::ADMIN, $assigner);
    }

    /** @test */
    public function it_can_get_users_with_specific_role()
    {
        // Arrange
        $workspace = $this->createWorkspace();
        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'slug' => 'editor',
            'display_name' => 'Editor',
            'is_system_role' => true,
        ]);

        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $user3 = User::factory()->create();

        // Assign editor role to user1 and user2
        DB::table('role_user')->insert([
            ['user_id' => $user1->id, 'role_id' => $editorRole->id, 'workspace_id' => $workspace->id, 'assigned_at' => now()],
            ['user_id' => $user2->id, 'role_id' => $editorRole->id, 'workspace_id' => $workspace->id, 'assigned_at' => now()],
        ]);

        // Act
        $users = $this->roleService->getUsersWithRole($workspace, Role::EDITOR);

        // Assert
        $this->assertCount(2, $users);
        $this->assertTrue($users->contains('id', $user1->id));
        $this->assertTrue($users->contains('id', $user2->id));
        $this->assertFalse($users->contains('id', $user3->id));
    }

    /** @test */
    public function it_checks_user_permission_with_caching()
    {
        // Arrange
        $workspace = $this->createWorkspace();
        $user = User::factory()->create();
        
        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'slug' => 'editor',
            'display_name' => 'Editor',
            'is_system_role' => true,
        ]);

        $permission = Permission::create(['name' => Permission::CREATE_CONTENT, 'slug' => 'create-content', 'display_name' => 'Create Content',
        ]);

        $editorRole->permissions()->attach($permission);

        DB::table('role_user')->insert([
            'user_id' => $user->id,
            'role_id' => $editorRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Act - First call (should hit database)
        $hasPermission1 = $this->roleService->userHasPermission($user, $workspace, Permission::CREATE_CONTENT);
        
        // Act - Second call (should hit cache)
        $hasPermission2 = $this->roleService->userHasPermission($user, $workspace, Permission::CREATE_CONTENT);

        // Assert
        $this->assertTrue($hasPermission1);
        $this->assertTrue($hasPermission2);
    }

    /** @test */
    public function it_gets_all_user_permissions()
    {
        // Arrange
        $workspace = $this->createWorkspace();
        $user = User::factory()->create();
        
        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'slug' => 'editor',
            'display_name' => 'Editor',
            'is_system_role' => true,
        ]);

        $permissions = [
            Permission::create(['name' => Permission::VIEW_CONTENT, 'slug' => 'view-content', 'display_name' => 'View Content']),
            Permission::create(['name' => Permission::CREATE_CONTENT, 'slug' => 'create-content', 'display_name' => 'Create Content']),
            Permission::create(['name' => Permission::MANAGE_CONTENT, 'slug' => 'manage-content', 'display_name' => 'Manage Content']),
        ];

        foreach ($permissions as $permission) {
            $editorRole->permissions()->attach($permission);
        }

        DB::table('role_user')->insert([
            'user_id' => $user->id,
            'role_id' => $editorRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Act
        $userPermissions = $this->roleService->getUserPermissions($user, $workspace);

        // Assert
        $this->assertCount(3, $userPermissions);
        $this->assertContains(Permission::VIEW_CONTENT, $userPermissions);
        $this->assertContains(Permission::CREATE_CONTENT, $userPermissions);
        $this->assertContains(Permission::MANAGE_CONTENT, $userPermissions);
    }

    /** @test */
    public function owner_can_assign_any_role()
    {
        // Arrange
        $workspace = $this->createWorkspace();
        $owner = User::factory()->create(['current_workspace_id' => $workspace->id]);
        
        $ownerRole = Role::create([
            'name' => Role::OWNER,
            'slug' => 'owner',
            'display_name' => 'Owner',
            'is_system_role' => true,
        ]);

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
        $workspace = $this->createWorkspace();
        $admin = User::factory()->create(['current_workspace_id' => $workspace->id]);
        
        $adminRole = Role::create([
            'name' => Role::ADMIN,
            'slug' => 'admin',
            'display_name' => 'Admin',
            'is_system_role' => true,
        ]);

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
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create(['created_by' => $user->id]);

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

    /** @test */
    public function it_invalidates_cache_when_role_is_assigned()
    {
        // Arrange
        $workspace = $this->createWorkspace();
        $user = User::factory()->create();
        $assigner = User::factory()->create();
        
        // Create roles
        $ownerRole = Role::create([
            'name' => Role::OWNER,
            'slug' => 'owner',
            'display_name' => 'Owner',
            'is_system_role' => true,
        ]);
        
        $viewerRole = Role::create([
            'name' => Role::VIEWER,
            'slug' => 'viewer',
            'display_name' => 'Viewer',
            'is_system_role' => true,
        ]);

        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'slug' => 'editor',
            'display_name' => 'Editor',
            'is_system_role' => true,
        ]);

        // Create permissions
        $viewPermission = Permission::create(['name' => Permission::VIEW_CONTENT, 'slug' => 'view-content', 'display_name' => 'View Content',
        ]);

        $createPermission = Permission::create(['name' => Permission::CREATE_CONTENT, 'slug' => 'create-content', 'display_name' => 'Create Content',
        ]);

        // Attach permissions to roles
        $viewerRole->permissions()->attach($viewPermission);
        $editorRole->permissions()->attach([$viewPermission->id, $createPermission->id]);

        // Assign owner role to assigner
        DB::table('role_user')->insert([
            'user_id' => $assigner->id,
            'role_id' => $ownerRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Assign viewer role to user initially
        $this->roleService->assignRole($user, $workspace, Role::VIEWER, $assigner);

        // Cache the permission check
        $hasCreatePermissionBefore = $this->roleService->userHasPermission($user, $workspace, Permission::CREATE_CONTENT);
        $this->assertFalse($hasCreatePermissionBefore);

        // Verify cache exists
        $cacheKey = "permission:user:{$user->id}:workspace:{$workspace->id}:permission:" . Permission::CREATE_CONTENT;
        $this->assertNotNull(Redis::get($cacheKey));

        // Act - Change role to editor (should invalidate cache)
        $this->roleService->assignRole($user, $workspace, Role::EDITOR, $assigner);

        // Assert - Cache should be cleared
        $this->assertNull(Redis::get($cacheKey));

        // Verify new permission is correctly retrieved
        $hasCreatePermissionAfter = $this->roleService->userHasPermission($user, $workspace, Permission::CREATE_CONTENT);
        $this->assertTrue($hasCreatePermissionAfter);
    }

    /** @test */
    public function it_caches_permissions_with_correct_ttl()
    {
        // Arrange
        $workspace = $this->createWorkspace();
        $user = User::factory()->create();
        
        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'slug' => 'editor',
            'display_name' => 'Editor',
            'is_system_role' => true,
        ]);

        $permission = Permission::create(['name' => Permission::CREATE_CONTENT, 'slug' => 'create-content', 'display_name' => 'Create Content',
        ]);

        $editorRole->permissions()->attach($permission);

        DB::table('role_user')->insert([
            'user_id' => $user->id,
            'role_id' => $editorRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Act - Check permission (should cache it)
        $this->roleService->userHasPermission($user, $workspace, Permission::CREATE_CONTENT);

        // Assert - Verify cache key exists with TTL
        $cacheKey = "permission:user:{$user->id}:workspace:{$workspace->id}:permission:" . Permission::CREATE_CONTENT;
        $ttl = Redis::ttl($cacheKey);
        
        // TTL should be approximately 3600 seconds (1 hour), allowing for small variance
        $this->assertGreaterThan(3500, $ttl);
        $this->assertLessThanOrEqual(3600, $ttl);
    }

    /** @test */
    public function it_caches_user_permissions_list_with_correct_ttl()
    {
        // Arrange
        $workspace = $this->createWorkspace();
        $user = User::factory()->create();
        
        $editorRole = Role::create([
            'name' => Role::EDITOR,
            'slug' => 'editor',
            'display_name' => 'Editor',
            'is_system_role' => true,
        ]);

        $permissions = [
            Permission::create(['name' => Permission::VIEW_CONTENT, 'slug' => 'view-content', 'display_name' => 'View Content']),
            Permission::create(['name' => Permission::CREATE_CONTENT, 'slug' => 'create-content', 'display_name' => 'Create Content']),
        ];

        foreach ($permissions as $permission) {
            $editorRole->permissions()->attach($permission);
        }

        DB::table('role_user')->insert([
            'user_id' => $user->id,
            'role_id' => $editorRole->id,
            'workspace_id' => $workspace->id,
            'assigned_at' => now(),
        ]);

        // Act - Get all permissions (should cache them)
        $this->roleService->getUserPermissions($user, $workspace);

        // Assert - Verify cache key exists with TTL
        $cacheKey = "permissions:user:{$user->id}:workspace:{$workspace->id}";
        $ttl = Redis::ttl($cacheKey);
        
        // TTL should be approximately 3600 seconds (1 hour), allowing for small variance
        $this->assertGreaterThan(3500, $ttl);
        $this->assertLessThanOrEqual(3600, $ttl);
    }
}


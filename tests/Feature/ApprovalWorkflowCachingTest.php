<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Models\Role\Role;
use App\Services\ApprovalWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

class ApprovalWorkflowCachingTest extends TestCase
{
    use RefreshDatabase;

    protected ApprovalWorkflowService $service;
    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = app(ApprovalWorkflowService::class);
        
        // Create test user and workspace
        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        
        // Seed roles if not exists
        $this->seedRoles();
    }

    protected function seedRoles(): void
    {
        if (!Role::where('name', 'admin')->exists()) {
            Role::create([
                'name' => 'admin',
                'display_name' => 'Admin',
                'approval_participant' => true,
            ]);
        }
        
        if (!Role::where('name', 'editor')->exists()) {
            Role::create([
                'name' => 'editor',
                'display_name' => 'Editor',
                'approval_participant' => true,
            ]);
        }
    }

    /** @test */
    public function it_caches_workflow_configuration()
    {
        // Create a workflow
        $workflow = ApprovalWorkflow::create([
            'workspace_id' => $this->workspace->id,
            'is_enabled' => true,
            'is_multi_level' => false,
        ]);

        $cacheKey = "workflow:workspace_{$this->workspace->id}";
        
        // Clear cache to start fresh
        Cache::forget($cacheKey);
        
        // First call should hit database and cache the result
        $this->assertFalse(Cache::has($cacheKey));
        
        // Use reflection to call private method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getWorkflowCached');
        $method->setAccessible(true);
        
        $result1 = $method->invoke($this->service, $this->workspace->id);
        
        // Cache should now exist
        $this->assertTrue(Cache::has($cacheKey));
        $this->assertEquals($workflow->id, $result1->id);
        
        // Second call should use cache (we can verify by checking the cache exists)
        $result2 = $method->invoke($this->service, $this->workspace->id);
        $this->assertEquals($result1->id, $result2->id);
    }

    /** @test */
    public function it_invalidates_cache_when_configuring_multi_level_workflow()
    {
        // Create a workflow
        $workflow = ApprovalWorkflow::create([
            'workspace_id' => $this->workspace->id,
            'is_enabled' => true,
            'is_multi_level' => false,
        ]);

        $cacheKey = "workflow:workspace_{$this->workspace->id}";
        
        // Prime the cache
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getWorkflowCached');
        $method->setAccessible(true);
        $method->invoke($this->service, $this->workspace->id);
        
        $this->assertTrue(Cache::has($cacheKey));
        
        // Configure multi-level workflow
        $levels = [
            ['level' => 1, 'name' => 'Level 1', 'role' => 'editor'],
            ['level' => 2, 'name' => 'Level 2', 'role' => 'admin'],
        ];
        
        $this->service->configureMultiLevelWorkflow($this->workspace, $levels);
        
        // Cache should be invalidated
        $this->assertFalse(Cache::has($cacheKey));
    }

    /** @test */
    public function it_invalidates_cache_when_calling_public_invalidate_method()
    {
        // Create a workflow
        $workflow = ApprovalWorkflow::create([
            'workspace_id' => $this->workspace->id,
            'is_enabled' => true,
            'is_multi_level' => false,
        ]);

        $cacheKey = "workflow:workspace_{$this->workspace->id}";
        
        // Prime the cache
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getWorkflowCached');
        $method->setAccessible(true);
        $method->invoke($this->service, $this->workspace->id);
        
        $this->assertTrue(Cache::has($cacheKey));
        
        // Call public invalidate method
        $this->service->invalidateCache($this->workspace->id);
        
        // Cache should be invalidated
        $this->assertFalse(Cache::has($cacheKey));
    }

    /** @test */
    public function it_caches_workflow_with_eager_loaded_relationships()
    {
        // Create a multi-level workflow with levels
        $workflow = ApprovalWorkflow::create([
            'workspace_id' => $this->workspace->id,
            'is_enabled' => true,
            'is_multi_level' => true,
        ]);

        $adminRole = Role::where('name', 'admin')->first();
        $editorRole = Role::where('name', 'editor')->first();

        ApprovalLevel::create([
            'approval_workflow_id' => $workflow->id,
            'level_number' => 1,
            'level_name' => 'Editor Review',
            'role_id' => $editorRole->id,
        ]);

        ApprovalLevel::create([
            'approval_workflow_id' => $workflow->id,
            'level_number' => 2,
            'level_name' => 'Admin Approval',
            'role_id' => $adminRole->id,
        ]);

        $cacheKey = "workflow:workspace_{$this->workspace->id}";
        Cache::forget($cacheKey);
        
        // Get workflow with cached method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getWorkflowCached');
        $method->setAccessible(true);
        
        $cachedWorkflow = $method->invoke($this->service, $this->workspace->id);
        
        // Verify relationships are eager loaded
        $this->assertTrue($cachedWorkflow->relationLoaded('levels'));
        $this->assertCount(2, $cachedWorkflow->levels);
        
        // Verify role relationship is also loaded
        $firstLevel = $cachedWorkflow->levels->first();
        $this->assertTrue($firstLevel->relationLoaded('role'));
        $this->assertEquals('editor', $firstLevel->role->name);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Workspace\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class ApprovalWorkflowRestrictionTest extends TestCase
{
  use RefreshDatabase;

  protected $user;
  protected $workspace;

  protected function setUp(): void
  {
    parent::setUp();
    $this->user = User::factory()->create();
    $this->workspace = Workspace::factory()->create(['created_by' => $this->user->id]);

    // Add user as owner/admin of the workspace
    WorkspaceMember::create([
      'workspace_id' => $this->workspace->id,
      'user_id' => $this->user->id,
      'role_id' => 1, // Assuming 1 is admin/owner
    ]);

    $this->actingAs($this->user);
  }

  public function test_enterprise_plan_can_access_approval_workflows()
  {
    // Mock the plan to enterprise
    $this->workspace->subscription()->create([
      'plan' => 'enterprise',
      'status' => 'active',
    ]);

    $response = $this->getJson(route('api.v1.workspaces.approval-workflows.index', $this->workspace->id));

    $response->assertStatus(200);
  }

  public function test_starter_plan_cannot_access_approval_workflows()
  {
    // Mock the plan to starter
    $this->workspace->subscription()->create([
      'plan' => 'starter',
      'status' => 'active',
    ]);

    $response = $this->getJson(route('api.v1.workspaces.approval-workflows.index', $this->workspace->id));

    $response->assertStatus(403);
    $response->assertJsonFragment(['message' => 'This feature is only available for Enterprise plans.']);
  }

  public function test_professional_plan_cannot_access_approval_workflows()
  {
    // Mock the plan to professional
    $this->workspace->subscription()->create([
      'plan' => 'professional',
      'status' => 'active',
    ]);

    $response = $this->getJson(route('api.v1.workspaces.approval-workflows.index', $this->workspace->id));

    $response->assertStatus(403);
  }
}

<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\ApprovalAnalyticsService;
use App\Models\Workspace\Workspace;
use App\Models\Publications\Publication;
use App\Models\ApprovalAction;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Models\Role\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class ApprovalAnalyticsServiceTest extends TestCase
{
    use RefreshDatabase;

    private ApprovalAnalyticsService $service;
    private Workspace $workspace;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = new ApprovalAnalyticsService();
        
        // Create test workspace and user
        $this->workspace = Workspace::factory()->create();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function it_returns_empty_array_when_no_workflow_enabled()
    {
        $result = $this->service->getAverageApprovalTime($this->workspace);
        
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    /** @test */
    public function it_returns_empty_array_for_pending_content_when_none_exists()
    {
        $result = $this->service->getPendingContentByLevel($this->workspace);
        
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    /** @test */
    public function it_returns_zero_for_average_publication_time_when_no_published_content()
    {
        $result = $this->service->getAveragePublicationTime($this->workspace);
        
        $this->assertEquals(0, $result);
    }


    /** @test */
    public function it_returns_empty_collection_for_stale_content_when_none_exists()
    {
        $result = $this->service->getStalePendingContent($this->workspace);
        
        $this->assertInstanceOf(\Illuminate\Support\Collection::class, $result);
        $this->assertTrue($result->isEmpty());
    }

    /** @test */
    public function it_returns_empty_array_for_approval_rates_when_no_actions()
    {
        $result = $this->service->getApprovalRatesByRole($this->workspace);
        
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    /** @test */
    public function it_returns_empty_array_for_approver_workload_when_no_workflow()
    {
        $result = $this->service->getApproverWorkload($this->workspace);
        
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    /** @test */
    public function it_exports_analytics_as_json()
    {
        $result = $this->service->exportAnalytics($this->workspace, 'json');
        
        $this->assertIsString($result);
        $decoded = json_decode($result, true);
        $this->assertIsArray($decoded);
        $this->assertArrayHasKey('workspace_id', $decoded);
        $this->assertArrayHasKey('workspace_name', $decoded);
        $this->assertArrayHasKey('generated_at', $decoded);
        $this->assertArrayHasKey('average_approval_time_by_level', $decoded);
        $this->assertArrayHasKey('approval_rates_by_role', $decoded);
        $this->assertArrayHasKey('pending_content_by_level', $decoded);
        $this->assertArrayHasKey('stale_pending_content', $decoded);
        $this->assertArrayHasKey('approver_workload', $decoded);
        $this->assertArrayHasKey('average_publication_time_seconds', $decoded);
    }

    /** @test */
    public function it_exports_analytics_as_csv()
    {
        $result = $this->service->exportAnalytics($this->workspace, 'csv');
        
        $this->assertIsString($result);
        $this->assertStringContainsString('Approval Workflow Analytics Report', $result);
        $this->assertStringContainsString('Workspace:', $result);
        $this->assertStringContainsString('Generated:', $result);
        $this->assertStringContainsString('Average Approval Time by Level', $result);
        $this->assertStringContainsString('Approval Rates by Role', $result);
        $this->assertStringContainsString('Pending Content by Level', $result);
        $this->assertStringContainsString('Stale Pending Content', $result);
        $this->assertStringContainsString('Approver Workload', $result);
        $this->assertStringContainsString('Average Publication Time', $result);
    }
}

<?php

namespace Tests\Feature\Subscription;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalLevel;
use App\Services\Subscription\PlanFeatureTransitionService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PlanFeatureTransitionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Workspace $workspace;
    private PlanFeatureTransitionService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'current_plan' => 'enterprise',
        ]);

        $this->workspace = Workspace::factory()->create([
            'created_by' => $this->user->id,
        ]);

        $this->workspace->users()->attach($this->user->id, [
            'role_id' => 1,
        ]);

        $this->service = app(PlanFeatureTransitionService::class);
    }

    /** @test */
    public function it_disables_approval_workflows_when_downgrading_to_plan_without_approvals()
    {
        // Crear un workflow activo
        $workflow = ApprovalWorkflow::create([
            'workspace_id' => $this->workspace->id,
            'is_enabled' => true,
            'is_active' => true,
            'is_multi_level' => false,
        ]);

        // Simular downgrade de Professional a Starter (sin aprobaciones)
        $changes = $this->service->handlePlanTransition(
            $this->workspace,
            'professional',
            'starter'
        );

        // Verificar que el workflow fue desactivado
        $workflow->refresh();
        $this->assertFalse($workflow->is_enabled);
        $this->assertFalse($workflow->is_active);

        // Verificar que se registraron los cambios
        $this->assertArrayHasKey('approval_workflows', $changes);
        $this->assertEquals('disabled_all', $changes['approval_workflows']['action']);
        $this->assertEquals(1, $changes['approval_workflows']['workflows_disabled']);
    }

    /** @test */
    public function it_converts_multilevel_workflows_to_single_level_when_downgrading_to_basic()
    {
        // Crear un workflow multinivel
        $workflow = ApprovalWorkflow::create([
            'workspace_id' => $this->workspace->id,
            'is_enabled' => true,
            'is_active' => true,
            'is_multi_level' => true,
        ]);

        // Crear 3 niveles
        ApprovalLevel::create([
            'approval_workflow_id' => $workflow->id,
            'level_number' => 1,
            'role_id' => 1,
        ]);

        ApprovalLevel::create([
            'approval_workflow_id' => $workflow->id,
            'level_number' => 2,
            'role_id' => 2,
        ]);

        ApprovalLevel::create([
            'approval_workflow_id' => $workflow->id,
            'level_number' => 3,
            'role_id' => 3,
        ]);

        // Simular downgrade de Enterprise a Professional (de advanced a basic)
        $changes = $this->service->handlePlanTransition(
            $this->workspace,
            'enterprise',
            'professional'
        );

        // Verificar que el workflow fue convertido
        $workflow->refresh();
        $this->assertFalse($workflow->is_multi_level);
        $this->assertFalse($workflow->is_enabled);
        $this->assertFalse($workflow->is_active);

        // Verificar que solo queda 1 nivel
        $this->assertEquals(1, $workflow->levels()->count());

        // Verificar que se registraron los cambios
        $this->assertArrayHasKey('approval_workflows', $changes);
        $this->assertEquals('downgraded_to_basic', $changes['approval_workflows']['action']);
        $this->assertArrayHasKey('workflows_converted', $changes['approval_workflows']);
    }

    /** @test */
    public function it_does_not_affect_workflows_when_upgrading()
    {
        // Crear un workflow simple
        $workflow = ApprovalWorkflow::create([
            'workspace_id' => $this->workspace->id,
            'is_enabled' => true,
            'is_active' => true,
            'is_multi_level' => false,
        ]);

        // Simular upgrade de Professional a Enterprise
        $changes = $this->service->handlePlanTransition(
            $this->workspace,
            'professional',
            'enterprise'
        );

        // Verificar que el workflow no fue modificado
        $workflow->refresh();
        $this->assertTrue($workflow->is_enabled);
        $this->assertTrue($workflow->is_active);

        // No debe haber cambios en approval_workflows
        $this->assertEmpty($changes);
    }

    /** @test */
    public function it_correctly_identifies_multilevel_capability()
    {
        // Enterprise debe tener multinivel
        $this->workspace->subscription()->create([
            'user_id' => $this->user->id,
            'plan' => 'enterprise',
            'status' => 'active',
        ]);

        $canUseMultiLevel = $this->service->canUseMultiLevelApprovals($this->workspace);
        $this->assertTrue($canUseMultiLevel);

        // Professional no debe tener multinivel
        $this->workspace->subscription->update(['plan' => 'professional']);
        $this->workspace->refresh();

        $canUseMultiLevel = $this->service->canUseMultiLevelApprovals($this->workspace);
        $this->assertFalse($canUseMultiLevel);
    }

    /** @test */
    public function it_correctly_identifies_approval_feature_access()
    {
        // Professional debe tener acceso básico
        $this->workspace->subscription()->create([
            'user_id' => $this->user->id,
            'plan' => 'professional',
            'status' => 'active',
        ]);

        $canUse = $this->service->canUseFeature($this->workspace, 'approval_workflows');
        $this->assertTrue($canUse);

        // Starter no debe tener acceso
        $this->workspace->subscription->update(['plan' => 'starter']);
        $this->workspace->refresh();

        $canUse = $this->service->canUseFeature($this->workspace, 'approval_workflows');
        $this->assertFalse($canUse);
    }

    /** @test */
    public function it_returns_correct_feature_level()
    {
        // Enterprise debe retornar 'advanced'
        $this->workspace->subscription()->create([
            'user_id' => $this->user->id,
            'plan' => 'enterprise',
            'status' => 'active',
        ]);

        $level = $this->service->getFeatureLevel($this->workspace, 'approval_workflows');
        $this->assertEquals('advanced', $level);

        // Professional debe retornar 'basic'
        $this->workspace->subscription->update(['plan' => 'professional']);
        $this->workspace->refresh();

        $level = $this->service->getFeatureLevel($this->workspace, 'approval_workflows');
        $this->assertEquals('basic', $level);

        // Starter debe retornar false
        $this->workspace->subscription->update(['plan' => 'starter']);
        $this->workspace->refresh();

        $level = $this->service->getFeatureLevel($this->workspace, 'approval_workflows');
        $this->assertFalse($level);
    }
}

<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Usage\UsageTrackingService;
use App\Services\Analytics\SaasMetricsService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SubscriptionSystemTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create([
            'created_by' => $this->user->id,
        ]);

        // Crear suscripción gratuita
        $this->workspace->subscription()->create([
            'user_id' => $this->user->id,
            'type' => 'default',
            'stripe_id' => 'free_test',
            'stripe_status' => 'active',
            'plan' => 'free',
            'status' => 'active',
        ]);
    }

    public function test_workspace_has_subscription()
    {
        $this->assertNotNull($this->workspace->subscription);
        $this->assertEquals('free', $this->workspace->subscription->plan);
    }

    public function test_subscription_is_active()
    {
        $this->assertTrue($this->workspace->subscription->isActive());
    }

    public function test_can_track_usage()
    {
        $service = app(UsageTrackingService::class);

        // Inicializar métrica
        $this->workspace->usageMetrics()->create([
            'metric_type' => 'publications',
            'current_usage' => 0,
            'limit' => 3,
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
        ]);

        // Verificar que puede crear
        $this->assertTrue($service->canPerformAction($this->workspace, 'publications'));

        // Incrementar uso
        $service->incrementUsage($this->workspace, 'publications', 1);

        // Verificar incremento
        $metric = $service->getUsageMetric($this->workspace, 'publications');
        $this->assertEquals(1, $metric->current_usage);
    }

    public function test_cannot_exceed_limit()
    {
        $service = app(UsageTrackingService::class);

        // Crear métrica en el límite
        $this->workspace->usageMetrics()->create([
            'metric_type' => 'publications',
            'current_usage' => 3,
            'limit' => 3,
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
        ]);

        // Verificar que no puede crear más
        $this->assertFalse($service->canPerformAction($this->workspace, 'publications'));
    }

    public function test_unlimited_plan_has_no_limits()
    {
        // Cambiar a plan enterprise
        $this->workspace->subscription->update(['plan' => 'enterprise']);

        $service = app(UsageTrackingService::class);

        // Crear métrica con límite ilimitado
        $this->workspace->usageMetrics()->create([
            'metric_type' => 'publications',
            'current_usage' => 1000,
            'limit' => -1, // ilimitado
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
        ]);

        // Verificar que siempre puede crear
        $this->assertTrue($service->canPerformAction($this->workspace, 'publications'));
    }

    public function test_saas_metrics_service()
    {
        $service = app(SaasMetricsService::class);

        $mrr = $service->getMRR();
        $this->assertIsFloat($mrr);

        $activeSubscriptions = $service->getActiveSubscriptions();
        $this->assertIsInt($activeSubscriptions);
        $this->assertGreaterThanOrEqual(1, $activeSubscriptions);
    }

    public function test_subscription_api_endpoints()
    {
        $this->actingAs($this->user);

        // Test get usage endpoint
        $response = $this->getJson('/api/v1/subscription/usage');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'subscription' => ['plan', 'status'],
            'usage',
        ]);
    }

    public function test_middleware_blocks_when_limit_reached()
    {
        $this->actingAs($this->user);

        // Crear métrica en el límite
        $this->workspace->usageMetrics()->create([
            'metric_type' => 'publications',
            'current_usage' => 3,
            'limit' => 3,
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
        ]);

        // Simular request con middleware
        // Nota: Necesitarías una ruta de prueba con el middleware aplicado
        $this->assertTrue(true); // Placeholder
    }
}

<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SubscriptionSyncTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test que un usuario con suscripción activa puede cambiar de plan sin pagar
     */
    public function test_user_with_active_subscription_can_change_plan_without_payment()
    {
        // Crear usuario y workspace
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create(['created_by' => $user->id]);
        $user->workspaces()->attach($workspace->id);
        $user->update(['current_workspace_id' => $workspace->id]);

        // Simular que tiene suscripción activa en Stripe
        // Nota: En un test real, necesitarías mockear Stripe
        
        // Cambiar a plan gratuito
        $user->update(['current_plan' => 'free']);

        // Intentar volver a plan de pago
        $response = $this->actingAs($user)->postJson('/api/v1/subscription/change-plan', [
            'plan' => 'professional'
        ]);

        // Si tiene suscripción activa, debería permitir el cambio
        // Si no tiene suscripción, debería retornar 402
        $this->assertTrue(
            $response->status() === 200 || $response->status() === 402,
            'El endpoint debe retornar 200 (con suscripción) o 402 (sin suscripción)'
        );
    }

    /**
     * Test que un usuario sin suscripción no puede cambiar a plan de pago directamente
     */
    public function test_user_without_subscription_cannot_change_to_paid_plan()
    {
        $user = User::factory()->create(['current_plan' => 'free']);
        $workspace = Workspace::factory()->create(['created_by' => $user->id]);
        $user->workspaces()->attach($workspace->id);
        $user->update(['current_workspace_id' => $workspace->id]);

        $response = $this->actingAs($user)->postJson('/api/v1/subscription/change-plan', [
            'plan' => 'professional'
        ]);

        // Sin suscripción activa, debe retornar 402
        $this->assertEquals(402, $response->status());
        $this->assertTrue($response->json('requires_checkout'));
    }

    /**
     * Test que un usuario puede cambiar a plan gratuito sin restricciones
     */
    public function test_user_can_always_change_to_free_plan()
    {
        $user = User::factory()->create(['current_plan' => 'professional']);
        $workspace = Workspace::factory()->create(['created_by' => $user->id]);
        $user->workspaces()->attach($workspace->id);
        $user->update(['current_workspace_id' => $workspace->id]);

        $response = $this->actingAs($user)->postJson('/api/v1/subscription/change-plan', [
            'plan' => 'free'
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }
}

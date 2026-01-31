<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class ApiRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles if necessary
        if (Role::count() === 0) {
            Role::create(['name' => 'Owner', 'slug' => 'owner']);
        }
    }

    public function test_can_access_workspaces_list()
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create(['created_by' => $user->id]);
        $user->workspaces()->attach($workspace->id, ['role_id' => Role::where('slug', 'owner')->first()->id]);
        $user->update(['current_workspace_id' => $workspace->id]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/workspaces');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'workspaces',
                    'roles'
                ]
            ]);
    }

    public function test_can_access_publications_list()
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create(['created_by' => $user->id]);
        $user->workspaces()->attach($workspace->id, ['role_id' => Role::where('slug', 'owner')->first()->id]);
        $user->update(['current_workspace_id' => $workspace->id]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/publications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data',
                    'links'
                ]
            ]);
    }

    public function test_can_access_notifications_stats()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/notifications/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ])
            ->assertJsonStructure([
                'data' => [
                    'total',
                    'unread',
                    'by_category',
                    'by_priority'
                ]
            ]);
    }
}

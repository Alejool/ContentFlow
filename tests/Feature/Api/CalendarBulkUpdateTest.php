<?php

namespace Tests\Feature\Api;

use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\Workspace;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalendarBulkUpdateTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user and workspace
        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create();
        
        // Assign user to workspace
        $this->user->workspaces()->attach($this->workspace->id, [
            'role' => 'admin',
            'permissions' => json_encode(['manage-content' => true]),
        ]);
        
        $this->user->current_workspace_id = $this->workspace->id;
        $this->user->save();
    }

    public function test_bulk_update_requires_authentication()
    {
        $response = $this->postJson('/api/v1/calendar/bulk-update', [
            'event_ids' => ['pub_1'],
            'new_date' => now()->addDay()->toDateString(),
            'operation' => 'move',
        ]);

        $response->assertStatus(401);
    }

    public function test_bulk_update_validates_required_fields()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_ids', 'new_date', 'operation']);
    }

    public function test_bulk_update_validates_event_ids_array()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => 'not-an-array',
                'new_date' => now()->addDay()->toDateString(),
                'operation' => 'move',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_ids']);
    }

    public function test_bulk_update_validates_minimum_one_event()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => [],
                'new_date' => now()->addDay()->toDateString(),
                'operation' => 'move',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_ids']);
    }

    public function test_bulk_update_validates_operation_type()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => ['pub_1'],
                'new_date' => now()->addDay()->toDateString(),
                'operation' => 'invalid',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['operation']);
    }

    public function test_bulk_update_validates_date_format()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => ['pub_1'],
                'new_date' => 'not-a-date',
                'operation' => 'move',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['new_date']);
    }

    public function test_bulk_update_moves_publications_successfully()
    {
        // Create publications
        $publications = Publication::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => now(),
        ]);

        $eventIds = $publications->map(fn($pub) => "pub_{$pub->id}")->toArray();
        $newDate = now()->addDays(5);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => $eventIds,
                'new_date' => $newDate->toDateString(),
                'operation' => 'move',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'successful_count' => 3,
                    'failed_count' => 0,
                ],
            ]);

        // Verify publications were updated
        foreach ($publications as $publication) {
            $this->assertDatabaseHas('publications', [
                'id' => $publication->id,
            ]);
            
            $updated = Publication::find($publication->id);
            $this->assertEquals(
                $newDate->format('Y-m-d'),
                $updated->scheduled_at->format('Y-m-d')
            );
        }
    }

    public function test_bulk_update_returns_partial_success_on_errors()
    {
        // Create one valid publication
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => now(),
        ]);

        $eventIds = [
            "pub_{$publication->id}",
            'pub_99999', // Non-existent publication
        ];
        $newDate = now()->addDays(5);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => $eventIds,
                'new_date' => $newDate->toDateString(),
                'operation' => 'move',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'successful_count' => 1,
                    'failed_count' => 1,
                ],
            ]);

        // Verify the valid publication was updated
        $updated = Publication::find($publication->id);
        $this->assertEquals(
            $newDate->format('Y-m-d'),
            $updated->scheduled_at->format('Y-m-d')
        );
    }

    public function test_bulk_update_requires_manage_content_permission()
    {
        // Create user without manage-content permission
        $userWithoutPermission = User::factory()->create();
        $userWithoutPermission->workspaces()->attach($this->workspace->id, [
            'role' => 'viewer',
            'permissions' => json_encode(['manage-content' => false]),
        ]);
        $userWithoutPermission->current_workspace_id = $this->workspace->id;
        $userWithoutPermission->save();

        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => now(),
        ]);

        $response = $this->actingAs($userWithoutPermission)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => ["pub_{$publication->id}"],
                'new_date' => now()->addDay()->toDateString(),
                'operation' => 'move',
            ]);

        $response->assertStatus(403);
    }

    public function test_bulk_update_creates_operation_history()
    {
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => ["pub_{$publication->id}"],
                'new_date' => now()->addDay()->toDateString(),
                'operation' => 'move',
            ]);

        $response->assertStatus(200);

        // Verify operation history was created
        $this->assertDatabaseHas('bulk_operation_history', [
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'operation_type' => 'move',
            'successful_count' => 1,
            'failed_count' => 0,
        ]);
    }
}

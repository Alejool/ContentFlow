<?php

namespace Tests\Feature\Api;

use App\Models\Calendar\BulkOperationHistory;
use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalendarBulkUndoTest extends TestCase
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

    public function test_undo_requires_authentication()
    {
        $response = $this->postJson('/api/v1/calendar/bulk-undo');

        $response->assertStatus(401);
    }

    public function test_undo_returns_404_when_no_operation_exists()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-undo');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'No operation to undo',
            ]);
    }

    public function test_undo_returns_400_when_operation_too_old()
    {
        // Create a publication
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => now(),
        ]);

        // Create an old operation history (more than 5 minutes ago)
        $oldOperation = BulkOperationHistory::create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'operation_type' => 'move',
            'event_ids' => ["pub_{$publication->id}"],
            'previous_state' => [[
                'id' => "pub_{$publication->id}",
                'type' => 'publication',
                'resource_id' => $publication->id,
                'scheduled_at' => now()->subDay()->toIso8601String(),
            ]],
            'new_state' => [
                'new_date' => now()->toIso8601String(),
                'operation' => 'move',
            ],
            'successful_count' => 1,
            'failed_count' => 0,
        ]);

        // Manually set created_at to 6 minutes ago
        $oldOperation->created_at = now()->subMinutes(6);
        $oldOperation->save();

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-undo');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Operation too old to undo',
            ]);
    }

    public function test_undo_restores_publication_dates_successfully()
    {
        // Create publications
        $publications = Publication::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => now(),
        ]);

        $originalDates = $publications->pluck('scheduled_at', 'id')->toArray();
        $newDate = now()->addDays(5);

        // Perform bulk update
        $eventIds = $publications->map(fn($pub) => "pub_{$pub->id}")->toArray();
        $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-update', [
                'event_ids' => $eventIds,
                'new_date' => $newDate->toDateString(),
                'operation' => 'move',
            ]);

        // Verify publications were updated
        foreach ($publications as $publication) {
            $updated = Publication::find($publication->id);
            $this->assertEquals(
                $newDate->format('Y-m-d'),
                $updated->scheduled_at->format('Y-m-d')
            );
        }

        // Now undo the operation
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-undo');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'successful_count' => 3,
                    'failed_count' => 0,
                ],
            ]);

        // Verify publications were restored to original dates
        foreach ($publications as $publication) {
            $restored = Publication::find($publication->id);
            $this->assertEquals(
                Carbon::parse($originalDates[$publication->id])->format('Y-m-d H:i'),
                $restored->scheduled_at->format('Y-m-d H:i')
            );
        }

        // Verify operation history was deleted
        $this->assertDatabaseMissing('bulk_operation_history', [
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_undo_requires_manage_content_permission()
    {
        // Create user without manage-content permission
        $userWithoutPermission = User::factory()->create();
        $userWithoutPermission->workspaces()->attach($this->workspace->id, [
            'role' => 'viewer',
            'permissions' => json_encode(['manage-content' => false]),
        ]);
        $userWithoutPermission->current_workspace_id = $this->workspace->id;
        $userWithoutPermission->save();

        // Create a recent operation for this user
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => now(),
        ]);

        BulkOperationHistory::create([
            'user_id' => $userWithoutPermission->id,
            'workspace_id' => $this->workspace->id,
            'operation_type' => 'move',
            'event_ids' => ["pub_{$publication->id}"],
            'previous_state' => [[
                'id' => "pub_{$publication->id}",
                'type' => 'publication',
                'resource_id' => $publication->id,
                'scheduled_at' => now()->subDay()->toIso8601String(),
            ]],
            'new_state' => [
                'new_date' => now()->toIso8601String(),
                'operation' => 'move',
            ],
            'successful_count' => 1,
            'failed_count' => 0,
        ]);

        $response = $this->actingAs($userWithoutPermission)
            ->postJson('/api/v1/calendar/bulk-undo');

        $response->assertStatus(403);
    }

    public function test_undo_only_affects_user_own_operations()
    {
        // Create another user
        $otherUser = User::factory()->create();
        $otherUser->workspaces()->attach($this->workspace->id, [
            'role' => 'admin',
            'permissions' => json_encode(['manage-content' => true]),
        ]);
        $otherUser->current_workspace_id = $this->workspace->id;
        $otherUser->save();

        // Create operation for other user
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => now(),
        ]);

        BulkOperationHistory::create([
            'user_id' => $otherUser->id,
            'workspace_id' => $this->workspace->id,
            'operation_type' => 'move',
            'event_ids' => ["pub_{$publication->id}"],
            'previous_state' => [[
                'id' => "pub_{$publication->id}",
                'type' => 'publication',
                'resource_id' => $publication->id,
                'scheduled_at' => now()->subDay()->toIso8601String(),
            ]],
            'new_state' => [
                'new_date' => now()->toIso8601String(),
                'operation' => 'move',
            ],
            'successful_count' => 1,
            'failed_count' => 0,
        ]);

        // Try to undo as current user (should not find the operation)
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/calendar/bulk-undo');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'No operation to undo',
            ]);
    }

    public function test_bulk_operation_history_can_undo_method()
    {
        // Test canUndo() method within 5 minutes
        $recentOperation = BulkOperationHistory::create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'operation_type' => 'move',
            'event_ids' => ['pub_1'],
            'previous_state' => [],
            'new_state' => [],
            'successful_count' => 1,
            'failed_count' => 0,
        ]);

        $this->assertTrue($recentOperation->canUndo());

        // Test canUndo() method after 5 minutes
        $oldOperation = BulkOperationHistory::create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'operation_type' => 'move',
            'event_ids' => ['pub_2'],
            'previous_state' => [],
            'new_state' => [],
            'successful_count' => 1,
            'failed_count' => 0,
        ]);

        // Manually set created_at to 6 minutes ago
        $oldOperation->created_at = now()->subMinutes(6);
        $oldOperation->save();

        $this->assertFalse($oldOperation->canUndo());
    }
}

<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Workspace;
use App\Models\UserCalendarEvent;

class UserCalendarEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_public_and_own_private_events()
    {
        // Create a user and a workspace, then assign workspace as current
        $userA = User::factory()->create();
        $workspace = Workspace::create([
            'name' => 'Test Workspace',
            'slug' => 'test-workspace',
            'created_by' => $userA->id,
        ]);

        $userA->current_workspace_id = $workspace->id;
        $userA->save();

        $userB = User::factory()->create(['current_workspace_id' => $workspace->id]);

        // Events: one public by B, one private by B, one private by A
        $publicEvent = UserCalendarEvent::create([
            'user_id' => $userB->id,
            'workspace_id' => $workspace->id,
            'title' => 'Public event',
            'start_date' => now(),
            'is_public' => true,
        ]);

        $bPrivate = UserCalendarEvent::create([
            'user_id' => $userB->id,
            'workspace_id' => $workspace->id,
            'title' => 'B private',
            'start_date' => now(),
            'is_public' => false,
        ]);

        $aPrivate = UserCalendarEvent::create([
            'user_id' => $userA->id,
            'workspace_id' => $workspace->id,
            'title' => 'A private',
            'start_date' => now(),
            'is_public' => false,
        ]);

        $response = $this->actingAs($userA, 'sanctum')->getJson('/api/v1/calendar/user-events');

        $response->assertStatus(200);

        $response->assertJsonFragment(['title' => 'Public event']);
        $response->assertJsonFragment(['title' => 'A private']);
        $response->assertJsonMissing(['title' => 'B private']);
    }
}

<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\Calendar\CalendarService;
use App\Services\Calendar\CalendarFilters;
use App\Services\Calendar\BulkOperationResult;
use App\Models\Publications\Publication;
use App\Models\Workspace\Workspace;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CalendarServiceTest extends TestCase
{
    use RefreshDatabase;

    protected CalendarService $service;
    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->service = new CalendarService();
        
        // Create test user and workspace
        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create();
        $this->user->current_workspace_id = $this->workspace->id;
        $this->user->save();
        
        $this->actingAs($this->user);
    }

    public function test_bulk_update_dates_updates_all_publications_successfully()
    {
        // Create test publications
        $publications = Publication::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => Carbon::now()->addDays(1),
        ]);

        $publicationIds = $publications->pluck('id')->toArray();
        $newDate = Carbon::now()->addDays(5);

        // Execute bulk update
        $result = $this->service->bulkUpdateDates(
            $publicationIds,
            $newDate,
            $this->workspace->id
        );

        // Assert all operations were successful
        $this->assertTrue($result->isFullSuccess());
        $this->assertEquals(3, $result->getSuccessCount());
        $this->assertEquals(0, $result->getFailureCount());

        // Verify dates were updated in database
        foreach ($publicationIds as $id) {
            $publication = Publication::find($id);
            $this->assertEquals(
                $newDate->format('Y-m-d H:i:s'),
                $publication->scheduled_at->format('Y-m-d H:i:s')
            );
        }
    }

    public function test_bulk_update_dates_handles_partial_failures()
    {
        // Create valid publications
        $validPublications = Publication::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => Carbon::now()->addDays(1),
        ]);

        // Mix valid IDs with invalid ones
        $publicationIds = array_merge(
            $validPublications->pluck('id')->toArray(),
            [99999, 99998] // Non-existent IDs
        );

        $newDate = Carbon::now()->addDays(5);

        // Execute bulk update
        $result = $this->service->bulkUpdateDates(
            $publicationIds,
            $newDate,
            $this->workspace->id
        );

        // Assert partial success
        $this->assertFalse($result->isFullSuccess());
        $this->assertEquals(2, $result->getSuccessCount());
        $this->assertEquals(2, $result->getFailureCount());

        // Verify valid publications were updated
        foreach ($validPublications as $publication) {
            $publication->refresh();
            $this->assertEquals(
                $newDate->format('Y-m-d H:i:s'),
                $publication->scheduled_at->format('Y-m-d H:i:s')
            );
        }
    }

    public function test_bulk_update_dates_respects_workspace_isolation()
    {
        // Create publication in different workspace
        $otherWorkspace = Workspace::factory()->create();
        $otherPublication = Publication::factory()->create([
            'workspace_id' => $otherWorkspace->id,
            'scheduled_at' => Carbon::now()->addDays(1),
        ]);

        $newDate = Carbon::now()->addDays(5);

        // Try to update publication from different workspace
        $result = $this->service->bulkUpdateDates(
            [$otherPublication->id],
            $newDate,
            $this->workspace->id
        );

        // Assert operation failed
        $this->assertFalse($result->isFullSuccess());
        $this->assertEquals(0, $result->getSuccessCount());
        $this->assertEquals(1, $result->getFailureCount());

        // Verify publication was not updated
        $otherPublication->refresh();
        $this->assertNotEquals(
            $newDate->format('Y-m-d H:i:s'),
            $otherPublication->scheduled_at->format('Y-m-d H:i:s')
        );
    }

    public function test_update_event_date_updates_single_publication()
    {
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => Carbon::now()->addDays(1),
        ]);

        $newDate = Carbon::now()->addDays(3);

        $result = $this->service->updateEventDate(
            $publication->id,
            $newDate,
            $this->workspace->id
        );

        $this->assertTrue($result);

        $publication->refresh();
        $this->assertEquals(
            $newDate->format('Y-m-d H:i:s'),
            $publication->scheduled_at->format('Y-m-d H:i:s')
        );
    }

    public function test_get_events_returns_publications_in_date_range()
    {
        $start = Carbon::now();
        $end = Carbon::now()->addDays(7);

        // Create publications within range
        Publication::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => Carbon::now()->addDays(3),
        ]);

        // Create publication outside range
        Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'scheduled_at' => Carbon::now()->addDays(10),
        ]);

        $filters = new CalendarFilters();
        $events = $this->service->getEvents(
            $this->workspace->id,
            $start,
            $end,
            $filters
        );

        $this->assertCount(3, $events);
    }

    public function test_bulk_operation_result_tracks_successes_and_failures()
    {
        $result = new BulkOperationResult();

        $result->addSuccess(1);
        $result->addSuccess(2);
        $result->addFailure(3, 'Test error');

        $this->assertEquals(2, $result->getSuccessCount());
        $this->assertEquals(1, $result->getFailureCount());
        $this->assertFalse($result->isFullSuccess());

        $array = $result->toArray();
        $this->assertArrayHasKey('successful', $array);
        $this->assertArrayHasKey('failed', $array);
        $this->assertEquals([1, 2], $array['successful']);
        $this->assertCount(1, $array['failed']);
    }
}

<?php

namespace Tests\Unit\Services\Analytics;

use App\Models\Social\SocialPostLog;
use App\Services\Analytics\PublishingInsightsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublishingInsightsServiceTest extends TestCase
{
    use RefreshDatabase;

    private PublishingInsightsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PublishingInsightsService();
        // Workspace id 1 backs the default makeLog() workspace_id
        \App\Models\Workspace\Workspace::factory()->create();
    }

    private function makeLog(array $attributes): SocialPostLog
    {
        return SocialPostLog::factory()->create(array_merge([
            'workspace_id' => 1,
            'status' => 'published',
        ], $attributes));
    }

    public function test_returns_no_data_for_empty_workspace(): void
    {
        $result = $this->service->forWorkspace(1);

        $this->assertFalse($result['has_data']);
        $this->assertSame(0, $result['sample_size']);
        $this->assertSame([], $result['insights']);
    }

    public function test_ignores_other_workspaces_and_unpublished_logs(): void
    {
        $mine = \App\Models\Workspace\Workspace::factory()->create();
        $other = \App\Models\Workspace\Workspace::factory()->create();

        $this->makeLog(['workspace_id' => $other->id]);
        $this->makeLog(['workspace_id' => $mine->id, 'status' => 'failed', 'published_at' => now()]);

        $result = $this->service->forWorkspace($mine->id);

        $this->assertFalse($result['has_data']);
    }

    public function test_best_hour_prefers_highest_average_engagement(): void
    {
        // Two posts at 09:00 with high engagement, two at 18:00 with low
        foreach ([1, 2] as $day) {
            $this->makeLog([
                'published_at' => now()->subDays($day)->setTime(9, 0),
                'engagement_data' => ['likes' => 100, 'comments' => 20],
            ]);
            $this->makeLog([
                'published_at' => now()->subDays($day)->setTime(18, 0),
                'engagement_data' => ['likes' => 2],
            ]);
        }

        $result = $this->service->forWorkspace(1);
        $bestHour = collect($result['insights'])->firstWhere('type', 'best_hour');

        $this->assertTrue($result['has_data']);
        $this->assertSame(9, $bestHour['value']);
        $this->assertSame('09:00', $bestHour['label']);
        $this->assertSame(2, $bestHour['sample_size']);
    }

    public function test_best_platform_requires_at_least_two_platforms(): void
    {
        $this->makeLog(['platform' => 'facebook', 'published_at' => now()->subDay()]);
        $this->makeLog(['platform' => 'facebook', 'published_at' => now()->subDays(2)]);

        $result = $this->service->forWorkspace(1);

        $this->assertNull(collect($result['insights'])->firstWhere('type', 'best_platform'));
    }

    public function test_best_platform_and_format_picked_by_engagement(): void
    {
        foreach ([1, 2] as $day) {
            $this->makeLog([
                'platform' => 'instagram',
                'post_type' => 'reel',
                'published_at' => now()->subDays($day),
                'engagement_data' => ['likes' => 500],
            ]);
            $this->makeLog([
                'platform' => 'twitter',
                'post_type' => 'post',
                'published_at' => now()->subDays($day),
                'engagement_data' => ['likes' => 5],
            ]);
        }

        $result = $this->service->forWorkspace(1);
        $insights = collect($result['insights']);

        $this->assertSame('instagram', $insights->firstWhere('type', 'best_platform')['value']);
        $this->assertSame('reel', $insights->firstWhere('type', 'best_format')['value']);
    }

    public function test_week_trend_compares_last_two_weeks(): void
    {
        // 3 posts this week, 1 the week before => +200%
        foreach ([1, 2, 3] as $day) {
            $this->makeLog(['published_at' => now()->subDays($day)]);
        }
        $this->makeLog(['published_at' => now()->subDays(10)]);

        $result = $this->service->forWorkspace(1);
        $trend = collect($result['insights'])->firstWhere('type', 'week_trend');

        $this->assertSame(3, $trend['this_week']);
        $this->assertSame(1, $trend['previous_week']);
        $this->assertSame(200, $trend['value']);
    }
}

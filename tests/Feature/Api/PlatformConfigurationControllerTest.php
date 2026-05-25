<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * FASE 8: Testing - Tests de API endpoints
 */
class PlatformConfigurationControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_returns_all_platforms()
    {
        $response = $this->getJson('/api/platform-configuration/platforms');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'platforms' => [],
            'total',
            'active_count',
        ]);
    }

    /** @test */
    public function it_returns_specific_platform()
    {
        $response = $this->getJson('/api/platform-configuration/platforms/facebook');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'platform' => [
                'id',
                'key',
                'name',
                'active',
            ],
        ]);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_platform()
    {
        $response = $this->getJson('/api/platform-configuration/platforms/nonexistent');

        $response->assertStatus(404);
    }

    /** @test */
    public function it_returns_content_types()
    {
        $response = $this->getJson('/api/platform-configuration/content-types');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'content_types' => [],
            'count',
        ]);
    }

    /** @test */
    public function it_returns_media_specs()
    {
        $response = $this->getJson('/api/platform-configuration/media-specs/youtube');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'video' => [
                'formats',
                'max_size_mb',
                'max_duration_seconds',
            ],
        ]);
    }

    /** @test */
    public function it_returns_publishing_rules()
    {
        $response = $this->getJson('/api/platform-configuration/publishing-rules/twitter');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'text' => [
                'max_length',
                'min_length',
            ],
        ]);
    }

    /** @test */
    public function it_returns_capabilities_for_plan()
    {
        $response = $this->getJson('/api/platform-configuration/capabilities/pro');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'facebook' => [],
            'instagram' => [],
        ]);
    }

    /** @test */
    public function it_returns_api_limits()
    {
        $response = $this->getJson('/api/platform-configuration/api-limits/twitter');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'rate_limits',
        ]);
    }

    /** @test */
    public function it_returns_feature_flags()
    {
        $response = $this->getJson('/api/platform-configuration/feature-flags/facebook');

        $response->assertStatus(200);
        $response->isJson();
    }

    /** @test */
    public function it_validates_content()
    {
        $response = $this->postJson(
            '/api/platform-configuration/validate-content',
            [
                'publication_id' => 1,
                'platforms' => ['facebook', 'instagram'],
                'user_plan' => 'pro',
            ]
        );

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'can_publish_to_any',
            'compatible_count',
            'incompatible_count',
            'compatible_platforms',
            'incompatible_platforms',
        ]);
    }

    /** @test */
    public function it_returns_available_platforms_for_content()
    {
        $response = $this->getJson(
            '/api/platform-configuration/available-platforms-for-content',
            [
                'content_type' => 'reel',
                'user_plan' => 'pro',
            ]
        );

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'available_platforms' => [],
            'count',
        ]);
    }

    /** @test */
    public function it_returns_statistics()
    {
        $response = $this->getJson('/api/platform-configuration/statistics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'total_platforms',
            'active_platforms',
            'content_types_count',
            'supported_formats',
        ]);
    }
}

<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\PlatformConfigurationService;
use App\Services\ContentValidator;

/**
 * FASE 8: Testing - Tests para PlatformConfigurationService
 */
class PlatformConfigurationServiceTest extends TestCase
{
    private PlatformConfigurationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PlatformConfigurationService();
    }

    /** @test */
    public function it_returns_all_platforms()
    {
        $platforms = $this->service->getAllPlatforms();
        
        $this->assertIsArray($platforms);
        $this->assertGreaterThan(0, count($platforms));
        $this->assertArrayHasKey('facebook', $platforms);
        $this->assertArrayHasKey('instagram', $platforms);
        $this->assertArrayHasKey('youtube', $platforms);
        $this->assertArrayHasKey('twitter', $platforms);
    }

    /** @test */
    public function it_returns_platform_by_key()
    {
        $platform = $this->service->getPlatform('facebook');
        
        $this->assertNotNull($platform);
        $this->assertEquals('facebook', $platform->key);
        $this->assertTrue($platform->active);
    }

    /** @test */
    public function it_normalizes_platform_keys()
    {
        // Twitter puede ser 'twitter' o 'x'
        $platform1 = $this->service->getPlatform('twitter');
        $platform2 = $this->service->getPlatform('x');
        
        $this->assertEquals($platform1->key, $platform2->key);
    }

    /** @test */
    public function it_returns_content_types_for_platform()
    {
        $contentTypes = $this->service->getContentTypesForPlatform('instagram');
        
        $this->assertIsArray($contentTypes);
        $this->assertContains('post', $contentTypes);
        $this->assertContains('reel', $contentTypes);
        $this->assertContains('story', $contentTypes);
        $this->assertContains('carousel', $contentTypes);
    }

    /** @test */
    public function it_returns_media_specs_for_platform()
    {
        $specs = $this->service->getMediaSpecsForPlatform('youtube');
        
        $this->assertNotNull($specs);
        $this->assertNotNull($specs['video']);
        $this->assertArrayHasKey('max_duration_seconds', $specs['video']);
        $this->assertGreaterThan(0, $specs['video']['max_duration_seconds']);
    }

    /** @test */
    public function it_returns_publishing_rules_for_platform_and_content_type()
    {
        $rules = $this->service->getPublishingRulesForContent('twitter', 'post');
        
        $this->assertNotNull($rules);
        $this->assertArrayHasKey('text', $rules);
        $this->assertArrayHasKey('max_length', $rules['text']);
    }

    /** @test */
    public function it_returns_capabilities_for_plan()
    {
        $capabilities = $this->service->getCapabilitiesForPlan('pro');
        
        $this->assertIsArray($capabilities);
        $this->assertArrayHasKey('facebook', $capabilities);
        $this->assertArrayHasKey('instagram', $capabilities);
    }

    /** @test */
    public function it_returns_specific_capability()
    {
        $canSchedule = $this->service->hasCapability('pro', 'facebook', 'can_schedule');
        
        $this->assertTrue($canSchedule);
    }

    /** @test */
    public function it_returns_false_for_free_plan_limited_capability()
    {
        $canSchedule = $this->service->hasCapability('free', 'facebook', 'can_schedule');
        
        $this->assertFalse($canSchedule);
    }

    /** @test */
    public function it_caches_results()
    {
        $platforms1 = $this->service->getAllPlatforms();
        $platforms2 = $this->service->getAllPlatforms();
        
        $this->assertEquals($platforms1, $platforms2);
    }

    /** @test */
    public function it_clears_cache()
    {
        $this->service->getAllPlatforms();
        $this->service->clearCache();
        
        $platforms = $this->service->getAllPlatforms();
        $this->assertNotEmpty($platforms);
    }
}

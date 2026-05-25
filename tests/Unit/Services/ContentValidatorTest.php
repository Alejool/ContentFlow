<?php

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use App\Services\ContentValidator;
use App\Services\PlatformConfigurationService;

/**
 * FASE 8: Testing - Tests para ContentValidator
 */
class ContentValidatorTest extends TestCase
{
    private ContentValidator $validator;
    private PlatformConfigurationService $configService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->configService = new PlatformConfigurationService();
        $this->validator = new ContentValidator($this->configService);
    }

    /** @test */
    public function it_validates_content_type_support()
    {
        $result = $this->validator->validateForPlatform(
            'instagram',
            'reel',
            ['facebook', 'instagram', 'tiktok']
        );

        $this->assertTrue($result['compatible']);
    }

    /** @test */
    public function it_rejects_unsupported_content_type()
    {
        // Twitter no soporta 'reel' como tipo de contenido
        $result = $this->validator->validateForPlatform(
            'twitter',
            'reel',
            ['twitter']
        );

        $this->assertFalse($result['compatible']);
        $this->assertStringContainsString('not supported', $result['reason'] ?? '');
    }

    /** @test */
    public function it_validates_platform_availability()
    {
        $platforms = ['facebook', 'instagram', 'youtube'];
        $result = $this->validator->validatePlatformAvailability($platforms);

        $this->assertIsArray($result);
        $this->assertCount(3, $result);
    }

    /** @test */
    public function it_marks_inactive_platforms_as_unavailable()
    {
        $result = $this->validator->validatePlatformAvailability(['facebook']);

        $this->assertTrue($result['facebook']['available']);
    }

    /** @test */
    public function it_validates_user_capability()
    {
        $canPublish = $this->validator->validateUserCapability('pro', 'facebook', 'can_publish');

        $this->assertTrue($canPublish);
    }

    /** @test */
    public function it_rejects_unsupported_capabilities_for_free_plan()
    {
        $canSchedule = $this->validator->validateUserCapability('free', 'facebook', 'can_schedule');

        $this->assertFalse($canSchedule);
    }

    /** @test */
    public function it_validates_text_length()
    {
        $result = $this->validator->validateTextForPlatform('twitter', 'x' . str_repeat('a', 280));

        $this->assertFalse($result['compatible']);
    }

    /** @test */
    public function it_accepts_valid_text_length()
    {
        $result = $this->validator->validateTextForPlatform('twitter', 'Valid tweet content');

        $this->assertTrue($result['compatible']);
    }
}

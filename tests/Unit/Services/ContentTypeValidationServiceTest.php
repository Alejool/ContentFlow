<?php

namespace Tests\Unit\Services;

use App\Services\Publications\ContentTypeValidationService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class ContentTypeValidationServiceTest extends TestCase
{
    private ContentTypeValidationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ContentTypeValidationService();
    }

    /** @test */
    public function it_returns_supported_content_types_for_instagram()
    {
        $supported = $this->service->getSupportedContentTypes('instagram');

        $this->assertContains('post', $supported);
        $this->assertContains('reel', $supported);
        $this->assertContains('story', $supported);
        $this->assertContains('carousel', $supported);
        $this->assertNotContains('poll', $supported);
    }

    /** @test */
    public function it_returns_supported_content_types_for_tiktok()
    {
        $supported = $this->service->getSupportedContentTypes('tiktok');

        $this->assertContains('reel', $supported);
        $this->assertNotContains('post', $supported);
        $this->assertNotContains('story', $supported);
        $this->assertNotContains('carousel', $supported);
        $this->assertNotContains('poll', $supported);
    }

    /** @test */
    public function it_returns_supported_content_types_for_twitter()
    {
        $supported = $this->service->getSupportedContentTypes('twitter');

        $this->assertContains('post', $supported);
        $this->assertContains('poll', $supported);
        $this->assertNotContains('reel', $supported);
        $this->assertNotContains('story', $supported);
        $this->assertNotContains('carousel', $supported);
    }

    /** @test */
    public function it_returns_supported_content_types_for_youtube()
    {
        $supported = $this->service->getSupportedContentTypes('youtube');

        $this->assertContains('post', $supported);
        $this->assertContains('reel', $supported);
        $this->assertNotContains('story', $supported);
        $this->assertNotContains('carousel', $supported);
        $this->assertNotContains('poll', $supported);
    }

    /** @test */
    public function it_returns_empty_array_for_unknown_platform()
    {
        $supported = $this->service->getSupportedContentTypes('unknown_platform');

        $this->assertEmpty($supported);
    }

    /** @test */
    public function it_returns_correct_rules_for_post()
    {
        $rules = $this->service->getContentTypeRules('post');

        $this->assertArrayHasKey('platforms', $rules);
        $this->assertArrayHasKey('media', $rules);
        $this->assertContains('instagram', $rules['platforms']);
        $this->assertFalse($rules['media']['required']);
        $this->assertEquals(0, $rules['media']['min_count']);
        $this->assertEquals(10, $rules['media']['max_count']);
    }

    /** @test */
    public function it_returns_correct_rules_for_reel()
    {
        $rules = $this->service->getContentTypeRules('reel');

        $this->assertArrayHasKey('platforms', $rules);
        $this->assertArrayHasKey('media', $rules);
        $this->assertContains('instagram', $rules['platforms']);
        $this->assertContains('tiktok', $rules['platforms']);
        $this->assertTrue($rules['media']['required']);
        $this->assertEquals(1, $rules['media']['min_count']);
        $this->assertEquals(1, $rules['media']['max_count']);
        $this->assertEquals(['video'], $rules['media']['types']);
    }

    /** @test */
    public function it_returns_correct_rules_for_carousel()
    {
        $rules = $this->service->getContentTypeRules('carousel');

        $this->assertArrayHasKey('platforms', $rules);
        $this->assertArrayHasKey('media', $rules);
        $this->assertContains('instagram', $rules['platforms']);
        $this->assertTrue($rules['media']['required']);
        $this->assertEquals(2, $rules['media']['min_count']);
        $this->assertEquals(10, $rules['media']['max_count']);
    }

    /** @test */
    public function it_returns_correct_rules_for_story()
    {
        $rules = $this->service->getContentTypeRules('story');

        $this->assertArrayHasKey('platforms', $rules);
        $this->assertArrayHasKey('media', $rules);
        $this->assertContains('instagram', $rules['platforms']);
        $this->assertTrue($rules['media']['required']);
        $this->assertEquals(1, $rules['media']['min_count']);
        $this->assertEquals(1, $rules['media']['max_count']);
    }

    /** @test */
    public function it_returns_empty_array_for_unknown_content_type()
    {
        $rules = $this->service->getContentTypeRules('unknown_type');

        $this->assertEmpty($rules);
    }

    /** @test */
    public function it_validates_reel_requires_exactly_one_video()
    {
        $videoFile = UploadedFile::fake()->create('video.mp4', 1000, 'video/mp4');
        
        $result = $this->service->validateMediaFiles('reel', [$videoFile]);

        $this->assertTrue($result->isValid);
        $this->assertEmpty($result->errors);
    }

    /** @test */
    public function it_rejects_reel_with_no_files()
    {
        $result = $this->service->validateMediaFiles('reel', []);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('requires exactly 1 media file', $result->errors[0]);
    }

    /** @test */
    public function it_rejects_reel_with_multiple_files()
    {
        $videoFile1 = UploadedFile::fake()->create('video1.mp4', 1000, 'video/mp4');
        $videoFile2 = UploadedFile::fake()->create('video2.mp4', 1000, 'video/mp4');
        
        $result = $this->service->validateMediaFiles('reel', [$videoFile1, $videoFile2]);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
    }

    /** @test */
    public function it_rejects_reel_with_image_file()
    {
        $imageFile = UploadedFile::fake()->image('photo.jpg');
        
        $result = $this->service->validateMediaFiles('reel', [$imageFile]);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('video file(s) only', $result->errors[0]);
    }

    /** @test */
    public function it_validates_carousel_with_multiple_images()
    {
        $image1 = UploadedFile::fake()->image('photo1.jpg');
        $image2 = UploadedFile::fake()->image('photo2.jpg');
        $image3 = UploadedFile::fake()->image('photo3.jpg');
        
        $result = $this->service->validateMediaFiles('carousel', [$image1, $image2, $image3]);

        $this->assertTrue($result->isValid);
        $this->assertEmpty($result->errors);
    }

    /** @test */
    public function it_rejects_carousel_with_one_file()
    {
        $image = UploadedFile::fake()->image('photo.jpg');
        
        $result = $this->service->validateMediaFiles('carousel', [$image]);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('at least 2 media file', $result->errors[0]);
    }

    /** @test */
    public function it_rejects_carousel_with_too_many_files()
    {
        $files = [];
        for ($i = 0; $i < 11; $i++) {
            $files[] = UploadedFile::fake()->image("photo{$i}.jpg");
        }
        
        $result = $this->service->validateMediaFiles('carousel', $files);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('maximum 10 media file', $result->errors[0]);
    }

    /** @test */
    public function it_validates_story_with_one_image()
    {
        $image = UploadedFile::fake()->image('photo.jpg');
        
        $result = $this->service->validateMediaFiles('story', [$image]);

        $this->assertTrue($result->isValid);
        $this->assertEmpty($result->errors);
    }

    /** @test */
    public function it_validates_story_with_one_video()
    {
        $video = UploadedFile::fake()->create('video.mp4', 1000, 'video/mp4');
        
        $result = $this->service->validateMediaFiles('story', [$video]);

        $this->assertTrue($result->isValid);
        $this->assertEmpty($result->errors);
    }

    /** @test */
    public function it_rejects_story_with_multiple_files()
    {
        $image1 = UploadedFile::fake()->image('photo1.jpg');
        $image2 = UploadedFile::fake()->image('photo2.jpg');
        
        $result = $this->service->validateMediaFiles('story', [$image1, $image2]);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
    }

    /** @test */
    public function it_validates_post_with_no_files()
    {
        $result = $this->service->validateMediaFiles('post', []);

        $this->assertTrue($result->isValid);
        $this->assertEmpty($result->errors);
    }

    /** @test */
    public function it_validates_post_with_multiple_files()
    {
        $image1 = UploadedFile::fake()->image('photo1.jpg');
        $image2 = UploadedFile::fake()->image('photo2.jpg');
        $video = UploadedFile::fake()->create('video.mp4', 1000, 'video/mp4');
        
        $result = $this->service->validateMediaFiles('post', [$image1, $image2, $video]);

        $this->assertTrue($result->isValid);
        $this->assertEmpty($result->errors);
    }

    /** @test */
    public function it_validates_cross_platform_with_compatible_content_type()
    {
        $result = $this->service->validateCrossPlatform('post', ['instagram', 'twitter', 'facebook']);

        $this->assertTrue($result->isValid);
        $this->assertEmpty($result->errors);
        $this->assertEmpty($result->failedPlatforms);
    }

    /** @test */
    public function it_rejects_carousel_on_tiktok()
    {
        $result = $this->service->validateCrossPlatform('carousel', ['tiktok']);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('not supported by Tiktok', $result->errors[0]);
        $this->assertContains('tiktok', $result->failedPlatforms);
    }

    /** @test */
    public function it_rejects_story_on_youtube()
    {
        $result = $this->service->validateCrossPlatform('story', ['youtube']);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('not supported by Youtube', $result->errors[0]);
        $this->assertContains('youtube', $result->failedPlatforms);
    }

    /** @test */
    public function it_rejects_poll_on_instagram()
    {
        $result = $this->service->validateCrossPlatform('poll', ['instagram']);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('not supported by Instagram', $result->errors[0]);
        $this->assertContains('instagram', $result->failedPlatforms);
    }

    /** @test */
    public function it_rejects_cross_platform_with_incompatible_platforms()
    {
        $result = $this->service->validateCrossPlatform('carousel', ['instagram', 'tiktok']);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('not supported by all selected platforms', $result->errors[0]);
        $this->assertContains('tiktok', $result->failedPlatforms);
    }

    /** @test */
    public function it_validates_reel_on_multiple_compatible_platforms()
    {
        $result = $this->service->validateCrossPlatform('reel', ['instagram', 'tiktok', 'youtube']);

        $this->assertTrue($result->isValid);
        $this->assertEmpty($result->errors);
        $this->assertEmpty($result->failedPlatforms);
    }

    /** @test */
    public function it_handles_null_content_type_gracefully()
    {
        $rules = $this->service->getContentTypeRules('');

        $this->assertEmpty($rules);
    }

    /** @test */
    public function it_rejects_unknown_content_type_in_validation()
    {
        $result = $this->service->validateCrossPlatform('unknown_type', ['instagram']);

        $this->assertFalse($result->isValid);
        $this->assertNotEmpty($result->errors);
        $this->assertStringContainsString('not recognized', $result->errors[0]);
    }
}

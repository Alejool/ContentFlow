<?php

namespace Tests\Unit\Services;

use App\Services\ContentSanitizerService;
use Tests\TestCase;

class ContentSanitizerServiceTest extends TestCase
{
    private ContentSanitizerService $sanitizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sanitizer = new ContentSanitizerService();
    }

    public function test_removes_script_tags()
    {
        $content = '<p>Safe content</p><script>alert("xss")</script>';
        $result = $this->sanitizer->sanitize($content);

        $this->assertStringNotContainsString('<script>', $result->content);
        $this->assertStringContainsString('<p>Safe content</p>', $result->content);
        $this->assertTrue($result->wasModified);
    }

    public function test_removes_dangerous_javascript_urls()
    {
        $content = '<a href="javascript:alert(1)">Bad Link</a>';
        $result = $this->sanitizer->sanitize($content);

        $this->assertStringNotContainsString('javascript:', $result->content);
        $this->assertTrue($result->wasModified);
    }

    public function test_preserves_safe_https_urls()
    {
        $content = '<a href="https://example.com">Good Link</a>';
        $result = $this->sanitizer->sanitize($content);

        $this->assertStringContainsString('https://example.com', $result->content);
    }

    public function test_allows_whitelisted_html_tags()
    {
        $content = '<p>Paragraph</p><strong>Bold</strong><em>Italic</em><ul><li>Item</li></ul>';
        $result = $this->sanitizer->sanitize($content);

        $this->assertStringContainsString('<p>Paragraph</p>', $result->content);
        $this->assertStringContainsString('<strong>Bold</strong>', $result->content);
        $this->assertStringContainsString('<em>Italic</em>', $result->content);
        $this->assertStringContainsString('<ul>', $result->content);
        $this->assertStringContainsString('<li>Item</li>', $result->content);
    }

    public function test_removes_disallowed_html_tags()
    {
        $content = '<div>Div content</div><iframe src="evil.com"></iframe>';
        $result = $this->sanitizer->sanitize($content);

        // HTMLPurifier converts div to p (AutoParagraph), but iframe should be removed
        $this->assertStringNotContainsString('<iframe>', $result->content);
        $this->assertStringContainsString('Div content', $result->content); // Content preserved
        $this->assertTrue($result->wasModified);
    }

    public function test_detects_when_content_is_not_modified()
    {
        $content = '<p>Simple safe paragraph</p>';
        $result = $this->sanitizer->sanitize($content);

        $this->assertEquals($content, $result->content);
        $this->assertFalse($result->wasModified);
    }

    public function test_replaces_invalid_urls_with_hash()
    {
        $content = '<a href="not-a-valid-url">Link</a>';
        $result = $this->sanitizer->sanitize($content);

        $this->assertStringContainsString('href="#"', $result->content);
        $this->assertTrue($result->wasModified);
    }

    public function test_removes_event_handlers()
    {
        $content = '<p onclick="alert(1)">Click me</p>';
        $result = $this->sanitizer->sanitize($content);

        $this->assertStringNotContainsString('onclick', $result->content);
        $this->assertTrue($result->wasModified);
    }

    public function test_allows_img_tags_with_src_attribute()
    {
        $content = '<p>Check this image:</p><img src="https://example.com/image.jpg" alt="Example image">';
        $result = $this->sanitizer->sanitize($content);

        $this->assertStringContainsString('<img', $result->content);
        $this->assertStringContainsString('src="https://example.com/image.jpg"', $result->content);
        $this->assertStringContainsString('alt="Example image"', $result->content);
    }

    public function test_removes_img_tags_with_javascript_urls()
    {
        $content = '<img src="javascript:alert(1)">';
        $result = $this->sanitizer->sanitize($content);

        $this->assertStringNotContainsString('javascript:', $result->content);
        $this->assertTrue($result->wasModified);
    }

    public function test_removes_img_tags_with_data_urls()
    {
        $content = '<img src="data:image/svg+xml,<svg>...</svg>">';
        $result = $this->sanitizer->sanitize($content);

        // Data URLs should be blocked by URI.AllowedSchemes
        $this->assertStringNotContainsString('data:', $result->content);
        $this->assertTrue($result->wasModified);
    }
}

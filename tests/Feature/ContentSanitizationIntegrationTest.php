<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AIService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentSanitizationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ai_chat_response_is_sanitized()
    {
        $user = User::factory()->create();

        // Mock the AI service to return content with XSS
        $this->mock(AIService::class, function ($mock) {
            $mock->shouldReceive('chat')
                ->once()
                ->andReturn([
                    'message' => '<p>Safe response</p><script>alert("xss")</script>',
                    'provider' => 'test',
                    'model' => 'test-model'
                ]);
        });

        $response = $this->actingAs($user)
            ->postJson('/api/v1/ai/chat', [
                'message' => 'Test message',
                'source' => 'chat'
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        // Verify the response does not contain the script tag
        $this->assertStringNotContainsString('<script>', $response->json('message'));
        $this->assertStringContainsString('Safe response', $response->json('message'));
    }

    public function test_ai_field_suggestions_are_sanitized()
    {
        $user = User::factory()->create([
            'ai_settings' => [
                'deepseek' => [
                    'enabled' => true,
                    'api_key' => 'test-key'
                ]
            ]
        ]);

        // Mock the AI service to return suggestions with XSS
        $this->mock(AIService::class, function ($mock) {
            $mock->shouldReceive('isAiEnabled')
                ->once()
                ->andReturn(true);

            $mock->shouldReceive('generateFieldSuggestions')
                ->once()
                ->andReturn([
                    'suggestion' => [
                        'data' => [
                            'title' => '<strong>Good Title</strong>',
                            'description' => '<p>Description</p><script>alert("xss")</script>'
                        ]
                    ],
                    'message' => 'Suggestions generated'
                ]);
        });

        $response = $this->actingAs($user)
            ->postJson('/api/v1/ai/suggest-fields', [
                'fields' => ['title', 'description'],
                'type' => 'publication',
                'language' => 'en'
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        // Verify the suggestions do not contain script tags
        $data = $response->json('data');
        $this->assertStringNotContainsString('<script>', $data['description']);
        $this->assertStringContainsString('Description', $data['description']);
    }
}

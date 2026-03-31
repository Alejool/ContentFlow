<?php

namespace Tests\Feature\Publications;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Social\SocialAccount;
use App\Models\Publications\Publication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\Role\Role;

class FormRequestValidationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $workspace;
    protected $instagramAccount;
    protected $tiktokAccount;
    protected $youtubeAccount;
    protected $twitterAccount;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->workspace = Workspace::create([
            'name' => 'Test Workspace',
            'created_by' => $this->user->id,
        ]);

        $this->user->workspaces()->attach($this->workspace->id, [
            'role_id' => Role::firstOrCreate([
                'slug' => 'owner',
                'name' => 'Owner',
                'workspace_id' => $this->workspace->id
            ])->id
        ]);

        $this->user->current_workspace_id = $this->workspace->id;
        $this->user->save();

        // Create social accounts for different platforms
        $this->instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram'
        ]);

        $this->tiktokAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'tiktok'
        ]);

        $this->youtubeAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube'
        ]);

        $this->twitterAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter'
        ]);
    }

    /** @test */
    public function test_store_request_rejects_carousel_on_tiktok()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Carousel',
                'description' => 'Test Description',
                'content_type' => 'carousel',
                'social_accounts' => [$this->tiktokAccount->id]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content_type']);
        $this->assertStringContainsString('carousel', strtolower($response->json('errors.content_type.0')));
        $this->assertStringContainsString('tiktok', strtolower($response->json('errors.content_type.0')));
    }

    /** @test */
    public function test_store_request_rejects_story_on_youtube()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Story',
                'description' => 'Test Description',
                'content_type' => 'story',
                'social_accounts' => [$this->youtubeAccount->id]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content_type']);
        $this->assertStringContainsString('story', strtolower($response->json('errors.content_type.0')));
        $this->assertStringContainsString('youtube', strtolower($response->json('errors.content_type.0')));
    }

    /** @test */
    public function test_store_request_rejects_poll_on_instagram()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Poll',
                'description' => 'Test Description',
                'content_type' => 'poll',
                'social_accounts' => [$this->instagramAccount->id]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content_type']);
        $this->assertStringContainsString('poll', strtolower($response->json('errors.content_type.0')));
        $this->assertStringContainsString('instagram', strtolower($response->json('errors.content_type.0')));
    }

    /** @test */
    public function test_store_request_rejects_cross_platform_incompatibility()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Cross-Platform',
                'description' => 'Test Description',
                'content_type' => 'carousel',
                'social_accounts' => [$this->instagramAccount->id, $this->tiktokAccount->id]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content_type']);
        $this->assertStringContainsString('carousel', strtolower($response->json('errors.content_type.0')));
    }

    /** @test */
    public function test_store_request_accepts_valid_post_on_any_platform()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Post',
                'description' => 'Test Description',
                'content_type' => 'post',
                'social_accounts' => [$this->instagramAccount->id]
            ]);

        $response->assertStatus(201);
    }

    /** @test */
    public function test_store_request_accepts_valid_reel_on_instagram()
    {
        $videoFile = UploadedFile::fake()->create('video.mp4', 1024, 'video/mp4');

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Reel',
                'description' => 'Test Description',
                'content_type' => 'reel',
                'social_accounts' => [$this->instagramAccount->id],
                'media' => [$videoFile]
            ]);

        $response->assertStatus(201);
    }

    /** @test */
    public function test_store_request_defaults_to_post_when_content_type_not_provided()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Default',
                'description' => 'Test Description',
                'social_accounts' => [$this->instagramAccount->id]
            ]);

        $response->assertStatus(201);
        $this->assertEquals('post', Publication::latest()->first()->content_type);
    }

    /** @test */
    public function test_update_request_rejects_invalid_content_type_change()
    {
        $publication = Publication::create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'title' => 'Original Title',
            'description' => 'Original Description',
            'content_type' => 'post',
            'status' => 'draft'
        ]);

        $publication->socialAccounts()->attach($this->tiktokAccount->id);

        $response = $this->actingAs($this->user)
            ->putJson(route('api.v1.publications.update', $publication->id), [
                'title' => 'Updated Title',
                'description' => 'Updated Description',
                'content_type' => 'carousel'
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content_type']);
    }

    /** @test */
    public function test_update_request_skips_validation_when_no_relevant_changes()
    {
        $publication = Publication::create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'title' => 'Original Title',
            'description' => 'Original Description',
            'content_type' => 'post',
            'status' => 'draft'
        ]);

        $publication->socialAccounts()->attach($this->instagramAccount->id);

        // Update only title and description (no content_type, platforms, or media changes)
        $response = $this->actingAs($this->user)
            ->putJson(route('api.v1.publications.update', $publication->id), [
                'title' => 'Updated Title',
                'description' => 'Updated Description'
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function test_update_request_validates_when_platforms_change()
    {
        $publication = Publication::create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'title' => 'Original Title',
            'description' => 'Original Description',
            'content_type' => 'carousel',
            'status' => 'draft'
        ]);

        $publication->socialAccounts()->attach($this->instagramAccount->id);

        // Change platforms to include TikTok (which doesn't support carousel)
        $response = $this->actingAs($this->user)
            ->putJson(route('api.v1.publications.update', $publication->id), [
                'title' => 'Updated Title',
                'description' => 'Updated Description',
                'social_accounts' => [$this->instagramAccount->id, $this->tiktokAccount->id]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content_type']);
    }

    /** @test */
    public function test_update_request_accepts_valid_changes()
    {
        $publication = Publication::create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'title' => 'Original Title',
            'description' => 'Original Description',
            'content_type' => 'post',
            'status' => 'draft'
        ]);

        $publication->socialAccounts()->attach($this->instagramAccount->id);

        // Change to reel (valid for Instagram)
        $response = $this->actingAs($this->user)
            ->putJson(route('api.v1.publications.update', $publication->id), [
                'title' => 'Updated Title',
                'description' => 'Updated Description',
                'content_type' => 'reel'
            ]);

        $response->assertStatus(200);
    }
}

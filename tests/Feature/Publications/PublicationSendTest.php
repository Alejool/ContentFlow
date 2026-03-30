<?php

namespace Tests\Feature\Publications;

use App\Models\MediaFiles\MediaFile;
use App\Models\Permission\Permission;
use App\Models\Publications\Publication;
use App\Models\Role\Role;
use App\Models\Social\SocialAccount;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Tests para el envío de publicaciones por tipo de contenido.
 * Cubre: post, reel, story, carousel, poll
 */
class PublicationSendTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;
    protected SocialAccount $instagramAccount;
    protected SocialAccount $tiktokAccount;
    protected SocialAccount $facebookAccount;
    protected SocialAccount $twitterAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['email_verified_at' => now()]);

        $this->workspace = Workspace::create([
            'name' => 'Test Workspace',
            'created_by' => $this->user->id,
        ]);

        $ownerRole = Role::firstOrCreate(
            ['slug' => 'owner'],
            ['name' => 'Owner']
        );

        $this->user->workspaces()->attach($this->workspace->id, [
            'role_id' => $ownerRole->id,
        ]);

        $this->user->update(['current_workspace_id' => $this->workspace->id]);

        $this->instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
            'is_active' => true,
        ]);

        $this->tiktokAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'tiktok',
            'is_active' => true,
        ]);

        $this->facebookAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'facebook',
            'is_active' => true,
        ]);

        $this->twitterAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
            'is_active' => true,
        ]);
    }

    // -------------------------------------------------------------------------
    // POST
    // -------------------------------------------------------------------------

    /** @test */
    public function it_creates_a_post_publication_as_draft()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'My First Post',
                'description' => 'Post description content',
                'content_type' => 'post',
                'hashtags' => '#test #post',
                'status' => 'draft',
                'social_accounts' => [$this->instagramAccount->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'post')
            ->assertJsonPath('data.publication.status', 'draft');
    }

    /** @test */
    public function it_creates_a_post_publication_for_multiple_platforms()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Multi-platform Post',
                'description' => 'Content for multiple platforms',
                'content_type' => 'post',
                'hashtags' => '#multiplatform',
                'status' => 'draft',
                'social_accounts' => [
                    $this->instagramAccount->id,
                    $this->facebookAccount->id,
                    $this->twitterAccount->id,
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'post');

        $this->assertDatabaseHas('publications', [
            'title' => 'Multi-platform Post',
            'content_type' => 'post',
        ]);
    }

    // -------------------------------------------------------------------------
    // REEL
    // -------------------------------------------------------------------------

    /** @test */
    public function it_creates_a_reel_publication_as_draft()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'My First Reel',
                'description' => 'Reel description',
                'content_type' => 'reel',
                'hashtags' => '#reel #video',
                'status' => 'draft',
                'social_accounts' => [$this->instagramAccount->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'reel');
    }

    /** @test */
    public function it_creates_a_reel_for_tiktok_and_instagram()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Cross-platform Reel',
                'description' => 'Reel for TikTok and Instagram',
                'content_type' => 'reel',
                'hashtags' => '#reel #tiktok #instagram',
                'status' => 'draft',
                'social_accounts' => [
                    $this->instagramAccount->id,
                    $this->tiktokAccount->id,
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'reel');
    }

    /** @test */
    public function it_rejects_reel_for_twitter_incompatible_platform()
    {
        // Twitter no soporta reels — la validación de plataforma debe rechazarlo
        // cuando se intenta publicar (no al crear draft)
        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'reel',
            'status' => 'draft',
            'title' => 'Reel for Twitter',
            'description' => 'Should fail on publish',
        ]);

        // Adjuntar un video (requerido para reel)
        $video = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'mime_type' => 'video/mp4',
            'metadata' => ['duration' => 30],
            'size' => 10 * 1024 * 1024,
        ]);
        $publication->mediaFiles()->attach($video->id);

        // Twitter no está en REEL_COMPATIBLE_PLATFORMS
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.publish', $publication->id), [
                'platforms' => [$this->twitterAccount->id],
            ]);

        // Debe fallar con 422 o 403 por incompatibilidad de plataforma
        $this->assertContains($response->status(), [422, 403]);
    }

    // -------------------------------------------------------------------------
    // STORY
    // -------------------------------------------------------------------------

    /** @test */
    public function it_creates_a_story_publication_as_draft()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'My Story',
                'description' => '', // description es opcional en stories
                'content_type' => 'story',
                'status' => 'draft',
                'social_accounts' => [$this->instagramAccount->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'story');
    }

    /** @test */
    public function it_creates_a_story_without_hashtags()
    {
        // En stories, hashtags son opcionales
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Story Without Hashtags',
                'content_type' => 'story',
                'status' => 'draft',
                'social_accounts' => [$this->instagramAccount->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'story');
    }

    // -------------------------------------------------------------------------
    // CAROUSEL
    // -------------------------------------------------------------------------

    /** @test */
    public function it_creates_a_carousel_publication_as_draft()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'My Carousel',
                'description' => 'Carousel with multiple images',
                'content_type' => 'carousel',
                'hashtags' => '#carousel #photos',
                'status' => 'draft',
                'social_accounts' => [$this->instagramAccount->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'carousel');
    }

    // -------------------------------------------------------------------------
    // POLL
    // -------------------------------------------------------------------------

    /** @test */
    public function it_creates_a_poll_publication_with_options()
    {
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'My Poll',
                'description' => 'Vote for your favorite option',
                'content_type' => 'poll',
                'poll_options' => ['Option A', 'Option B', 'Option C'],
                'poll_duration_hours' => 24,
                'status' => 'draft',
                'social_accounts' => [$this->twitterAccount->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'poll');

        $this->assertDatabaseHas('publications', [
            'content_type' => 'poll',
            'poll_duration_hours' => 24,
        ]);
    }

    /** @test */
    public function it_creates_a_poll_without_hashtags()
    {
        // En polls, hashtags son opcionales
        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Poll No Hashtags',
                'description' => 'Simple poll',
                'content_type' => 'poll',
                'poll_options' => ['Yes', 'No'],
                'poll_duration_hours' => 48,
                'status' => 'draft',
                'social_accounts' => [$this->twitterAccount->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.publication.content_type', 'poll');
    }

    // -------------------------------------------------------------------------
    // PUBLISH (envío real)
    // -------------------------------------------------------------------------

    /** @test */
    public function it_dispatches_publish_job_for_post()
    {
        Queue::fake();

        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'post',
            'status' => 'draft',
            'title' => 'Post to Publish',
            'description' => 'Ready to publish',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.publish', $publication->id), [
                'platforms' => [$this->instagramAccount->id],
            ]);

        // Debe aceptar la solicitud (200 o 202)
        $this->assertContains($response->status(), [200, 202]);
        Queue::assertPushed(\App\Jobs\PublishToSocialMedia::class);
    }

    /** @test */
    public function it_dispatches_publish_job_for_reel()
    {
        Queue::fake();

        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'reel',
            'status' => 'draft',
            'title' => 'Reel to Publish',
            'description' => 'Ready to publish',
        ]);

        $video = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'mime_type' => 'video/mp4',
            'metadata' => ['duration' => 30],
            'size' => 10 * 1024 * 1024,
        ]);
        $publication->mediaFiles()->attach($video->id);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.publish', $publication->id), [
                'platforms' => [$this->instagramAccount->id],
            ]);

        $this->assertContains($response->status(), [200, 202]);
        Queue::assertPushed(\App\Jobs\PublishToSocialMedia::class);
    }

    /** @test */
    public function it_dispatches_publish_job_for_story()
    {
        Queue::fake();

        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'story',
            'status' => 'draft',
            'title' => 'Story to Publish',
            'description' => '',
        ]);

        $image = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'image',
            'mime_type' => 'image/jpeg',
            'size' => 2 * 1024 * 1024,
        ]);
        $publication->mediaFiles()->attach($image->id);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.publish', $publication->id), [
                'platforms' => [$this->instagramAccount->id],
            ]);

        $this->assertContains($response->status(), [200, 202]);
        Queue::assertPushed(\App\Jobs\PublishToSocialMedia::class);
    }

    /** @test */
    public function it_dispatches_publish_job_for_poll()
    {
        Queue::fake();

        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'poll',
            'status' => 'draft',
            'title' => 'Poll to Publish',
            'description' => 'Vote now',
            'poll_options' => ['A', 'B'],
            'poll_duration_hours' => 24,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.publish', $publication->id), [
                'platforms' => [$this->twitterAccount->id],
            ]);

        $this->assertContains($response->status(), [200, 202]);
        Queue::assertPushed(\App\Jobs\PublishToSocialMedia::class);
    }

    /** @test */
    public function it_dispatches_publish_job_for_carousel()
    {
        Queue::fake();

        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'carousel',
            'status' => 'draft',
            'title' => 'Carousel to Publish',
            'description' => 'Multiple images',
        ]);

        // Carousel requiere mínimo 2 imágenes
        foreach (range(1, 3) as $i) {
            $image = MediaFile::factory()->create([
                'workspace_id' => $this->workspace->id,
                'file_type' => 'image',
                'mime_type' => 'image/jpeg',
                'size' => 1 * 1024 * 1024,
            ]);
            $publication->mediaFiles()->attach($image->id);
        }

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.publish', $publication->id), [
                'platforms' => [$this->instagramAccount->id],
            ]);

        $this->assertContains($response->status(), [200, 202]);
        Queue::assertPushed(\App\Jobs\PublishToSocialMedia::class);
    }

    // -------------------------------------------------------------------------
    // SCHEDULED PUBLISH
    // -------------------------------------------------------------------------

    /** @test */
    public function it_schedules_a_post_publication()
    {
        $scheduledAt = now()->addHours(2)->toIso8601String();

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Scheduled Post',
                'description' => 'This post will be published later',
                'content_type' => 'post',
                'hashtags' => '#scheduled',
                'status' => 'draft',
                'scheduled_at' => $scheduledAt,
                'social_accounts' => [$this->instagramAccount->id],
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('publications', [
            'title' => 'Scheduled Post',
            'content_type' => 'post',
            'status' => 'scheduled',
        ]);
    }

    /** @test */
    public function it_schedules_a_reel_publication()
    {
        $scheduledAt = now()->addHours(3)->toIso8601String();

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Scheduled Reel',
                'description' => 'Reel scheduled for later',
                'content_type' => 'reel',
                'hashtags' => '#reel',
                'status' => 'draft',
                'scheduled_at' => $scheduledAt,
                'social_accounts' => [$this->instagramAccount->id],
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('publications', [
            'title' => 'Scheduled Reel',
            'content_type' => 'reel',
            'status' => 'scheduled',
        ]);
    }

    // -------------------------------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------------------------------

    /** @test */
    public function it_requires_title_for_all_content_types()
    {
        foreach (['post', 'reel', 'story', 'carousel', 'poll'] as $type) {
            $response = $this->actingAs($this->user)
                ->postJson(route('api.v1.publications.store'), [
                    'description' => 'No title here',
                    'content_type' => $type,
                    'status' => 'draft',
                ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['title']);
        }
    }

    /** @test */
    public function it_rejects_publish_without_platforms()
    {
        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'post',
            'status' => 'draft',
            'title' => 'No Platforms Post',
            'description' => 'Missing platforms',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.publish', $publication->id), [
                'platforms' => [],
            ]);

        // Sin plataformas no puede publicar
        $this->assertContains($response->status(), [422, 400]);
    }

    /** @test */
    public function it_rejects_publish_for_unauthenticated_user()
    {
        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'post',
            'status' => 'draft',
            'title' => 'Auth Test',
            'description' => 'Should fail',
        ]);

        $response = $this->postJson(route('api.v1.publications.publish', $publication->id), [
            'platforms' => [$this->instagramAccount->id],
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_rejects_duplicate_title_on_store()
    {
        Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'title' => 'Duplicate Title',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Duplicate Title',
                'description' => 'Another publication',
                'content_type' => 'post',
                'status' => 'draft',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);
    }

    /** @test */
    public function it_rejects_publish_for_pending_review_publication()
    {
        $publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'content_type' => 'post',
            'status' => 'pending_review',
            'title' => 'Pending Review Post',
            'description' => 'Awaiting approval',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.publish', $publication->id), [
                'platforms' => [$this->instagramAccount->id],
            ]);

        $response->assertStatus(422);
    }
}

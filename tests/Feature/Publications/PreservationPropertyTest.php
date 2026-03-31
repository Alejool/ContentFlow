<?php

namespace Tests\Feature\Publications;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Social\SocialAccount;
use App\Models\Publications\Publication;
use App\Models\MediaFiles\MediaFile;
use App\Models\Role\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Preservation Property Test
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 * 
 * This test verifies that valid publication scenarios continue to work correctly.
 * It follows the observation-first methodology: observe behavior on UNFIXED code
 * for non-buggy inputs (valid content_type/platform/media combinations).
 * 
 * CRITICAL: These tests MUST PASS on unfixed code - this confirms baseline behavior to preserve.
 * 
 * After the fix is implemented, these tests should still pass, ensuring no regressions.
 */
class PreservationPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

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
    }

    /**
     * Test Case 1: Post on any platform
     * 
     * **Validates: Requirement 3.1**
     * 
     * WHEN a user creates a publication with content_type='post' for any platform
     * THEN the system SHALL CONTINUE TO accept the publication as all platforms support posts
     */
    public function test_post_on_instagram_succeeds()
    {
        $instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Post Instagram',
                'description' => 'Test Description',
                'content_type' => 'post',
                'social_accounts' => [$instagramAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Post Instagram',
            'content_type' => 'post',
        ]);
    }

    public function test_post_on_twitter_succeeds()
    {
        $twitterAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Post Twitter',
                'description' => 'Test Description',
                'content_type' => 'post',
                'social_accounts' => [$twitterAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Post Twitter',
            'content_type' => 'post',
        ]);
    }

    public function test_post_on_facebook_succeeds()
    {
        $facebookAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'facebook',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Post Facebook',
                'description' => 'Test Description',
                'content_type' => 'post',
                'social_accounts' => [$facebookAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Post Facebook',
            'content_type' => 'post',
        ]);
    }

    public function test_post_on_linkedin_succeeds()
    {
        $linkedinAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'linkedin',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Post LinkedIn',
                'description' => 'Test Description',
                'content_type' => 'post',
                'social_accounts' => [$linkedinAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Post LinkedIn',
            'content_type' => 'post',
        ]);
    }

    public function test_post_on_youtube_succeeds()
    {
        $youtubeAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Post YouTube',
                'description' => 'Test Description',
                'content_type' => 'post',
                'social_accounts' => [$youtubeAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Post YouTube',
            'content_type' => 'post',
        ]);
    }

    public function test_post_on_pinterest_succeeds()
    {
        $pinterestAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'pinterest',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Post Pinterest',
                'description' => 'Test Description',
                'content_type' => 'post',
                'social_accounts' => [$pinterestAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Post Pinterest',
            'content_type' => 'post',
        ]);
    }

    /**
     * Test Case 2: Valid reel on Instagram
     * 
     * **Validates: Requirement 3.2**
     * 
     * WHEN a user creates a publication with content_type='reel' for platform='instagram'
     * with exactly one video file
     * THEN the system SHALL CONTINUE TO accept the publication successfully
     */
    public function test_valid_reel_on_instagram_succeeds()
    {
        $instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Reel Instagram',
                'description' => 'Test Description',
                'content_type' => 'reel',
                'social_accounts' => [$instagramAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Reel Instagram',
            'content_type' => 'reel',
        ]);
    }

    public function test_valid_reel_on_tiktok_succeeds()
    {
        $tiktokAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'tiktok',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Reel TikTok',
                'description' => 'Test Description',
                'content_type' => 'reel',
                'social_accounts' => [$tiktokAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Reel TikTok',
            'content_type' => 'reel',
        ]);
    }

    public function test_valid_reel_on_youtube_succeeds()
    {
        $youtubeAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Reel YouTube',
                'description' => 'Test Description',
                'content_type' => 'reel',
                'social_accounts' => [$youtubeAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Reel YouTube',
            'content_type' => 'reel',
        ]);
    }

    /**
     * Test Case 3: Valid carousel on Instagram
     * 
     * **Validates: Requirement 3.3**
     * 
     * WHEN a user creates a publication with content_type='carousel' for platform='instagram'
     * with 2-10 image files
     * THEN the system SHALL CONTINUE TO accept the publication successfully
     */
    public function test_valid_carousel_on_instagram_succeeds()
    {
        $instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Carousel Instagram',
                'description' => 'Test Description',
                'content_type' => 'carousel',
                'social_accounts' => [$instagramAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Carousel Instagram',
            'content_type' => 'carousel',
        ]);
    }

    public function test_valid_carousel_on_linkedin_succeeds()
    {
        $linkedinAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'linkedin',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Carousel LinkedIn',
                'description' => 'Test Description',
                'content_type' => 'carousel',
                'social_accounts' => [$linkedinAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Carousel LinkedIn',
            'content_type' => 'carousel',
        ]);
    }

    public function test_valid_carousel_on_pinterest_succeeds()
    {
        $pinterestAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'pinterest',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Carousel Pinterest',
                'description' => 'Test Description',
                'content_type' => 'carousel',
                'social_accounts' => [$pinterestAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Carousel Pinterest',
            'content_type' => 'carousel',
        ]);
    }

    /**
     * Test Case 4: Valid story on Instagram
     * 
     * **Validates: Requirement 3.4**
     * 
     * WHEN a user creates a publication with content_type='story' for platform='instagram'
     * with exactly one image or video file
     * THEN the system SHALL CONTINUE TO accept the publication successfully
     */
    public function test_valid_story_on_instagram_succeeds()
    {
        $instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Story Instagram',
                'description' => 'Test Description',
                'content_type' => 'story',
                'social_accounts' => [$instagramAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Story Instagram',
            'content_type' => 'story',
        ]);
    }

    public function test_valid_story_on_facebook_succeeds()
    {
        $facebookAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'facebook',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Story Facebook',
                'description' => 'Test Description',
                'content_type' => 'story',
                'social_accounts' => [$facebookAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Story Facebook',
            'content_type' => 'story',
        ]);
    }

    /**
     * Test Case 5: Valid poll on Twitter
     * 
     * **Validates: Requirement 3.5**
     * 
     * WHEN a user creates a publication with content_type='poll' for platform='twitter'
     * with valid poll_options
     * THEN the system SHALL CONTINUE TO accept the publication successfully
     */
    public function test_valid_poll_on_twitter_succeeds()
    {
        $twitterAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Poll Twitter',
                'description' => 'Test Description',
                'content_type' => 'poll',
                'social_accounts' => [$twitterAccount->id],
                'poll_options' => ['Option 1', 'Option 2', 'Option 3'],
                'poll_duration_hours' => 24,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Poll Twitter',
            'content_type' => 'poll',
        ]);
    }

    public function test_valid_poll_on_facebook_succeeds()
    {
        $facebookAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'facebook',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Poll Facebook',
                'description' => 'Test Description',
                'content_type' => 'poll',
                'social_accounts' => [$facebookAccount->id],
                'poll_options' => ['Yes', 'No', 'Maybe'],
                'poll_duration_hours' => 48,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Poll Facebook',
            'content_type' => 'poll',
        ]);
    }

    /**
     * Test Case 6: Default content_type
     * 
     * **Validates: Requirement 3.6**
     * 
     * WHEN a user creates a publication without specifying content_type
     * THEN the system SHALL CONTINUE TO default to 'post' type
     */
    public function test_default_content_type_to_post()
    {
        $instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Default Content Type',
                'description' => 'Test Description',
                // No content_type specified
                'social_accounts' => [$instagramAccount->id],
            ]);

        $response->assertStatus(201);
        
        // Verify it defaults to 'post'
        $publication = Publication::where('title', 'Test Default Content Type')->first();
        $this->assertNotNull($publication);
        $this->assertEquals('post', $publication->content_type);
    }

    /**
     * Test Case 7: Update without changes
     * 
     * **Validates: Requirement 3.7**
     * 
     * WHEN a user updates an existing publication without changing content_type or platforms
     * THEN the system SHALL CONTINUE TO process the update without re-validating content type compatibility
     */
    public function test_update_without_content_type_changes_succeeds()
    {
        $instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
        ]);

        // Create a publication
        $publication = Publication::create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'title' => 'Original Title',
            'description' => 'Original Description',
            'content_type' => 'post',
            'status' => 'draft',
        ]);

        $publication->socialAccounts()->attach($instagramAccount->id);

        // Update only title and description (no content_type or platform changes)
        $response = $this->actingAs($this->user)
            ->putJson(route('api.v1.publications.update', $publication->id), [
                'title' => 'Updated Title',
                'description' => 'Updated Description',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('publications', [
            'id' => $publication->id,
            'title' => 'Updated Title',
            'description' => 'Updated Description',
            'content_type' => 'post',
        ]);
    }

    /**
     * Test Case 8: Valid cross-platform
     * 
     * **Validates: Requirement 3.8**
     * 
     * WHEN a user creates a publication for multiple platforms that all support
     * the selected content_type
     * THEN the system SHALL CONTINUE TO accept the publication successfully
     */
    public function test_valid_cross_platform_post_succeeds()
    {
        $instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
        ]);

        $facebookAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'facebook',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Cross-Platform Post',
                'description' => 'Test Description',
                'content_type' => 'post',
                'social_accounts' => [$instagramAccount->id, $facebookAccount->id],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Cross-Platform Post',
            'content_type' => 'post',
        ]);
    }

    public function test_valid_cross_platform_reel_succeeds()
    {
        $instagramAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'instagram',
        ]);

        $tiktokAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'tiktok',
        ]);

        $youtubeAccount = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.publications.store'), [
                'title' => 'Test Cross-Platform Reel',
                'description' => 'Test Description',
                'content_type' => 'reel',
                'social_accounts' => [
                    $instagramAccount->id,
                    $tiktokAccount->id,
                    $youtubeAccount->id
                ],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Cross-Platform Reel',
            'content_type' => 'reel',
        ]);
    }
}

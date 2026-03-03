<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialPostLog;
use App\Models\Workspace\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AccountSwitchingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;
    protected Publication $publication;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create();
        $this->user->update(['current_workspace_id' => $this->workspace->id]);

        $this->publication = Publication::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'status' => 'draft',
        ]);
    }

    /** @test */
    public function it_shows_account_name_in_platform_status_summary()
    {
        $account = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_name' => 'Test Channel',
        ]);

        SocialPostLog::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'publication_id' => $this->publication->id,
            'social_account_id' => $account->id,
            'platform' => 'youtube',
            'account_name' => 'Test Channel',
            'status' => 'published',
        ]);

        $summary = $this->publication->fresh()->platform_status_summary;

        $this->assertArrayHasKey($account->id, $summary);
        $this->assertEquals('Test Channel', $summary[$account->id]['account_name']);
        $this->assertTrue($summary[$account->id]['is_current_account']);
        $this->assertTrue($summary[$account->id]['can_unpublish']);
    }

    /** @test */
    public function it_marks_disconnected_account_as_not_current()
    {
        $account = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_name' => 'Old Channel',
        ]);

        SocialPostLog::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'publication_id' => $this->publication->id,
            'social_account_id' => $account->id,
            'platform' => 'youtube',
            'account_name' => 'Old Channel',
            'status' => 'published',
        ]);

        // Soft delete the account (simulate disconnection)
        $account->delete();

        $summary = $this->publication->fresh()->platform_status_summary;

        $this->assertArrayHasKey($account->id, $summary);
        $this->assertEquals('Old Channel', $summary[$account->id]['account_name']);
        $this->assertFalse($summary[$account->id]['is_current_account']);
        $this->assertFalse($summary[$account->id]['can_unpublish']);
    }

    /** @test */
    public function it_allows_publishing_to_different_account_of_same_platform()
    {
        // Create first account and publish
        $account1 = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_id' => 'channel_1',
            'account_name' => 'Channel 1',
        ]);

        SocialPostLog::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'publication_id' => $this->publication->id,
            'social_account_id' => $account1->id,
            'platform' => 'youtube',
            'account_name' => 'Channel 1',
            'status' => 'published',
        ]);

        // Create second account
        $account2 = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_id' => 'channel_2',
            'account_name' => 'Channel 2',
        ]);

        // Check if can publish to second account
        $result = $this->publication->canPublishToPlatform($account2);

        $this->assertTrue($result['can_publish']);
        $this->assertEquals('different_account', $result['reason']);
        $this->assertStringContainsString('Channel 1', $result['message']);
    }

    /** @test */
    public function it_prevents_publishing_to_same_account_twice()
    {
        $account = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_name' => 'Test Channel',
        ]);

        SocialPostLog::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'publication_id' => $this->publication->id,
            'social_account_id' => $account->id,
            'platform' => 'youtube',
            'status' => 'published',
        ]);

        $result = $this->publication->canPublishToPlatform($account);

        $this->assertFalse($result['can_publish']);
        $this->assertEquals('already_published_this_account', $result['reason']);
    }

    /** @test */
    public function it_prevents_unpublishing_from_disconnected_account()
    {
        $account = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_name' => 'Old Channel',
        ]);

        SocialPostLog::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'publication_id' => $this->publication->id,
            'social_account_id' => $account->id,
            'platform' => 'youtube',
            'status' => 'published',
        ]);

        // Disconnect account
        $account->delete();

        // Try to unpublish
        $publishService = app(\App\Services\Publish\PlatformPublishService::class);
        $result = $publishService->unpublishFromPlatforms($this->publication, [$account->id]);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('disconnected', $result['message']);
        $this->assertNotEmpty($result['invalid_accounts']);
    }

    /** @test */
    public function it_gets_publications_in_other_accounts()
    {
        // Create two accounts
        $account1 = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_name' => 'Channel 1',
        ]);

        $account2 = SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_name' => 'Channel 2',
        ]);

        // Publish to account 1
        SocialPostLog::factory()->create([
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
            'publication_id' => $this->publication->id,
            'social_account_id' => $account1->id,
            'platform' => 'youtube',
            'account_name' => 'Channel 1',
            'status' => 'published',
        ]);

        // Disconnect account 1
        $account1->delete();

        // Get publications in other accounts
        $otherAccounts = $this->publication->getPublicationsInOtherAccounts('youtube');

        $this->assertCount(1, $otherAccounts);
        $this->assertEquals('Channel 1', $otherAccounts[0]['account_name']);
        $this->assertEquals('published', $otherAccounts[0]['status']);
    }
}

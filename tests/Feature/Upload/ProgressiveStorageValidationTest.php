<?php

namespace Tests\Feature\Upload;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Subscription\PlanLimitValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProgressiveStorageValidationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user and workspace
        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create([
            'creator_id' => $this->user->id,
        ]);

        $this->user->workspaces()->attach($this->workspace->id, [
            'role' => 'owner',
        ]);

        $this->user->update(['current_workspace_id' => $this->workspace->id]);

        // Mock S3 storage
        Storage::fake('s3');
    }

    /** @test */
    public function it_validates_storage_limit_without_pending_bytes()
    {
        $validator = app(PlanLimitValidator::class);

        // Assuming demo plan has 1GB limit
        $canUpload = $validator->canUploadSize($this->workspace, 100 * 1024 * 1024); // 100MB

        $this->assertTrue($canUpload);
    }

    /** @test */
    public function it_validates_storage_limit_with_pending_bytes()
    {
        $validator = app(PlanLimitValidator::class);

        // Simulate 900MB already pending
        $pendingBytes = 900 * 1024 * 1024;

        // Try to upload 200MB more (should fail with 1GB limit)
        $canUpload = $validator->canUploadSize(
            $this->workspace,
            200 * 1024 * 1024,
            $pendingBytes
        );

        $this->assertFalse($canUpload);
    }

    /** @test */
    public function it_allows_upload_when_within_limit_with_pending_bytes()
    {
        $validator = app(PlanLimitValidator::class);

        // Simulate 500MB already pending
        $pendingBytes = 500 * 1024 * 1024;

        // Try to upload 400MB more (should succeed with 1GB limit)
        $canUpload = $validator->canUploadSize(
            $this->workspace,
            400 * 1024 * 1024,
            $pendingBytes
        );

        $this->assertTrue($canUpload);
    }

    /** @test */
    public function it_returns_correct_remaining_storage_bytes()
    {
        $validator = app(PlanLimitValidator::class);

        // No pending bytes
        $remaining = $validator->getRemainingStorageBytes($this->workspace, 0);

        // Should be close to 1GB (demo plan limit)
        $this->assertGreaterThan(900 * 1024 * 1024, $remaining);
    }

    /** @test */
    public function it_returns_correct_remaining_storage_with_pending_bytes()
    {
        $validator = app(PlanLimitValidator::class);

        // 500MB pending
        $pendingBytes = 500 * 1024 * 1024;
        $remaining = $validator->getRemainingStorageBytes($this->workspace, $pendingBytes);

        // Should be around 500MB remaining
        $expectedRemaining = (1024 * 1024 * 1024) - $pendingBytes; // 1GB - 500MB
        $this->assertLessThanOrEqual($expectedRemaining, $remaining);
    }

    /** @test */
    public function upload_endpoint_rejects_file_exceeding_limit_with_pending_bytes()
    {
        // Mock config to use demo plan with 1GB limit
        config(['plans.demo.limits.storage_gb' => 1]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.uploads.sign'), [
                'filename' => 'large-file.mp4',
                'content_type' => 'video/mp4',
                'file_size' => 600 * 1024 * 1024, // 600MB
                'pending_bytes' => 500 * 1024 * 1024, // 500MB already pending
            ]);

        $response->assertStatus(402); // Payment Required
        $response->assertJsonStructure([
            'error',
            'action',
            'limit_type',
            'upgrade_plan',
            'remaining_bytes',
            'file_size',
            'pending_bytes',
        ]);
    }

    /** @test */
    public function upload_endpoint_accepts_file_within_limit_with_pending_bytes()
    {
        // Mock config to use demo plan with 1GB limit
        config(['plans.demo.limits.storage_gb' => 1]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.uploads.sign'), [
                'filename' => 'small-file.mp4',
                'content_type' => 'video/mp4',
                'file_size' => 400 * 1024 * 1024, // 400MB
                'pending_bytes' => 500 * 1024 * 1024, // 500MB already pending
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'upload_url',
            'key',
            'uuid',
            'method',
        ]);
    }

    /** @test */
    public function multipart_upload_endpoint_rejects_file_exceeding_limit_with_pending_bytes()
    {
        // Mock config to use demo plan with 1GB limit
        config(['plans.demo.limits.storage_gb' => 1]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.uploads.multipart.init'), [
                'filename' => 'large-video.mp4',
                'content_type' => 'video/mp4',
                'file_size' => 700 * 1024 * 1024, // 700MB
                'pending_bytes' => 400 * 1024 * 1024, // 400MB already pending
            ]);

        $response->assertStatus(402); // Payment Required
        $response->assertJsonStructure([
            'error',
            'action',
            'limit_type',
            'upgrade_plan',
            'remaining_bytes',
            'file_size',
            'pending_bytes',
        ]);
    }

    /** @test */
    public function multipart_upload_endpoint_accepts_file_within_limit_with_pending_bytes()
    {
        // Mock config to use demo plan with 1GB limit
        config(['plans.demo.limits.storage_gb' => 1]);

        $response = $this->actingAs($this->user)
            ->postJson(route('api.v1.uploads.multipart.init'), [
                'filename' => 'medium-video.mp4',
                'content_type' => 'video/mp4',
                'file_size' => 300 * 1024 * 1024, // 300MB
                'pending_bytes' => 600 * 1024 * 1024, // 600MB already pending
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'uploadId',
            'key',
        ]);
    }

    /** @test */
    public function it_handles_unlimited_storage_correctly()
    {
        // Mock config to use plan with unlimited storage
        config(['plans.demo.limits.storage_gb' => -1]);

        $validator = app(PlanLimitValidator::class);

        // Should allow any size
        $canUpload = $validator->canUploadSize(
            $this->workspace,
            10 * 1024 * 1024 * 1024, // 10GB
            5 * 1024 * 1024 * 1024   // 5GB pending
        );

        $this->assertTrue($canUpload);

        // Remaining should be -1 (unlimited)
        $remaining = $validator->getRemainingStorageBytes($this->workspace, 0);
        $this->assertEquals(-1, $remaining);
    }
}

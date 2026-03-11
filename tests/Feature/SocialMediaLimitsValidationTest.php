<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Publications\Publication;
use App\Models\Social\SocialAccount;
use App\Models\MediaFiles\MediaFile;
use App\Services\Validation\SocialMediaLimitsService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SocialMediaLimitsValidationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Workspace $workspace;
    private SocialMediaLimitsService $limitsService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->workspace = Workspace::factory()->create(['owner_id' => $this->user->id]);
        $this->user->update(['current_workspace_id' => $this->workspace->id]);
        
        $this->limitsService = app(SocialMediaLimitsService::class);
    }

    /** @test */
    public function it_blocks_long_videos_on_unverified_twitter_account()
    {
        // Crear cuenta de Twitter no verificada
        $twitterAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
            'account_metadata' => ['verified' => false],
        ]);

        // Crear publicación con video de 5 minutos (300 segundos)
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $mediaFile = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'metadata' => ['duration' => 300], // 5 minutos
            'size' => 50 * 1024 * 1024, // 50 MB
        ]);

        $publication->mediaFiles()->attach($mediaFile->id);

        // Validar
        $result = $this->limitsService->validateForAccount($publication, $twitterAccount);

        $this->assertFalse($result['can_publish']);
        $this->assertStringContainsString('Video demasiado largo', $result['errors'][0]);
        $this->assertStringContainsString('Verifica tu cuenta', $result['errors'][0]);
    }

    /** @test */
    public function it_allows_long_videos_on_verified_twitter_account()
    {
        // Crear cuenta de Twitter verificada
        $twitterAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
            'account_metadata' => ['verified' => true],
        ]);

        // Crear publicación con video de 5 minutos
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $mediaFile = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'metadata' => ['duration' => 300],
            'size' => 50 * 1024 * 1024,
        ]);

        $publication->mediaFiles()->attach($mediaFile->id);

        // Validar
        $result = $this->limitsService->validateForAccount($publication, $twitterAccount);

        $this->assertTrue($result['can_publish']);
        $this->assertEmpty($result['errors']);
    }

    /** @test */
    public function it_blocks_videos_exceeding_youtube_unverified_limit()
    {
        // Cuenta de YouTube no verificada
        $youtubeAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_metadata' => ['is_verified' => false],
        ]);

        // Video de 20 minutos (1200 segundos)
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $mediaFile = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'metadata' => ['duration' => 1200],
            'size' => 100 * 1024 * 1024,
        ]);

        $publication->mediaFiles()->attach($mediaFile->id);

        // Validar
        $result = $this->limitsService->validateForAccount($publication, $youtubeAccount);

        $this->assertFalse($result['can_publish']);
        $this->assertStringContainsString('20m', $result['errors'][0]);
        $this->assertStringContainsString('15m', $result['errors'][0]);
    }

    /** @test */
    public function it_blocks_too_many_images_on_twitter()
    {
        $twitterAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
        ]);

        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        // Crear 5 imágenes (Twitter solo permite 4)
        for ($i = 0; $i < 5; $i++) {
            $mediaFile = MediaFile::factory()->create([
                'workspace_id' => $this->workspace->id,
                'file_type' => 'image',
                'size' => 1 * 1024 * 1024,
            ]);
            $publication->mediaFiles()->attach($mediaFile->id);
        }

        // Validar
        $result = $this->limitsService->validateForAccount($publication, $twitterAccount);

        $this->assertFalse($result['can_publish']);
        $this->assertStringContainsString('Demasiadas imágenes', $result['errors'][0]);
    }

    /** @test */
    public function it_blocks_mixing_videos_and_images_on_twitter()
    {
        $twitterAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
        ]);

        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        // 1 video
        $videoFile = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'metadata' => ['duration' => 30],
            'size' => 10 * 1024 * 1024,
        ]);
        $publication->mediaFiles()->attach($videoFile->id);

        // 2 imágenes
        for ($i = 0; $i < 2; $i++) {
            $imageFile = MediaFile::factory()->create([
                'workspace_id' => $this->workspace->id,
                'file_type' => 'image',
                'size' => 1 * 1024 * 1024,
            ]);
            $publication->mediaFiles()->attach($imageFile->id);
        }

        // Validar
        $result = $this->limitsService->validateForAccount($publication, $twitterAccount);

        $this->assertFalse($result['can_publish']);
        $this->assertStringContainsString('no permite combinar videos e imágenes', $result['errors'][0]);
    }

    /** @test */
    public function it_generates_helpful_recommendations()
    {
        $twitterAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
            'account_metadata' => ['verified' => false],
        ]);

        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        // Video corto de 45 segundos
        $mediaFile = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'metadata' => ['duration' => 45],
            'size' => 10 * 1024 * 1024,
        ]);
        $publication->mediaFiles()->attach($mediaFile->id);

        // Generar recomendaciones
        $recommendations = $this->limitsService->generateRecommendations(
            $publication,
            [$twitterAccount->id]
        );

        $this->assertNotEmpty($recommendations);
        $this->assertStringContainsString('ideal para', $recommendations[0]);
    }

    /** @test */
    public function it_validates_multiple_platforms_at_once()
    {
        // Crear múltiples cuentas
        $twitterAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
            'account_metadata' => ['verified' => false],
        ]);

        $youtubeAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'youtube',
            'account_metadata' => ['is_verified' => false],
        ]);

        // Video de 20 minutos (excede ambos límites)
        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $mediaFile = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'metadata' => ['duration' => 1200],
            'size' => 100 * 1024 * 1024,
        ]);
        $publication->mediaFiles()->attach($mediaFile->id);

        // Validar ambas plataformas
        $validation = $this->limitsService->validatePublication(
            $publication,
            [$twitterAccount->id, $youtubeAccount->id]
        );

        $this->assertFalse($validation['can_publish']);
        $this->assertCount(2, $validation['results']);
        $this->assertFalse($validation['results'][$twitterAccount->id]['can_publish']);
        $this->assertFalse($validation['results'][$youtubeAccount->id]['can_publish']);
    }

    /** @test */
    public function it_provides_client_friendly_error_messages()
    {
        $twitterAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
            'account_name' => 'Mi Cuenta de Twitter',
            'account_metadata' => ['verified' => false],
        ]);

        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $mediaFile = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'metadata' => ['duration' => 300],
            'size' => 50 * 1024 * 1024,
        ]);
        $publication->mediaFiles()->attach($mediaFile->id);

        $validation = $this->limitsService->validatePublication(
            $publication,
            [$twitterAccount->id]
        );

        $message = $this->limitsService->getClientFriendlyMessage($validation);

        $this->assertStringContainsString('No se puede publicar', $message);
        $this->assertStringContainsString('Mi Cuenta de Twitter', $message);
        $this->assertStringContainsString('cuenta no verificada', $message);
    }

    /** @test */
    public function it_can_validate_via_api_endpoint()
    {
        $this->actingAs($this->user);

        $twitterAccount = SocialAccount::factory()->create([
            'workspace_id' => $this->workspace->id,
            'platform' => 'twitter',
            'account_metadata' => ['verified' => false],
        ]);

        $publication = Publication::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->user->id,
        ]);

        $mediaFile = MediaFile::factory()->create([
            'workspace_id' => $this->workspace->id,
            'file_type' => 'video',
            'metadata' => ['duration' => 300],
            'size' => 50 * 1024 * 1024,
        ]);
        $publication->mediaFiles()->attach($mediaFile->id);

        // Llamar al endpoint de validación
        $response = $this->postJson("/api/v1/publications/{$publication->id}/validate", [
            'platforms' => [$twitterAccount->id],
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'can_publish',
                'validation_results',
                'recommendations',
                'message',
            ],
        ]);

        $this->assertFalse($response->json('data.can_publish'));
    }
}

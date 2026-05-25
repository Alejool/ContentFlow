<?php

namespace Tests\Feature;

use App\Models\MediaFiles\MediaFile;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Services\Storage\S3PresignedUrlService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests para FilesController
 * 
 * Validar:
 * - Generación de signed PUT URLs
 * - Confirmación de uploads
 * - Generación de signed GET URLs
 * - Validación de permisos
 * - Eliminación de archivos
 */
class FilesControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;
    protected S3PresignedUrlService $s3Service;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        $this->seed(\Database\Seeders\Auth\RolesAndPermissionsSeeder::class);
        $ownerRole = \App\Models\Auth\Role::where('slug', 'owner')->first();

        // Crear usuario y workspace
        $this->workspace = Workspace::factory()->create();
        $this->user = User::factory()->create();
        $this->user->workspaces()->attach($this->workspace, ['role_id' => $ownerRole->id]);
        $this->user->update(['current_workspace_id' => $this->workspace->id]);

        // Mock S3Service
        $this->s3Service = $this->mock(S3PresignedUrlService::class);
    }


    /**
     * Test: Generar signed PUT URL para upload
     */
    public function test_generate_upload_url_returns_valid_response()
    {
        $this->s3Service->shouldReceive('getPutUrl')
            ->once()
            ->andReturn('https://s3.amazonaws.com/mock-presigned-put-url');

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/files/upload-url', [
                'fileName' => 'video.mp4',
                'mimeType' => 'video/mp4',
                'size' => 1234567,
                'uploadType' => 'publication',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'uploadUrl',
                's3Key',
                'expiresIn',
            ]);

        $this->assertStringContainsString('workspaces', $response->json('s3Key'));
    }

    /**
     * Test: Generate upload URL requiere autenticación
     */
    public function test_generate_upload_url_requires_authentication()
    {
        $response = $this->postJson('/api/v1/files/upload-url', [
            'fileName' => 'video.mp4',
            'mimeType' => 'video/mp4',
            'size' => 1234567,
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test: Validación de parámetros en upload-url
     */
    public function test_generate_upload_url_validates_input()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/files/upload-url', [
                'fileName' => '', // Requerido
                'mimeType' => 'video/mp4',
                'size' => 1234567,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('fileName');
    }

    /**
     * Test: Confirmar upload crea MediaFile en DB
     */
    public function test_confirm_upload_creates_media_file()
    {
        $s3Key = "workspaces/{$this->workspace->id}/users/{$this->user->id}/publications/uuid.mp4";

        $this->s3Service->shouldReceive('fileExists')
            ->once()
            ->with($s3Key)
            ->andReturn(true);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/files/confirm-upload', [
                's3Key' => $s3Key,
                'fileName' => 'video.mp4',
                'mimeType' => 'video/mp4',
                'size' => 1234567,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'mediaFileId',
                's3Key',
            ]);

        $this->assertDatabaseHas('media_files', [
            's3_key' => $s3Key,
            'user_id' => $this->user->id,
            'workspace_id' => $this->workspace->id,
        ]);
    }

    /**
     * Test: Confirmar upload requiere que archivo exista en S3
     */
    public function test_confirm_upload_validates_s3_file_exists()
    {
        $s3Key = "workspaces/{$this->workspace->id}/users/{$this->user->id}/publications/uuid.mp4";

        $this->s3Service->shouldReceive('fileExists')
            ->once()
            ->with($s3Key)
            ->andReturn(false);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/files/confirm-upload', [
                's3Key' => $s3Key,
                'fileName' => 'video.mp4',
                'mimeType' => 'video/mp4',
                'size' => 1234567,
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'File not found in S3',
            ]);
    }

    /**
     * Test: Confirmar upload rechaza s3Key inválida
     */
    public function test_confirm_upload_rejects_invalid_s3_key()
    {
        // s3Key que no pertenece al workspace/user actual
        $s3Key = "workspaces/999/users/999/publications/uuid.mp4";

        $this->s3Service->shouldReceive('fileExists')
            ->once()
            ->andReturn(true);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/files/confirm-upload', [
                's3Key' => $s3Key,
                'fileName' => 'video.mp4',
                'mimeType' => 'video/mp4',
                'size' => 1234567,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized: S3 key does not belong to current workspace',
            ]);
    }

    /**
     * Test: Obtener signed GET URL para acceso a archivo
     */
    public function test_get_access_url_returns_valid_response()
    {
        $mediaFile = MediaFile::factory()
            ->for($this->user)
            ->for($this->workspace)
            ->create([
                's3_key' => "workspaces/{$this->workspace->id}/users/{$this->user->id}/publications/uuid.mp4",
            ]);

        $this->s3Service->shouldReceive('fileExists')
            ->once()
            ->andReturn(true);

        $this->s3Service->shouldReceive('getDownloadUrl')
            ->once()
            ->andReturn('https://s3.amazonaws.com/mock-presigned-get-url');

        $response = $this->actingAs($this->user)
            ->getJson("/api/v1/files/{$mediaFile->id}/access");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'url',
                'expiresIn',
                'mimeType',
            ]);
    }

    /**
     * Test: Acceso a archivo requiere autenticación
     */
    public function test_get_access_url_requires_authentication()
    {
        $mediaFile = MediaFile::factory()->create();

        $response = $this->getJson("/api/v1/files/{$mediaFile->id}/access");

        $response->assertStatus(401);
    }

    /**
     * Test: No se puede acceder a archivos de otro workspace
     */
    public function test_get_access_url_blocks_cross_workspace_access()
    {
        $otherWorkspace = Workspace::factory()->create();
        $mediaFile = MediaFile::factory()
            ->for($this->user)
            ->for($otherWorkspace)
            ->create();

        $response = $this->actingAs($this->user)
            ->getJson("/api/v1/files/{$mediaFile->id}/access");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized: File does not belong to current workspace',
            ]);
    }

    /**
     * Test: No se puede acceder a archivos de otro usuario
     */
    public function test_get_access_url_blocks_other_user_files()
    {
        $ownerRole = \App\Models\Auth\Role::where('slug', 'owner')->first();
        $otherUser = User::factory()->create();
        $otherUser->workspaces()->attach($this->workspace, ['role_id' => $ownerRole->id]);

        $mediaFile = MediaFile::factory()
            ->for($otherUser)
            ->for($this->workspace)
            ->create();

        $response = $this->actingAs($this->user)
            ->getJson("/api/v1/files/{$mediaFile->id}/access");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized: User is not the file owner',
            ]);
    }

    /**
     * Test: Eliminar archivo
     */
    public function test_delete_file_removes_from_s3_and_db()
    {
        $mediaFile = MediaFile::factory()
            ->for($this->user)
            ->for($this->workspace)
            ->create([
                's3_key' => "workspaces/{$this->workspace->id}/users/{$this->user->id}/publications/uuid.mp4",
            ]);

        $this->s3Service->shouldReceive('deleteObject')
            ->once()
            ->with($mediaFile->s3_key)
            ->andReturn(true);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/v1/files/{$mediaFile->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('media_files', [
            'id' => $mediaFile->id,
        ]);
    }

    /**
     * Test: Solo propietario puede eliminar archivo
     */
    public function test_delete_file_requires_ownership()
    {
        $ownerRole = \App\Models\Auth\Role::where('slug', 'owner')->first();
        $otherUser = User::factory()->create();
        $otherUser->workspaces()->attach($this->workspace, ['role_id' => $ownerRole->id]);

        $mediaFile = MediaFile::factory()
            ->for($otherUser)
            ->for($this->workspace)
            ->create();

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/v1/files/{$mediaFile->id}");

        $response->assertStatus(403);

        // Archivo no fue eliminado
        $this->assertDatabaseHas('media_files', [
            'id' => $mediaFile->id,
        ]);
    }

}

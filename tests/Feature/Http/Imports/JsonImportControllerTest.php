<?php

namespace Tests\Feature\Http\Imports;

use App\Models\Auth\Role;
use App\Models\Campaigns\Campaign;
use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class JsonImportControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Workspace $workspace;

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
    }

    protected function importPayload(array $payload)
    {
        return $this->actingAs($this->user)->postJson(route('api.v1.json.import'), [
            'payload' => json_encode($payload),
        ]);
    }

    /** @test */
    public function it_imports_standalone_publications_from_json_payload()
    {
        $response = $this->importPayload([
            'publications' => [
                [
                    'title' => 'Publicación desde JSON',
                    'body' => 'Contenido de prueba',
                    'content_type' => 'post',
                    'hashtags' => ['marketing', '#social'],
                    'media' => ['https://example.com/image.jpg'],
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.success_count', 1)
            ->assertJsonPath('data.failed_count', 0);

        $publication = Publication::where('title', 'Publicación desde JSON')->first();
        $this->assertNotNull($publication);
        $this->assertEquals('draft', $publication->status);
        $this->assertEquals($this->workspace->id, $publication->workspace_id);
        $this->assertCount(1, $publication->mediaFiles);
        $this->assertEquals('image', $publication->mediaFiles->first()->file_type);
    }

    /** @test */
    public function it_imports_a_campaign_with_nested_publications()
    {
        $response = $this->importPayload([
            'campaigns' => [
                [
                    'name' => 'Campaña JSON',
                    'status' => 'active',
                    'start_date' => '2026-07-01',
                    'end_date' => '2026-07-31',
                    'publications' => [
                        [
                            'title' => 'Pub campaña 1',
                            'body' => 'Contenido 1',
                            'media' => ['https://example.com/a.png'],
                        ],
                        [
                            'title' => 'Pub campaña 2',
                            'body' => 'Contenido 2',
                        ],
                    ],
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.success_count', 3); // campaign + 2 publications

        $campaign = Campaign::where('name', 'Campaña JSON')->first();
        $this->assertNotNull($campaign);
        $this->assertCount(2, $campaign->publications);
    }

    /** @test */
    public function it_marks_publication_as_scheduled_when_scheduled_at_is_provided()
    {
        $this->importPayload([
            'publications' => [
                [
                    'title' => 'Programada',
                    'body' => 'Contenido',
                    'scheduled_at' => '2026-08-01 10:00:00',
                ],
            ],
        ])->assertJsonPath('data.success_count', 1);

        $this->assertEquals(
            'scheduled',
            Publication::where('title', 'Programada')->first()->status
        );
    }

    /** @test */
    public function it_reports_errors_for_invalid_items_without_stopping_valid_ones()
    {
        $response = $this->importPayload([
            'publications' => [
                ['title' => 'Válida', 'body' => 'Contenido'],
                ['body' => 'Sin título'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', false)
            ->assertJsonPath('data.success_count', 1)
            ->assertJsonPath('data.failed_count', 1)
            ->assertJsonPath('errors.0.path', 'publications[1]');

        $this->assertDatabaseHas('publications', ['title' => 'Válida']);
    }

    /** @test */
    public function it_does_not_create_campaign_when_a_nested_publication_is_invalid()
    {
        $response = $this->importPayload([
            'campaigns' => [
                [
                    'name' => 'Campaña inválida',
                    'publications' => [
                        ['title' => 'Sin body'],
                    ],
                ],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', false);

        $this->assertDatabaseMissing('campaigns', ['name' => 'Campaña inválida']);
        $this->assertDatabaseMissing('publications', ['title' => 'Sin body']);
    }

    /** @test */
    public function it_rejects_non_image_media_urls()
    {
        $response = $this->importPayload([
            'publications' => [
                [
                    'title' => 'Con video',
                    'body' => 'Contenido',
                    'media' => ['https://example.com/video.mp4'],
                ],
            ],
        ]);

        $response->assertJsonPath('data.failed_count', 1);
        $this->assertDatabaseMissing('publications', ['title' => 'Con video']);
    }

    /** @test */
    public function it_rejects_invalid_json_content()
    {
        $this->actingAs($this->user)
            ->postJson(route('api.v1.json.import'), ['payload' => 'not-valid-json{'])
            ->assertStatus(422);
    }

    /** @test */
    public function it_rejects_empty_root_structure()
    {
        $this->importPayload(['publications' => [], 'campaigns' => []])
            ->assertStatus(200)
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.0.path', 'root');
    }

    /** @test */
    public function it_imports_from_an_uploaded_json_file()
    {
        $content = json_encode([
            'publications' => [
                ['title' => 'Desde archivo', 'body' => 'Contenido'],
            ],
        ]);

        $file = UploadedFile::fake()->createWithContent('import.json', $content);

        $this->actingAs($this->user)
            ->postJson(route('api.v1.json.import'), ['file' => $file])
            ->assertStatus(200)
            ->assertJsonPath('data.success_count', 1);

        $this->assertDatabaseHas('publications', ['title' => 'Desde archivo']);
    }

    /** @test */
    public function it_returns_a_downloadable_template()
    {
        $this->actingAs($this->user)
            ->getJson(route('api.v1.json.template'))
            ->assertStatus(200)
            ->assertHeader('Content-Disposition', 'attachment; filename="plantilla_importacion.json"')
            ->assertJsonStructure(['publications', 'campaigns']);
    }
}

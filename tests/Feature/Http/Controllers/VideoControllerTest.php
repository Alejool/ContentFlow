<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\VideoController
 */
final class VideoControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $videos = Video::factory()->count(3)->create();

        $response = $this->get(route('videos.index'));

        $response->assertOk();
        $response->assertViewIs('video.index');
        $response->assertViewHas('videos');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\VideoController::class,
            'store',
            \App\Http\Requests\VideoStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $url = fake()->url();
        $data = fake()->text();

        $response = $this->post(route('videos.store'), [
            'url' => $url,
            'data' => $data,
        ]);

        $videos = Video::query()
            ->where('url', $url)
            ->where('data', $data)
            ->get();
        $this->assertCount(1, $videos);
        $video = $videos->first();

        $response->assertRedirect(route('video.index'));
        $response->assertSessionHas('video.url', $video->url);
    }
}

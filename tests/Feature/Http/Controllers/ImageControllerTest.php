<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Image;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\ImageController
 */
final class ImageControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $images = Image::factory()->count(3)->create();

        $response = $this->get(route('images.index'));

        $response->assertOk();
        $response->assertViewIs('image.index');
        $response->assertViewHas('images');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\ImageController::class,
            'store',
            \App\Http\Requests\ImageStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $url = fake()->url();
        $title = fake()->sentence(4);

        $response = $this->post(route('images.store'), [
            'url' => $url,
            'title' => $title,
        ]);

        $images = Image::query()
            ->where('url', $url)
            ->where('title', $title)
            ->get();
        $this->assertCount(1, $images);
        $image = $images->first();

        $response->assertRedirect(route('image.index'));
        $response->assertSessionHas('success', $success);
    }
}

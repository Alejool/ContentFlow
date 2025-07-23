<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\CollectionController
 */
final class CollectionControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $collections = Collection::factory()->count(3)->create();

        $response = $this->get(route('collections.index'));

        $response->assertOk();
        $response->assertViewIs('collection.index');
        $response->assertViewHas('collections');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\CollectionController::class,
            'store',
            \App\Http\Requests\CollectionStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $title = fake()->sentence(4);
        $description = fake()->text();

        $response = $this->post(route('collections.store'), [
            'title' => $title,
            'description' => $description,
        ]);

        $collections = Collection::query()
            ->where('title', $title)
            ->where('description', $description)
            ->get();
        $this->assertCount(1, $collections);
        $collection = $collections->first();

        $response->assertRedirect(route('collection.index'));
        $response->assertSessionHas('success', $success);
    }


    #[Test]
    public function attachImage_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\CollectionController::class,
            'attachImage',
            \App\Http\Requests\CollectionAttachImageRequest::class
        );
    }

    #[Test]
    public function attachImage_saves_and_redirects(): void
    {
        $title = fake()->sentence(4);
        $description = fake()->text();

        $response = $this->get(route('collections.attachImage'), [
            'title' => $title,
            'description' => $description,
        ]);

        $collections = Collection::query()
            ->where('title', $title)
            ->where('description', $description)
            ->get();
        $this->assertCount(1, $collections);
        $collection = $collections->first();

        $response->assertRedirect(route('collection.show', ['collection' => $collection]));
        $response->assertSessionHas('success', $success);
    }
}

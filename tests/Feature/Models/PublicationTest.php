<?php

namespace Tests\Feature\Models;

use App\Models\Publications\Publication;
use App\Models\User;
use App\Models\Workspace\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicationTest extends TestCase
{
  use RefreshDatabase;

  public function test_publication_can_be_created_with_params()
  {
    $user = User::create([
      'name' => 'Test User',
      'email' => 'test@example.com',
      'password' => bcrypt('password'),
    ]);

    $workspace = Workspace::create([
      'name' => 'Test Workspace',
      'owner_id' => $user->id,
    ]);

    $publication = Publication::create([
      'user_id' => $user->id,
      'workspace_id' => $workspace->id,
      'title' => 'Test Publication',
      'status' => 'draft',
    ]);

    $this->assertDatabaseHas('publications', [
      'id' => $publication->id,
      'status' => 'draft',
    ]);
  }

  public function test_publication_is_approved_logic()
  {
    $publication = new Publication(['status' => 'approved']);
    $this->assertTrue($publication->isApproved());

    $publication->status = 'published';
    $this->assertTrue($publication->isApproved());

    $publication->status = 'draft';
    $this->assertFalse($publication->isApproved());
  }

  public function test_publication_is_locked_for_editing()
  {
    $publication = new Publication(['status' => 'pending_review']);
    $this->assertTrue($publication->isLockedForEditing());

    $publication->status = 'approved';
    $this->assertTrue($publication->isLockedForEditing());

    $publication->status = 'draft';
    $this->assertFalse($publication->isLockedForEditing());
  }

  public function test_publication_can_be_published()
  {
    $publication = new Publication(['status' => 'approved']);
    $this->assertTrue($publication->canBePublished());

    $publication->status = 'draft';
    $this->assertFalse($publication->canBePublished());

    $publication->status = 'pending_review';
    $this->assertFalse($publication->canBePublished());
  }
}

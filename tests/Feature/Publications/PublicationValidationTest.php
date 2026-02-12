<?php

namespace Tests\Feature\Publications;

use App\Models\User;
use App\Models\Workspace\Workspace;
use App\Models\Social\SocialAccount;
use App\Models\Publications\Publication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;
use App\Models\Role\Role;
use App\Models\Permission\Permission;

class PublicationValidationTest extends TestCase
{
  use RefreshDatabase;
  protected $user;
  protected $workspace;
  protected $socialAccount;

  protected function setUp(): void
  {
    parent::setUp();

    $this->user = User::factory()->create();

    $this->workspace = Workspace::create([
      'name' => 'Test Workspace',
      'created_by' => $this->user->id,
    ]);

    $this->user->workspaces()->attach($this->workspace->id);
    $this->user->current_workspace_id = $this->workspace->id;
    $this->user->save();

    $manageContentPermission = Permission::firstOrCreate(['slug' => 'manage-content', 'name' => 'Manage Content']);
    $adminRole = Role::firstOrCreate(['slug' => 'admin', 'name' => 'Admin', 'workspace_id' => $this->workspace->id]);
    $adminRole->permissions()->syncWithoutDetaching([$manageContentPermission->id]);
    $this->user->workspaces()->updateExistingPivot($this->workspace->id, ['role_id' => $adminRole->id]);

    $this->socialAccount = SocialAccount::factory()->create([
      'user_id' => $this->user->id,
      'workspace_id' => $this->workspace->id,
      'platform' => 'facebook'
    ]);
  }


  public function test_simple_assertion()
  {
    $this->assertTrue(true);
  }

  public function test_cannot_store_publication_with_past_global_scheduled_at()
  {
    $response = $this->actingAs($this->user)
      ->postJson(route('api.v1.publications.store'), [
        'title' => 'Test Publication',
        'description' => 'Test Description',
        'scheduled_at' => Carbon::now()->subDay()->toIso8601String(),
        'social_accounts' => [$this->socialAccount->id]
      ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['scheduled_at']);
  }

  public function test_cannot_store_publication_with_past_individual_schedule()
  {
    $response = $this->actingAs($this->user)
      ->postJson(route('api.v1.publications.store'), [
        'title' => 'Test Publication',
        'description' => 'Test Description',
        'social_accounts' => [$this->socialAccount->id],
        'social_account_schedules' => [
          $this->socialAccount->id => Carbon::now()->subDay()->toIso8601String()
        ]
      ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['social_account_schedules.' . $this->socialAccount->id]);
  }

  public function test_cannot_update_publication_to_past_individual_schedule()
  {
    $publication = Publication::create([
      'user_id' => $this->user->id,
      'workspace_id' => $this->workspace->id,
      'title' => 'Original Title',
      'description' => 'Original Description',
      'status' => 'draft'
    ]);

    $response = $this->actingAs($this->user)
      ->putJson(route('api.v1.publications.update', $publication->id), [
        'title' => 'Updated Title',
        'description' => 'Updated Description',
        'social_accounts' => [$this->socialAccount->id],
        'social_account_schedules' => [
          $this->socialAccount->id => Carbon::now('UTC')->subDay()->toIso8601String()
        ]
      ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['social_account_schedules.' . $this->socialAccount->id]);
  }
}

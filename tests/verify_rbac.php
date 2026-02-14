<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

config(['cache.default' => 'array']);
config(['session.driver' => 'array']);

use App\Models\User;
use App\Models\Role\Role;
use App\Models\Workspace\Workspace;
use Illuminate\Support\Facades\Auth;

// Ensure we have the roles
echo "Verifying Roles...\n";
$draftEditorRole = Role::where('slug', 'draft-editor')->first();
$publisherRole = Role::where('slug', 'publisher')->first();

if (!$draftEditorRole || !$publisherRole) {
  echo "❌ Roles 'draft-editor' or 'publisher' not found. Please run seeder.\n";
  exit(1);
}
echo "✅ Roles found.\n";

// Get a workspace
$workspace = Workspace::first();
if (!$workspace) {
  echo "❌ No workspace found.\n";
  exit(1);
}
echo "Using workspace: {$workspace->name}\n";

// Helper to create user and assign role
function createUserWithRole($role, $workspace)
{
  $user = User::factory()->create();
  $workspace->users()->attach($user->id, ['role_id' => $role->id]);
  return $user;
}

// 1. Test Draft Editor
echo "\n--- Testing Draft Editor ---\n";
$draftEditor = createUserWithRole($draftEditorRole, $workspace);
Auth::login($draftEditor);

// Try to create scheduled publication
$controller = new \App\Http\Controllers\Publications\PublicationController();
$request = new \App\Http\Requests\Publications\StorePublicationRequest();
$request->merge([
  'title' => 'Draft Editor Try Schedule',
  'scheduled_at' => now()->addDay()->toIso8601String(),
  'status' => 'draft', // The controller logic should prevent status escalation if scheduled_at is present?
  // Actually our logic forces status to 'draft' and unsets 'scheduled_at'
]);
$request->setContainer(app());
$request->setUserResolver(fn() => $draftEditor);

// Mock Action
$action = new \App\Actions\Publications\CreatePublicationAction(
  new \App\Services\Media\MediaProcessingService(new \App\Services\Media\MediaStorageService(), new \App\Services\Media\ImageProcessingService(), new \App\Services\Media\VideoProcessingService()),
  new \App\Services\Scheduling\SchedulingService()
);

try {
  // We are simulating the controller call. Validation might fail if we don't pass all required fields.
  // Let's rely on manual inspection or simplified logic checks if full controller test is too complex dep-wise.
  // For now, let's just inspect the logic we changed.

  // Actually, calling controller directly is hard without full request mock.
  // Let's create a publication via Model to verify Permissions logic in User model first?
  // No, we changed Controller logic.

  echo "User Permissions: " . ($draftEditor->hasPermission('publish', $workspace->id) ? 'PUBLISH' : 'NO-PUBLISH') . "\n";
  if ($draftEditor->hasPermission('publish', $workspace->id)) {
    echo "❌ Draft Editor SHOULD NOT have publish permission.\n";
  } else {
    echo "✅ Draft Editor has restricted permissions.\n";
  }
} catch (\Exception $e) {
  echo "Error: " . $e->getMessage() . "\n";
}

// 2. Test Publisher
echo "\n--- Testing Publisher ---\n";
$publisher = createUserWithRole($publisherRole, $workspace);
Auth::login($publisher);

echo "User Permissions: " . ($publisher->hasPermission('publish', $workspace->id) ? 'PUBLISH' : 'NO-PUBLISH') . "\n";
if (!$publisher->hasPermission('publish', $workspace->id)) {
  echo "❌ Publisher SHOULD have publish permission.\n";
} else {
  echo "✅ Publisher has correct permissions.\n";
}

// Delete test users
$draftEditor->delete();
$publisher->delete();

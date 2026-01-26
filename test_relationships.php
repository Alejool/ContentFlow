<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Testing User Workspaces Relationships\n";
echo "=====================================\n\n";

try {
  // Test the CORRECT way to load workspaces with roles and permissions
  $user = User::with('workspaces')->first();

  if (!$user) {
    echo "No users found in database\n";
    exit(1);
  }

  echo "User: {$user->name}\n";
  echo "Current workspace ID: {$user->current_workspace_id}\n\n";

  echo "Workspaces:\n";
  foreach ($user->workspaces as $workspace) {
    echo "  - {$workspace->name}\n";

    // Access role through pivot (WorkspaceUser model auto-loads role)
    $role = $workspace->pivot->role;

    if ($role) {
      echo "    Role: {$role->name} ({$role->slug})\n";

      // Load permissions for this role
      $role->load('permissions');
      $permissions = $role->permissions->pluck('slug')->toArray();
      echo "    Permissions: " . implode(', ', $permissions) . "\n";
    } else {
      echo "    Role: No role assigned\n";
    }
    echo "\n";
  }

  echo "\n✓ Test completed successfully!\n";
  echo "\nCorrect usage:\n";
  echo "  \$user = User::with('workspaces')->first();\n";
  echo "  foreach (\$user->workspaces as \$workspace) {\n";
  echo "    \$role = \$workspace->pivot->role; // Access role through pivot\n";
  echo "    \$permissions = \$role->permissions; // Access permissions from role\n";
  echo "  }\n";
} catch (Exception $e) {
  echo "Error: " . $e->getMessage() . "\n";
  echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
  exit(1);
}

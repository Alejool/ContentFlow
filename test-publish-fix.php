<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = \Illuminate\Http\Request::capture()
);

// Test the policy fix
$user = \App\Models\User::find(1);
$workspace = \App\Models\Workspace\Workspace::first();
$publication = \App\Models\Publications\Publication::first();

echo "=== PUBLISH PERMISSION TEST ===\n\n";

if ($user && $workspace && $publication) {
    echo "✓ Found test data\n";
    echo "  User ID: {$user->id} ({$user->name})\n";
    
    // Get user role
    $role = $user->workspaces()->where('workspaces.id', $workspace->id)->first()?->pivot->role_id;
    if ($role) {
        $roleObj = \App\Models\Auth\Role::find($role);
        echo "  User role: {$roleObj->slug}\n";
    } else {
        echo "  User role: No explicit role in pivot\n";
    }
    
    echo "  Workspace ID: {$workspace->id}\n";
    echo "  Publication ID: {$publication->id}\n";
    echo "  Publication status: {$publication->status}\n";
    
    // Check if there's an approval workflow
    $workflow = $workspace->approvalWorkflow;
    if ($workflow && $workflow->is_enabled) {
        echo "  Approval workflow: ENABLED\n";
    } else {
        echo "  Approval workflow: DISABLED\n";
    }
    
    echo "\nTesting publish policy...\n";
    
    // Test the policy
    $policy = new \App\Policies\Publication\PublicationPolicy(
        app(\App\Services\Roles\RoleService::class),
        app(\App\Services\Approval\ApprovalWorkflowService::class)
    );
    
    $canPublish = $policy->publish($user, $publication);
    echo "\n✓ RESULT: Can publish = " . ($canPublish ? "✅ YES" : "❌ NO") . "\n";
    
    if (!$canPublish && $role) {
        echo "\nNote: User with role '{$roleObj->slug}' cannot publish.\n";
        if ($workflow && $workflow->is_enabled) {
            echo "This is expected if workflow is enabled and content is not approved.\n";
        }
    }
    
} else {
    echo "❌ Could not find test data\n";
    echo "  User: " . ($user ? "✓" : "✗") . "\n";
    echo "  Workspace: " . ($workspace ? "✓" : "✗") . "\n";
    echo "  Publication: " . ($publication ? "✓" : "✗") . "\n";
}

echo "\n=== CHECKING LOG OUTPUT ===\n";
echo "Check storage/logs/laravel.log for detailed debug info from the policy\n";

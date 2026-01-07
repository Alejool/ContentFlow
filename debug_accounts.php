<?php
use App\Models\User;
use App\Models\SocialAccount;
use Illuminate\Support\Facades\Auth;

$user = User::where('email', 'editor@demo.com')->first();
if (!$user) {
    echo "User not found\n";
    exit;
}

Auth::login($user);
$workspaceId = $user->current_workspace_id;
echo "Logged in as: {$user->email}\n";
echo "Current Workspace ID: {$workspaceId}\n";

$permissions = $user->hasPermission('publish', $workspaceId) ? 'YES' : 'NO';
echo "Has 'publish' permission: {$permissions}\n";

$accounts = SocialAccount::where('workspace_id', $workspaceId)->get();
echo "Number of social accounts in workspace: " . $accounts->count() . "\n";

foreach ($accounts as $acc) {
    echo "- {$acc->platform}: {$acc->account_name} (ID: {$acc->id})\n";
}

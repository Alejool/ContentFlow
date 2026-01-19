<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use App\Models\Role;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WorkspaceController extends Controller
{
  use ApiResponse;

  public function index(Request $request)
  {
    $user = Auth::user()->load([
      'workspaces' => function ($q) {
        $q->withCount('users')
          ->with([
            'users' => function ($qu) {
              $qu->select('users.id', 'users.name', 'users.photo_url')
                ->withPivot('role_id')
                ->limit(10);
            }
          ]);
      }
    ]);

    if ($request->wantsJson() || $request->is('api/*')) {
      return $this->successResponse([
        'workspaces' => $user->workspaces,
        'roles' => Role::all(),
      ]);
    }

    return Inertia::render('Workspace/Index', [
      'workspaces' => $user->workspaces,
      'roles' => Role::all(),
    ]);
  }

  public function store(Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255',
      'description' => 'nullable|string|max:1000',
    ]);

    $workspace = Workspace::create([
      'name' => $request->name,
      'description' => $request->description,
      'created_by' => Auth::id(),
      'slug' => Str::slug($request->name) . '-' . Str::random(4),
    ]);

    $ownerRole = Role::where('slug', 'owner')->first();
    Auth::user()->workspaces()->attach($workspace->id, ['role_id' => $ownerRole->id]);

    // Auto-switch to new workspace
    Auth::user()->update(['current_workspace_id' => $workspace->id]);

    if ($request->wantsJson() || $request->is('api/*')) {
      return $this->successResponse($workspace, 'Workspace created successfully.', 201);
    }

    return redirect()->back()->with('message', 'Workspace created successfully.');
  }

  public function switch(Workspace $workspace)
  {
    // Verify user belongs to workspace
    if (!Auth::user()->workspaces()->where('workspaces.id', $workspace->id)->exists()) {
      abort(403);
    }

    Auth::user()->update(['current_workspace_id' => $workspace->id]);

    if (request()->wantsJson() || request()->is('api/*')) {
      return $this->successResponse(null, "Switched to {$workspace->name}");
    }

    return redirect()->back()->with('message', "Switched to {$workspace->name}");
  }

  public function settings(Request $request, Workspace $workspace)
  {
    // Allow any member of the workspace to view settings
    if (!$workspace->users()->where('users.id', Auth::id())->exists()) {
      abort(403);
    }

    if ($request->wantsJson() || $request->is('api/*')) {
      return $this->successResponse([
        'workspace' => $workspace->load('users'),
        'roles' => Role::with('permissions')->get(),
      ]);
    }

    return Inertia::render('Workspace/Settings', [
      'workspace' => $workspace->load('users'),
      'roles' => Role::with('permissions')->get(),
    ]);
  }

  public function update(Request $request, Workspace $workspace)
  {
    // Check permission (manage-workspace or manage-team typically)
    if (!Auth::user()->hasPermission('manage-team', $workspace->id)) {
      abort(403);
    }

    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'description' => 'nullable|string|max:1000',
    ]);

    $workspace->update($validated);

    if ($request->wantsJson() || $request->is('api/*')) {
      return $this->successResponse(['workspace' => $workspace], 'Workspace updated successfully.');
    }

    return redirect()->back()->with('message', 'Workspace updated successfully.');
  }

  public function members($workspaceId)
  {
    $workspace = Workspace::with([
      'users' => function ($query) {
        $query->select('users.id', 'users.name', 'users.email', 'users.photo_url', 'users.created_at')
          ->withPivot('role_id', 'created_at');
      }
    ])->findOrFail($workspaceId);

    // Verify user belongs to workspace
    if (!Auth::user()->workspaces()->where('workspaces.id', $workspaceId)->exists()) {
      abort(403);
    }

    $roleDistribution = $workspace->users->groupBy(function ($user) {
      return $user->pivot->role_id;
    })->map(function ($group) {
      return $group->count();
    });

    return $this->successResponse([
      'members' => $workspace->users,
      'member_count' => $workspace->users->count(),
      'role_distribution' => $roleDistribution,
    ]);
  }

  public function updateMemberRole(Request $request, $workspaceId, $userId)
  {
    $workspace = Workspace::findOrFail($workspaceId);

    // Check if user has permission to manage members
    if (!Auth::user()->hasPermission('manage-team', $workspaceId)) {
      abort(403, 'You do not have permission to manage members');
    }

    $validated = $request->validate([
      'role_id' => 'required|exists:roles,id'
    ]);

    // Prevent changing creator's role
    if ($workspace->created_by === $userId) {
      return response()->json([
        'success' => false,
        'message' => 'Cannot change workspace creator\'s role'
      ], 422);
    }

    $workspace->users()->updateExistingPivot($userId, [
      'role_id' => $validated['role_id']
    ]);

    return $this->successResponse(null, 'Member role updated successfully');
  }

  public function removeMember($workspaceId, $userId)
  {
    $workspace = Workspace::findOrFail($workspaceId);

    // Check if user has permission to manage members
    if (!Auth::user()->hasPermission('manage-team', $workspaceId)) {
      abort(403, 'You do not have permission to manage members');
    }

    // Prevent removing the creator
    if ($workspace->created_by === $userId) {
      return response()->json([
        'success' => false,
        'message' => 'Cannot remove workspace creator'
      ], 422);
    }

    // Send notification before detaching
    $removedUser = \App\Models\User::find($userId);
    if ($removedUser) {
      $removedUser->notify(new \App\Notifications\WorkspaceRemovedNotification($workspace->name));
    }

    $workspace->users()->detach($userId);

    // If removed user was using this workspace, switch them to another
    if ($removedUser && $removedUser->current_workspace_id === (int)$workspaceId) {
      $firstWorkspace = $removedUser->workspaces()->first();
      $removedUser->update(['current_workspace_id' => $firstWorkspace ? $firstWorkspace->id : null]);
    }

    return response()->json([
      'success' => true,
      'message' => 'Member removed successfully',
      'members' => $workspace->users()->select('users.id', 'users.name', 'users.email', 'users.photo_url', 'users.created_at')
        ->withPivot('role_id', 'created_at')->get()
    ]);
  }

  public function invite(Request $request, $workspaceId)
  {
    $workspace = Workspace::findOrFail($workspaceId);

    // Check permission
    if (!Auth::user()->hasPermission('manage-team', $workspaceId)) {
      abort(403, 'You do not have permission to invite members');
    }

    $validated = $request->validate([
      'email' => 'required|email|exists:users,email',
      'role_id' => 'required|exists:roles,id'
    ], [
      'email.exists' => 'We could not find a user with this email address in our system.',
      'role_id.required' => 'Please select a role for the new member.',
    ]);

    $user = \App\Models\User::where('email', $validated['email'])->first();

    // Check if user is already a member
    if ($workspace->users()->where('users.id', $user->id)->exists()) {
      return response()->json([
        'success' => false,
        'message' => 'User is already a member of this workspace',
      ], 422);
    }

    // Attach user to workspace with role
    $workspace->users()->attach($user->id, ['role_id' => $validated['role_id']]);

    return response()->json(['success' => true, 'message' => 'Member added successfully']);
  }

  /**
   * Test Slack/Discord webhook connections for a workspace
   */
  public function testWebhook(Request $request, Workspace $workspace)
  {
    if (!Auth::user()->hasPermission('manage-team', $workspace->id)) {
      abort(403);
    }

    $validated = $request->validate([
      'type' => 'required|in:slack,discord',
      'url' => 'required|url'
    ]);

    $url = $validated['url'];
    $isDiscordInvite = $validated['type'] === 'discord' && (str_contains($url, 'discord.gg') || str_contains($url, 'discord.com/invite'));

    try {
      if ($isDiscordInvite) {
        $eventType = 'community_invite';
        $success = true; // Invites are just links, we assume success if URL is valid for now
        $responseBody = 'Discord invite detected and saved.';
        $statusCode = 200;
        $payload = ['url' => $url];
      } else {
        $eventType = 'test_connection';
        if ($validated['type'] === 'slack') {
          $payload = [
            'text' => "🚀 Test notification from ContentFlow for workspace: {$workspace->name}",
            'url' => $url, // Include URL in payload for logging
          ];
        } else {
          $payload = [
            'content' => "🚀 Test notification from ContentFlow for workspace: {$workspace->name}",
            'url' => $url, // Include URL in payload for logging
          ];
        }

        $response = \Illuminate\Support\Facades\Http::timeout(10)
          ->withoutVerifying()
          ->post($url, $payload);

        $success = $response->successful();
        $responseBody = $response->body();
        $statusCode = $response->status();
      }

      // If successful (or invite), save the webhook/invite URL to the workspace
      if ($success) {
        $updateData = $validated['type'] === 'slack'
          ? ['slack_webhook_url' => $url]
          : ['discord_webhook_url' => $url];
        $workspace->update($updateData);
      }

      // Log the attempt
      \App\Models\WebhookLog::create([
        'workspace_id' => $workspace->id,
        'channel' => $validated['type'],
        'event_type' => $eventType,
        'payload' => $payload,
        'response' => $responseBody,
        'status_code' => $statusCode,
        'success' => $success,
      ]);

      if ($success) {
        $msg = $isDiscordInvite
          ? "Invite link for {$validated['type']} saved successfully."
          : "Test message sent to {$validated['type']} successfully and settings saved.";
        return $this->successResponse(['workspace' => $workspace->refresh()], $msg);
      }

      $errorMsg = "Failed to send test message to {$validated['type']}. Status: " . $statusCode;
      if ($responseBody) {
        $errorMsg .= " - Details: " . substr($responseBody, 0, 100);
      }

      return $this->errorResponse($errorMsg, 400);
    } catch (\Exception $e) {
      return $this->errorResponse("Error testing webhook: " . $e->getMessage(), 500);
    }
  }

  /**
   * Get recent workspace activity (webhook logs)
   */
  public function activity(Workspace $workspace)
  {
    if (!Auth::user()->workspaces()->where('workspaces.id', $workspace->id)->exists()) {
      abort(403);
    }

    $logs = \App\Models\WebhookLog::where('workspace_id', $workspace->id)
      ->orderBy('created_at', 'desc')
      ->limit(50)
      ->get();

    return $this->successResponse($logs);
  }

  /**
   * Show a workspace (switches current workspace and redirects to dashboard)
   */
  public function show(Workspace $workspace)
  {
    // Verify user belongs to workspace
    if (!Auth::user()->workspaces()->where('workspaces.id', $workspace->id)->exists()) {
      abort(403);
    }

    Auth::user()->update(['current_workspace_id' => $workspace->id]);

    return redirect()->route('dashboard')->with('message', "Switched to workspace: {$workspace->name}");
  }
}

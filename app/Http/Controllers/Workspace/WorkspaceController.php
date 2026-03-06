<?php

namespace App\Http\Controllers\Workspace;

use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

use App\Notifications\WorkspaceRemovedNotification;

use App\Models\User;
use App\Models\Logs\WebhookLog;
use App\Models\Workspace\Workspace;
use App\Models\Role\Role;
use Illuminate\Support\Str;

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

    try {
      $workspace = Workspace::create([
        'name' => $request->name,
        'description' => $request->description,
        'created_by' => Auth::id(),
        // Slug is handled by model creating event if not provided
      ]);

      $ownerRole = Role::where('slug', 'owner')->first();
      Auth::user()->workspaces()->attach($workspace->id, ['role_id' => $ownerRole->id]);

      // Auto-switch to new workspace
      Auth::user()->update(['current_workspace_id' => $workspace->id]);

      if ($request->wantsJson() || $request->is('api/*')) {
        return $this->successResponse($workspace, __('workspace.messages.update_success'), 201);
      }

      return redirect()->back()->with('message', __('workspace.messages.update_success'));
    } catch (\Illuminate\Database\QueryException $e) {
      if ($e->getCode() == 23505 || str_contains($e->getMessage(), 'unique constraint')) {
        $errorMsg = __('workspace.messages.slug_already_exists', ['name' => $request->name]);
        if ($errorMsg === 'workspace.messages.slug_already_exists') {
          $errorMsg = "A workspace with a similar identifier for \"{$request->name}\" already exists. Please try another name.";
        }

        if ($request->wantsJson() || $request->is('api/*')) {
          return response()->json([
            'success' => false,
            'message' => $errorMsg,
            'errors' => ['name' => [$errorMsg]]
          ], 422);
        }
        return redirect()->back()->withErrors(['name' => $errorMsg]);
      }
      throw $e;
    }
  }

  public function switch($idOrSlug)
  {
    Log::info('Workspace Switch Attempt', ['idOrSlug' => $idOrSlug]);

    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->first();

    if (!$workspace) {
      Log::error('Workspace Not Found during switch', ['idOrSlug' => $idOrSlug]);
      abort(404, "Workspace [{$idOrSlug}] not found.");
    }

    Log::info('Workspace Found', ['id' => $workspace->id, 'slug' => $workspace->slug]);

    if (!Auth::user()->workspaces()->where('workspaces.id', $workspace->id)->exists()) {
      Log::warning('User does not belong to workspace', ['user_id' => Auth::id(), 'workspace_id' => $workspace->id]);
      abort(403);
    }

    $user = Auth::user();
    $user->current_workspace_id = $workspace->id;
    $user->save();

    if (request()->is('api/*') || (request()->wantsJson() && !request()->header('X-Inertia'))) {
      return $this->successResponse(null, "Switched to {$workspace->name}");
    }

    return redirect()->route('dashboard')->with('message', "Switched to {$workspace->name}");
  }

  public function settings(Request $request, $idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

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

  public function update(Request $request, $idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    if (Auth::id() !== $workspace->created_by) {
      abort(403, 'Only the workspace owner can update workspace settings');
    }

    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'description' => 'nullable|string|max:1000',
      'public' => 'nullable|boolean',
      'allow_public_invites' => 'nullable|boolean',
    ]);

    $workspace->update($validated);

    if ($request->wantsJson() || $request->is('api/*')) {
      return $this->successResponse(['workspace' => $workspace], 'Workspace updated successfully.');
    }

    return redirect()->back()->with('message', 'Workspace updated successfully.');
  }

  /**
   * Update white-label settings for enterprise workspaces.
   */
  public function updateWhiteLabel(Request $request, $idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    Log::info('ENTRY: updateWhiteLabel', [
      'workspace_slug' => $workspace->slug,
      'has_file_logo' => $request->hasFile('logo'),
      'has_file_favicon' => $request->hasFile('favicon'),
      'primary_color' => $request->primary_color
    ]);

    if (Auth::id() !== $workspace->created_by) {
      abort(403, 'Only the workspace owner can update white-label settings');
    }

    // Check if the workspace is on the enterprise plan
    if ($workspace->getPlanName() !== 'enterprise') {
      return $this->errorResponse('This feature is only available for Enterprise plans.', 403);
    }

    $request->validate([
      'logo' => 'nullable|image|max:2048',
      'favicon' => 'nullable|image|max:1024',
      'primary_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
    ]);

    $data = [
      'white_label_primary_color' => $request->primary_color,
    ];

    $disk = config('filesystems.default') === 's3' ? 's3' : 'public';

    try {
      if ($request->hasFile('logo')) {
        $oldLogo = $workspace->white_label_logo_url;
        $file = $request->file('logo');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        Log::info('Attempting logo storage', ['filename' => $filename, 'disk' => $disk]);

        $path = false;
        try {
          $path = $file->storeAs('workspace-branding', $filename, [
            'disk' => $disk,
            'visibility' => 'public'
          ]);
        } catch (\Exception $e) {
          Log::warning('Logo storage public failed', ['error' => $e->getMessage()]);
        }

        if (!$path) {
          Log::info('Retrying logo storage default');
          $path = $file->storeAs('workspace-branding', $filename, $disk);
        }

        if ($path) {
          Log::info('Logo stored successfully', ['path' => $path]);
          $data['white_label_logo_url'] = Storage::disk($disk)->url($path);

          if ($oldLogo && str_contains($oldLogo, 'workspace-branding')) {
            preg_match('/workspace-branding\/[^\?]+/', $oldLogo, $matches);
            if (!empty($matches)) {
              Storage::disk($disk)->delete($matches[0]);
            }
          }
        }
      }

      if ($request->hasFile('favicon')) {
        $oldFavicon = $workspace->white_label_favicon_url;
        $file = $request->file('favicon');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        Log::info('Attempting favicon storage', ['filename' => $filename, 'disk' => $disk]);

        $path = false;
        try {
          $path = $file->storeAs('workspace-branding', $filename, [
            'disk' => $disk,
            'visibility' => 'public'
          ]);
        } catch (\Exception $e) {
          Log::warning('Favicon storage public failed', ['error' => $e->getMessage()]);
        }

        if (!$path) {
          Log::info('Retrying favicon storage default');
          $path = $file->storeAs('workspace-branding', $filename, $disk);
        }

        if ($path) {
          Log::info('Favicon stored successfully', ['path' => $path]);
          $data['white_label_favicon_url'] = Storage::disk($disk)->url($path);

          if ($oldFavicon && str_contains($oldFavicon, 'workspace-branding')) {
            preg_match('/workspace-branding\/[^\?]+/', $oldFavicon, $matches);
            if (!empty($matches)) {
              Storage::disk($disk)->delete($matches[0]);
            }
          }
        }
      }

      $workspace->update($data);
    } catch (\Exception $e) {
      Log::error('WHITE_LABEL_CRITICAL_FAILURE', [
        'message' => $e->getMessage(),
        'exception' => get_class($e),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => substr($e->getTraceAsString(), 0, 500)
      ]);
      return $this->errorResponse('Branding Error: ' . $e->getMessage(), 500);
    }

    if ($request->wantsJson() || $request->is('api/*')) {
      return $this->successResponse(['workspace' => $workspace, 'data' => $data], 'White-label settings updated successfully.');
    }

    return redirect()->back()->with('message', 'White-label settings updated successfully.');
  }

  public function members(Request $request, $idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->with([
      'users' => function ($query) {
        $query->select('users.id', 'users.name', 'users.email', 'users.photo_url', 'users.created_at')
          ->withPivot('role_id', 'created_at');
      }
    ])->firstOrFail();

    if (!Auth::user()->workspaces()->where('workspaces.id', $workspace->id)->exists()) {
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

  public function updateMemberRole(Request $request, $idOrSlug, $userId)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    if (!Auth::user()->hasPermission('manage-team', $workspace->id)) {
      abort(403, 'You do not have permission to manage members');
    }

    $validated = $request->validate([
      'role_id' => 'required|exists:roles,id'
    ]);

    // Prevent changing workspace creator's role
    if ($workspace->created_by === $userId) {
      return response()->json([
        'success' => false,
        'message' => __('messages.workspace.creator_role_change')
      ], 422);
    }

    // Prevent assigning Owner role to anyone
    $role = Role::find($validated['role_id']);
    if ($role && $role->slug === 'owner') {
      return response()->json([
        'success' => false,
        'message' => __('messages.workspace.owner_role_assign')
      ], 422);
    }

    $workspace->users()->updateExistingPivot($userId, [
      'role_id' => $validated['role_id']
    ]);

    return $this->successResponse(null, 'Member role updated successfully');
  }

  public function removeMember($idOrSlug, $userId)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    if (!Auth::user()->hasPermission('manage-team', $workspace->id)) {
      abort(403, 'You do not have permission to manage members');
    }

    if ($workspace->created_by === $userId) {
      return response()->json([
        'success' => false,
        'message' => __('messages.workspace.creator_remove')
      ], 422);
    }

    $removedUser = User::find($userId);
    if ($removedUser) {
      $removedUser->notify(new WorkspaceRemovedNotification($workspace->name));
    }

    $workspace->users()->detach($userId);

    if ($removedUser && $removedUser->current_workspace_id === (int)$workspace->id) {
      $firstWorkspace = $removedUser->workspaces()->first();
      $removedUser->update(['current_workspace_id' => $firstWorkspace ? $firstWorkspace->id : null]);
    }

    return response()->json([
      'success' => true,
      'message' => __('messages.workspace.member_removed'),
      'members' => $workspace->users()->select('users.id', 'users.name', 'users.email', 'users.photo_url', 'users.created_at')
        ->withPivot('role_id', 'created_at')->get()
    ]);
  }

  public function invite(Request $request, $idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    if (!Auth::user()->hasPermission('manage-team', $workspace->id)) {
      abort(403, 'You do not have permission to invite members');
    }

    // Check member limits
    if (!$workspace->canAddTeamMember()) {
      $usageService = app(\App\Services\WorkspaceUsageService::class);
      return response()->json([
        'success' => false,
        'message' => $usageService->getLimitReachedMessage($workspace, 'team_members')
      ], 422);
    }

    $validated = $request->validate([
      'email' => 'required|email|exists:users,email',
      'role_id' => 'required|exists:roles,id'
    ], [
      'email.exists' => 'We could not find a user with this email address in our system.',
      'role_id.required' => 'Please select a role for the new member.',
    ]);

    // Prevent inviting with Owner role
    $role = Role::find($validated['role_id']);
    if ($role && $role->slug === 'owner') {
      return response()->json([
        'success' => false,
        'message' => __('messages.workspace.owner_role_assign'),
      ], 422);
    }

    $user = User::where('email', $validated['email'])->first();

    if ($workspace->users()->where('users.id', $user->id)->exists()) {
      return response()->json([
        'success' => false,
        'message' => __('messages.workspace.user_already_member'),
      ], 422);
    }

    // Attach user to workspace with role
    $workspace->users()->attach($user->id, ['role_id' => $validated['role_id']]);

    return response()->json(['success' => true, 'message' => __('messages.workspace.member_added')]);
  }

  /**
   * Test Slack/Discord webhook connections for a workspace
   */
  public function testWebhook(Request $request, $idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

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
        $success = true;
        $responseBody = 'Discord invite detected and saved.';
        $statusCode = 200;
        $payload = ['url' => $url];
      } else {
        $eventType = 'test_connection';
        if ($validated['type'] === 'slack') {
          $payload = [
            'text' => "Test notification from ContentFlow for workspace: {$workspace->name}",
            'url' => $url,
          ];
        } else {
          $payload = [
            'content' => "Test notification from ContentFlow for workspace: {$workspace->name}",
            'url' => $url,
          ];
        }

        $response = Http::timeout(10)
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
      WebhookLog::create([
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
  public function activity(Request $request, $idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    if (!Auth::user()->workspaces()->where('workspaces.id', $workspace->id)->exists()) {
      abort(403);
    }

    $query = WebhookLog::where('workspace_id', $workspace->id)
      ->orderBy('created_at', 'desc');

    if ($request->has('channel') && (string)$request->channel !== 'all' && (string)$request->channel !== '') {
      $query->where('channel', $request->channel);
    }

    if ($request->has('status') && (string)$request->status !== 'all' && (string)$request->status !== '') {
      $success = $request->status === 'sent' || $request->status === 'success';
      $query->where('success', $success);
    }

    $logs = $query->paginate($request->input('per_page', 15));

    return $this->successResponse($logs->toArray());
  }

  public function permissions()
  {
    return $this->successResponse(\App\Models\Permission\Permission::all());
  }

  /**
   * Show a workspace (switches current workspace and redirects to dashboard)
   */
  public function show($idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    // Verify user belongs to workspace
    if (!Auth::user()->workspaces()->where('workspaces.id', $workspace->id)->exists()) {
      abort(403);
    }

    Auth::user()->update(['current_workspace_id' => $workspace->id]);

    return redirect()->route('dashboard')->with('message', "Switched to workspace: {$workspace->name}");
  }

  public function storeRole(Request $request, $idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    if (!Auth::user()->hasPermission('manage-team', $workspace->id)) {
      abort(403, 'You do not have permission to create roles');
    }

    $validated = $request->validate([
      'name' => 'required|string|max:255|unique:roles,name',
      'description' => 'nullable|string|max:1000',
      'permissions' => 'nullable|array',
      'permissions.*' => 'exists:permissions,id',
    ]);

    return DB::transaction(function () use ($validated) {
      $role = Role::create([
        'name' => $validated['name'],
        'slug' => Str::slug($validated['name']),
        'description' => $validated['description'] ?? null,
      ]);

      if (!empty($validated['permissions'])) {
        $role->permissions()->sync($validated['permissions']);
      }

      return $this->successResponse([
        'role' => $role->load('permissions')
      ], 'Role created successfully', 201);
    });
  }

  public function destroy($idOrSlug)
  {
    $workspace = Workspace::where(function ($q) use ($idOrSlug) {
      if (is_numeric($idOrSlug)) {
        $q->where('id', $idOrSlug);
      }
      $q->orWhere('slug', $idOrSlug);
    })->firstOrFail();

    // STRICT CHECK: Only the creator can delete the workspace
    if (Auth::id() !== $workspace->created_by) {
      abort(403, 'Only the workspace owner can delete this workspace.');
    }

    $workspace->delete();

    // Switch user to another workspace if available
    $user = Auth::user();
    $firstWorkspace = $user->workspaces()->where('workspaces.id', '!=', $workspace->id)->first();

    $user->update([
      'current_workspace_id' => $firstWorkspace ? $firstWorkspace->id : null
    ]);

    return redirect()->route('dashboard')->with('message', 'Workspace deleted successfully.');
  }
}

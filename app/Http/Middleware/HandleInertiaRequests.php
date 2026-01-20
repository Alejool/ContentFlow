<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
  /**
   * The root template that is loaded on the first page visit.
   *
   * @var string
   */
  protected $rootView = 'app';

  /**
   * Determine the current asset version.
   */
  public function version(Request $request): ?string
  {
    return parent::version($request);
  }

  /**
   * Define the props that are shared by default.
   *
   * @return array<string, mixed>
   */
  public function share(Request $request): array
  {
    return array_merge(parent::share($request), [
      'auth' => [
        'user' => $request->user() ? [
          'id' => $request->user()->id,
          'name' => $request->user()->name,
          'email' => $request->user()->email,
          'email_verified_at' => $request->user()->email_verified_at,
          'locale' => $request->user()->locale ?? 'es',
          'created_at' => $request->user()->created_at,
          'photo_url' => $request->user()->photo_url,
          'theme' => $request->user()->theme,
          'provider' => $request->user()->provider,
          'phone' => $request->user()->phone,
          'bio' => $request->user()->bio,
          'country_code' => $request->user()->country_code,
          'global_platform_settings' => $request->user()->global_platform_settings ?? [],
          'current_workspace_id' => $request->user()->current_workspace_id,
        ] : null,
        'workspaces' => $request->user() ? $request->user()->workspaces()
          ->withCount('users')
          ->with([
            'users' => function ($query) {
              $query->select('users.id', 'users.name', 'users.email', 'users.photo_url')
                ->withPivot('role_id');
            }
          ])
          ->get() : [],
        'roles' => \App\Models\Role::all(), // Shared globally
        'current_workspace' => function () use ($request) {
          $user = $request->user();
          if (!$user)
            return null;

          $currentWorkspace = null;
          if ($user->current_workspace_id) {
            $currentWorkspace = $user->workspaces()
              ->where('workspaces.id', $user->current_workspace_id)
              ->withCount('users')
              ->with([
                'users' => function ($query) {
                  $query->select('users.id', 'users.name', 'users.email', 'users.photo_url')
                    ->withPivot('role_id', 'created_at');
                },
                'creator:id,name,email'
              ])
              ->first();
          }

          if (!$currentWorkspace) {
            $firstWorkspace = $user->workspaces()
              ->withCount('users')
              ->with([
                'users' => function ($query) {
                  $query->select('users.id', 'users.name', 'users.email', 'users.photo_url')
                    ->withPivot('role_id', 'created_at');
                },
                'creator:id,name,email'
              ])
              ->first();

            if ($firstWorkspace) {
              $currentWorkspace = $firstWorkspace;
              $user->update(['current_workspace_id' => $firstWorkspace->id]);
            }
          }

          if ($currentWorkspace) {
            $roles = \App\Models\Role::all();
            $currentUser = $currentWorkspace->users->where('id', $user->id)->first();
            $roleId = $currentUser ? $currentUser->pivot->role_id : null;
            $role = $roles->find($roleId);
            $isOwner = ((int)$currentWorkspace->created_by === (int)$user->id) || ($role && $role->slug === 'owner');
            $currentWorkspace->user_role = $isOwner ? 'Owner' : ($role ? $role->name : 'Member');
            $currentWorkspace->user_role_slug = $isOwner ? 'owner' : ($role ? $role->slug : 'member');

            if ($isOwner) {
              $currentWorkspace->permissions = \App\Models\Permission::pluck('slug')->toArray();
            } else {
              $currentWorkspace->permissions = $role ? $role->permissions->pluck('slug')->toArray() : [];
            }

            // Debug Logging
            \Illuminate\Support\Facades\Log::info("Inertia Shared - User: {$user->id}, Workspace: {$currentWorkspace->id} ({$currentWorkspace->name}), Role: {$currentWorkspace->user_role} ({$currentWorkspace->user_role_slug}), RoleID: {$roleId}, IsOwner: " . ($isOwner ? 'YES' : 'NO') . ", Permissions: " . implode(',', $currentWorkspace->permissions));
          }

          return $currentWorkspace;
        },
      ],
      'flash' => [
        'message' => fn() => $request->session()->get('message')
      ],
      'ziggy' => fn() => [
        ...(new Ziggy)->toArray(),
        'location' => $request->url(),
      ],
    ]);
  }
}

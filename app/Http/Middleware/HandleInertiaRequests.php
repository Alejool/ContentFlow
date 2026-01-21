<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\Role;

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
        'workspaces' => function () use ($request) {
          $user = $request->user();
          if (!$user) return [];

          $roles = Role::all();
          return $user->workspaces()
            ->withCount('users')
            ->with([
              'users' => function ($query) use ($user) {
                $query->where('users.id', $user->id)
                  ->select('users.id', 'users.name', 'users.email', 'users.photo_url')
                  ->withPivot('role_id');
              }
            ])
            ->get()
            ->map(function ($ws) use ($user, $roles) {
              $currentUser = $ws->users->first();
              $roleId = $currentUser ? $currentUser->pivot->role_id : null;
              $role = $roles->find($roleId);
              $isOwner = ((int)$ws->created_by === (int)$user->id) || ($role && $role->slug === 'owner');
              $ws->user_role = $isOwner ? 'Owner' : ($role ? $role->name : 'Member');
              $ws->user_role_slug = $isOwner ? 'owner' : ($role ? $role->slug : 'member');
              $ws->role = (object)['name' => $ws->user_role, 'slug' => $ws->user_role_slug];
              return $ws;
            });
        },
        'roles' => fn() => Role::all(),
        'current_workspace' => function () use ($request) {
          // Force fresh user to avoid stale state in Octane/Swoole
          $user = $request->user() ? $request->user()->fresh() : null;
          if (!$user)
            return null;

          $currentWorkspace = null;
          if ($user->current_workspace_id) {
            $currentWorkspace = $user->workspaces()
              ->where('workspaces.id', $user->current_workspace_id)
              ->withCount('users')
              ->with([
                'users' => function ($query) use ($user) {
                  $query->where('users.id', $user->id)
                    ->select('users.id', 'users.name', 'users.email', 'users.photo_url')
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
                'users' => function ($query) use ($user) {
                  $query->where('users.id', $user->id)
                    ->select('users.id', 'users.name', 'users.email', 'users.photo_url')
                    ->withPivot('role_id', 'created_at');
                },
                'creator:id,name,email'
              ])
              ->first();

            if ($firstWorkspace) {
              $currentWorkspace = $firstWorkspace;
              $user->current_workspace_id = $firstWorkspace->id;
              $user->save();
            }
          }

          if ($currentWorkspace) {
            $roles = Role::all();
            $currentUser = $currentWorkspace->users->first(); // Since we filtered by ID, the first one is the current user
            $roleId = $currentUser ? $currentUser->pivot->role_id : null;
            $role = $roles->find($roleId);
            $isOwner = ((int)$currentWorkspace->created_by === (int)$user->id) || ($role && $role->slug === 'owner');
            $currentWorkspace->user_role = $isOwner ? 'Owner' : ($role ? $role->name : 'Member');
            $currentWorkspace->user_role_slug = $isOwner ? 'owner' : ($role ? $role->slug : 'member');

            if ($isOwner) {
              // Hardcoded permissions for Owner ensuring access even if DB is empty
              $currentWorkspace->permissions = [
                'publish',
                'approve',
                'view-analytics',
                'manage-accounts',
                'manage-team',
                'manage-content',
                'manage-campaigns'
              ];
            } else {
              $currentWorkspace->permissions = $role ? $role->permissions->pluck('slug')->toArray() : [];
            }
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

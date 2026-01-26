<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\Role;
use App\Services\AIService;

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
    $user = $request->user() ? $request->user()->fresh() : null;

    return array_merge(parent::share($request), [
      'auth' => [
        'user' => $user ? [
          'id' => $user->id,
          'name' => $user->name,
          'email' => $user->email,
          'email_verified_at' => $user->email_verified_at,
          'locale' => $user->locale ?? 'es',
          'created_at' => $user->created_at,
          'photo_url' => $user->photo_url,
          'theme' => $user->theme,
          'provider' => $user->provider,
          'phone' => $user->phone,
          'bio' => $user->bio,
          'country_code' => $user->country_code,
          'global_platform_settings' => $user->global_platform_settings ?? [],
          'ai_settings' => $user->ai_settings ?? [],
          'current_workspace_id' => $user->current_workspace_id,
        ] : null,
        'workspaces' => function () use ($user) {
          try {
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
          } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Inertia Workspaces Share Error: ' . $e->getMessage());
            return [];
          }
        },
        'roles' => fn() => Role::all(),
        'current_workspace' => function () use ($request) {
          try {
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
                  'content',
                  'manage-campaigns'
                ];
              } else {
                $currentWorkspace->permissions = $role ? $role->permissions->pluck('slug')->toArray() : [];
              }
            }

            return $currentWorkspace;
          } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Inertia Current Workspace Share Error: ' . $e->getMessage());
            return null;
          }
        },
      ],
      'flash' => [
        'message' => fn() => $request->session()->get('message')
      ],
      'ziggy' => fn() => [
        ...(new Ziggy)->toArray(),
        'location' => $request->url(),
      ],
      'ai_enabled' => fn() => app(AIService::class)->isAiEnabled(),
    ]);
  }
}

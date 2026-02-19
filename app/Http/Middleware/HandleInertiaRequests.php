<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

use Illuminate\Support\Facades\Log;

use App\Models\Role\Role;
use App\Models\PublicationTemplate;

use App\Services\AIService;
use App\Services\OnboardingService;

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
          'theme_color' => $user->theme_color,
          'is_super_admin' => $user->is_super_admin,
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
            Log::error('Inertia Workspaces Share Error: ' . $e->getMessage());
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
                  'manage-content',
                  'manage-campaigns',
                  'view-content'
                ];
              } else {
                $currentWorkspace->permissions = $role ? $role->permissions->pluck('slug')->toArray() : [];
              }
            }

            return $currentWorkspace;
          } catch (\Exception $e) {
            Log::error('Inertia Current Workspace Share Error: ' . $e->getMessage());
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
      
      // Onboarding data
      'onboarding' => function () use ($request) {
        try {
          $user = $request->user();
          if (!$user) {
            return null;
          }

          $onboardingService = app(OnboardingService::class);
          $state = $onboardingService->getOnboardingState($user);
          
          // Only return onboarding data if not complete
          if ($state->completed_at) {
            return null;
          }

          return [
            'tourCompleted' => $state->tour_completed,
            'tourSkipped' => $state->tour_skipped,
            'tourCurrentStep' => $state->tour_current_step,
            'tourCompletedSteps' => $state->tour_completed_steps ?? [],
            'wizardCompleted' => $state->wizard_completed,
            'wizardSkipped' => $state->wizard_skipped,
            'wizardCurrentStep' => $state->wizard_current_step,
            'templateSelected' => $state->template_selected,
            'templateId' => $state->template_id,
            'dismissedTooltips' => $state->dismissed_tooltips ?? [],
            'completedAt' => $state->completed_at?->toIso8601String(),
            'startedAt' => $state->started_at?->toIso8601String(),
            'completionPercentage' => $state->getCompletionPercentage(),
          ];
        } catch (\Exception $e) {
          Log::error('Inertia Onboarding Share Error: ' . $e->getMessage());
          return null;
        }
      },
      
      'tourSteps' => function () use ($request) {
        try {
          $user = $request->user();
          if (!$user) {
            return null;
          }

          // Return tour steps configuration
          return [
            [
              'id' => 'step-1',
              'title' => 'Welcome to ContentFlow',
              'description' => "Let's take a quick tour of the platform. We'll show you the key features to help you get started with social media management.",
              'targetSelector' => '#dashboard',
              'position' => 'bottom',
              'highlightPadding' => 8,
            ],
            [
              'id' => 'step-2',
              'title' => 'Navigation Sidebar',
              'description' => 'Use the sidebar to navigate between different sections: Dashboard, Publications, Calendar, Analytics, and more.',
              'targetSelector' => 'aside nav',
              'position' => 'right',
              'highlightPadding' => 8,
            ],
            [
              'id' => 'step-3',
              'title' => 'Create Publications',
              'description' => 'Click here to create new social media posts. You can schedule them for multiple platforms at once.',
              'targetSelector' => '[href*="publications/create"]',
              'position' => 'right',
              'highlightPadding' => 8,
            ],
            [
              'id' => 'step-4',
              'title' => 'Calendar View',
              'description' => 'View and manage all your scheduled posts in a calendar format. Drag and drop to reschedule.',
              'targetSelector' => '[href*="calendar"]',
              'position' => 'right',
              'highlightPadding' => 8,
            ],
            [
              'id' => 'step-5',
              'title' => 'Analytics Dashboard',
              'description' => 'Track your social media performance with detailed analytics and insights across all connected platforms.',
              'targetSelector' => '[href*="analytics"]',
              'position' => 'right',
              'highlightPadding' => 8,
            ],
          ];
        } catch (\Exception $e) {
          Log::error('Inertia Tour Steps Share Error: ' . $e->getMessage());
          return null;
        }
      },
      
      'availablePlatforms' => function () use ($request) {
        try {
          $user = $request->user();
          if (!$user) {
            return null;
          }

          // Return available social platforms
          return [
            [
              'id' => 'facebook',
              'name' => 'Facebook',
              'icon' => 'facebook',
              'color' => '#1877F2',
              'description' => 'Connect your Facebook pages and groups',
            ],
            [
              'id' => 'twitter',
              'name' => 'Twitter',
              'icon' => 'twitter',
              'color' => '#1DA1F2',
              'description' => 'Share updates with your Twitter followers',
            ],
            [
              'id' => 'instagram',
              'name' => 'Instagram',
              'icon' => 'instagram',
              'color' => '#E4405F',
              'description' => 'Post photos and stories to Instagram',
            ],
            [
              'id' => 'linkedin',
              'name' => 'LinkedIn',
              'icon' => 'linkedin',
              'color' => '#0A66C2',
              'description' => 'Share professional content on LinkedIn',
            ],
          ];
        } catch (\Exception $e) {
          Log::error('Inertia Available Platforms Share Error: ' . $e->getMessage());
          return null;
        }
      },
      
      'connectedAccounts' => function () use ($request) {
        try {
          $user = $request->user();
          if (!$user) {
            return null;
          }

          // Get connected social accounts for current workspace
          $currentWorkspace = $user->workspaces()
            ->where('workspaces.id', $user->current_workspace_id)
            ->first();

          if (!$currentWorkspace) {
            return [];
          }

          return $currentWorkspace->socialAccounts()
            ->select('platform', 'account_name')
            ->get()
            ->toArray();
        } catch (\Exception $e) {
          Log::error('Inertia Connected Accounts Share Error: ' . $e->getMessage());
          return [];
        }
      },
      
      'templates' => function () use ($request) {
        try {
          $user = $request->user();
          if (!$user) {
            return null;
          }

          // Get active publication templates
          return PublicationTemplate::where('is_active', true)
            ->select('id', 'name', 'description', 'category', 'preview_image', 'content')
            ->get()
            ->map(function ($template) {
              return [
                'id' => (string) $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'category' => $template->category,
                'previewImage' => $template->preview_image,
                'content' => $template->content,
              ];
            })
            ->toArray();
        } catch (\Exception $e) {
          Log::error('Inertia Templates Share Error: ' . $e->getMessage());
          return [];
        }
      },
    ]);
  }
}

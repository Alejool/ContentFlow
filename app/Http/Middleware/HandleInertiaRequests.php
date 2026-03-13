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
use App\Services\SystemConfigService;
use App\Services\PlanFilterService;

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
          'timezone' => $user->timezone ?? 'UTC',
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
                $ws->timezone = $ws->timezone ?? 'UTC';
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
            
            Log::info('Current Workspace Debug', [
              'user_id' => $user?->id,
              'current_workspace_id' => $user?->current_workspace_id,
              'has_user' => !is_null($user)
            ]);
            
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
                      ->withPivot('role_id', 'assigned_by', 'assigned_at', 'created_at', 'updated_at');
                  },
                  'creator:id,name,email'
                ])
                ->first();
                
              Log::info('Current Workspace Found', [
                'workspace_id' => $currentWorkspace?->id,
                'workspace_name' => $currentWorkspace?->name
              ]);
            }

            if (!$currentWorkspace) {
              $firstWorkspace = $user->workspaces()
                ->withCount('users')
                ->with([
                  'users' => function ($query) use ($user) {
                    $query->where('users.id', $user->id)
                      ->select('users.id', 'users.name', 'users.email', 'users.photo_url')
                      ->withPivot('role_id', 'assigned_by', 'assigned_at', 'created_at', 'updated_at');
                  },
                  'creator:id,name,email'
                ])
                ->first();

              Log::info('First Workspace Fallback', [
                'first_workspace_id' => $firstWorkspace?->id,
                'first_workspace_name' => $firstWorkspace?->name
              ]);

              if ($firstWorkspace) {
                $currentWorkspace = $firstWorkspace;
                $user->current_workspace_id = $firstWorkspace->id;
                $user->save();
                
                Log::info('Updated user current_workspace_id', [
                  'user_id' => $user->id,
                  'new_current_workspace_id' => $firstWorkspace->id
                ]);
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

              $currentWorkspace->plan = $currentWorkspace->getPlanName();
              $currentWorkspace->features = $currentWorkspace->getPlanFeatures();
              
              // ✅ AGREGAR TIMEZONE DEL WORKSPACE
              $currentWorkspace->timezone = $currentWorkspace->timezone ?? 'UTC';
              
              // ✅ AGREGAR INFORMACIÓN DEL WORKFLOW DE APROBACIÓN
              $workflow = $currentWorkspace->approvalWorkflow()->with(['levels.role'])->first();
              if ($workflow && $workflow->is_enabled) {
                $currentWorkspace->approval_workflow = [
                  'id' => $workflow->id,
                  'name' => $workflow->name ?? 'Flujo de Aprobación',
                  'is_enabled' => true,
                  'is_multi_level' => $workflow->is_multi_level,
                  'levels' => $workflow->levels->map(function($level) {
                    return [
                      'id' => $level->id,
                      'level_number' => $level->level_number,
                      'level_name' => $level->level_name,
                      'role' => $level->role ? [
                        'id' => $level->role->id,
                        'name' => $level->role->name,
                        'slug' => $level->role->slug,
                      ] : null,
                    ];
                  })->toArray(),
                ];
              } else {
                $currentWorkspace->approval_workflow = null;
              }
              
              Log::info('Current Workspace Final', [
                'id' => $currentWorkspace->id,
                'name' => $currentWorkspace->name,
                'role' => $currentWorkspace->user_role
              ]);
            } else {
              Log::warning('No current workspace found for user', [
                'user_id' => $user->id,
                'user_email' => $user->email
              ]);
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

      // System configuration - shared globally
      'systemFeatures' => function () {
        try {
          $systemConfig = app(SystemConfigService::class);
          return [
            'ai' => $systemConfig->isFeatureEnabled('ai'),
            'analytics' => $systemConfig->isFeatureEnabled('analytics'),
            'reels' => $systemConfig->isFeatureEnabled('reels'),
            'approval_workflows' => $systemConfig->isFeatureEnabled('approval_workflows'),
            'calendar_sync' => $systemConfig->isFeatureEnabled('calendar_sync'),
            'bulk_operations' => $systemConfig->isFeatureEnabled('bulk_operations'),
            'white_label' => $systemConfig->isFeatureEnabled('white_label'),
          ];
        } catch (\Exception $e) {
          Log::error('Inertia System Features Share Error: ' . $e->getMessage());
          return [
            'ai' => true,
            'analytics' => true,
            'reels' => true,
            'approval_workflows' => true,
            'calendar_sync' => true,
            'bulk_operations' => true,
            'white_label' => true,
          ];
        }
      },

      'systemAddons' => function () {
        try {
          $systemConfig = app(SystemConfigService::class);
          return [
            'ai_credits' => $systemConfig->isAddonAvailable('ai_credits'),
            'storage' => $systemConfig->isAddonAvailable('storage'),
            'team_members' => $systemConfig->isAddonAvailable('team_members'),
            'publications' => $systemConfig->isAddonAvailable('publications'),
          ];
        } catch (\Exception $e) {
          Log::error('Inertia System Addons Share Error: ' . $e->getMessage());
          return [
            'ai_credits' => true,
            'storage' => true,
            'team_members' => true,
            'publications' => true,
          ];
        }
      },

      'visibleUsageMetrics' => function () {
        try {
          $planFilter = app(PlanFilterService::class);
          return $planFilter->getVisibleUsageMetrics();
        } catch (\Exception $e) {
          Log::error('Inertia Visible Usage Metrics Share Error: ' . $e->getMessage());
          return [
            'publications' => true,
            'social_accounts' => true,
            'storage' => true,
            'ai_requests' => true,
            'team_members' => true,
          ];
        }
      },

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
            return [];
          }

          $onboardingService = app(OnboardingService::class);
          $state = $onboardingService->getOnboardingState($user);

          // Only return tour steps if onboarding is not complete
          if ($state->completed_at) {
            return [];
          }

          // Return tour steps configuration with navigation routes
          return [
            [
              'id' => 'step-1',
              'version' => '1.1', // Version to force cache refresh
              'title' => 'Welcome to ContentFlow',
              'description' => "Welcome! ContentFlow helps you manage and schedule social media content across multiple platforms. Let's take a quick tour of the key features.",
              'targetSelector' => 'main',
              'position' => 'bottom',
              'highlightPadding' => 8,
              'route' => '/dashboard',
            ],
            [
              'id' => 'step-2',
              'version' => '1.1',
              'title' => 'Navigation Menu',
              'description' => 'Use the sidebar to navigate between different sections: Dashboard, Publications, Calendar, Analytics, and more.',
              'targetSelector' => 'nav[aria-label="Main navigation"], aside, .lg\\:block.fixed',
              'position' => 'right',
              'highlightPadding' => 8,
              'route' => '/dashboard',
            ],
            [
              'id' => 'step-3',
              'version' => '2.0',
              'title' => 'Create Publications',
              'description' => 'Click here to create new social media posts. You can schedule them for multiple platforms at once.',
              'targetSelector' => '#create-publication',
              'position' => 'bottom',
              'highlightPadding' => 8,
              'route' => '/content',
            ],
            [
              'id' => 'step-4',
              'version' => '2.1',
              'title' => 'Calendar View',
              'description' => 'The Calendar gives you a visual overview of all your scheduled posts. You can drag and drop to reschedule posts.',
              'targetSelector' => '#calendar',
              'position' => 'bottom',
              'highlightPadding' => 8,
              'route' => '/content',
            ],
            [
              'id' => 'step-5',
              'version' => '1.1',
              'title' => 'Analytics Dashboard',
              'description' => 'Track your social media performance with detailed analytics. See engagement metrics, reach, and insights across all platforms.',
              'targetSelector' => 'a[href*="/analytics"], nav a[href="/analytics"], [class*="analytics"], [class*="chart"], main',
              'position' => 'bottom',
              'highlightPadding' => 8,
              'route' => '/analytics',
            ],
            [
              'id' => 'step-6',
              'title' => 'Ready to Start!',
              'description' => "Great! You've seen the main features. Now let's connect your social media accounts so you can start creating and publishing content.",
              'targetSelector' => 'main',
              'position' => 'bottom',
              'highlightPadding' => 8,
              'route' => '/dashboard',
            ],
          ];
        } catch (\Exception $e) {
          Log::error('Inertia Tour Steps Share Error: ' . $e->getMessage());
          return [];
        }
      },

      'availablePlatforms' => function () use ($request) {
        try {
          $user = $request->user();
          if (!$user) {
            return [];
          }

          $onboardingService = app(OnboardingService::class);
          $state = $onboardingService->getOnboardingState($user);

          // Only return platforms if onboarding is not complete
          if ($state->completed_at) {
            return [];
          }

          // Return empty array - frontend will use SOCIAL_PLATFORMS constant
          // which is synced with the active platforms configuration
          return [];
        } catch (\Exception $e) {
          Log::error('Inertia Available Platforms Share Error: ' . $e->getMessage());
          return [];
        }
      },

      'connectedAccounts' => function () use ($request) {
        try {
          $user = $request->user();
          if (!$user) {
            return [];
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
            return [];
          }

          $onboardingService = app(OnboardingService::class);
          $state = $onboardingService->getOnboardingState($user);

          // Only return templates if onboarding is not complete
          if ($state->completed_at) {
            return [];
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

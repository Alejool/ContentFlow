<?php

namespace App\Services;

use App\Models\Role\Role;
use App\Models\Permission\Permission;
use App\Models\User;
use App\Models\Workspace\Workspace;
use App\DTOs\WorkspaceMigrationResult;
use App\DTOs\MigrationReport;
use App\Notifications\RoleMigrationNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RoleMigrationService
{
    public function __construct(
        private RoleService $roleService
    ) {}

    /**
     * Analyze legacy role and determine target role
     * 
     * This method analyzes a role's permissions and maps it to one of the four
     * predefined roles (Owner, Admin, Editor, Viewer) based on the mapping rules:
     * - Roles with Publish_Content permission → Admin
     * - Roles with Create_Content or Manage_Content (but not Publish_Content) → Editor
     * - Roles with only View_Content → Viewer
     * 
     * @param Role $legacyRole The legacy role to analyze
     * 
     * @return string The target role name (owner, admin, editor, or viewer)
     */
    public function analyzeLegacyRole(Role $legacyRole): string
    {
        // Load permissions for the role
        $permissions = $legacyRole->permissions()->pluck('name')->toArray();

        // Check for Publish_Content permission → Admin
        if (in_array(Permission::PUBLISH_CONTENT, $permissions)) {
            return Role::ADMIN;
        }

        // Check for Create_Content or Manage_Content (but not Publish_Content) → Editor
        if (in_array(Permission::CREATE_CONTENT, $permissions) || 
            in_array(Permission::MANAGE_CONTENT, $permissions)) {
            return Role::EDITOR;
        }

        // Check for View_Content only → Viewer
        if (in_array(Permission::VIEW_CONTENT, $permissions)) {
            return Role::VIEWER;
        }

        // Default to Viewer if no permissions match
        return Role::VIEWER;
    }

    /**
     * Migrate a single workspace
     * 
     * This method migrates all users with legacy roles in a workspace to the new
     * simplified role structure. It analyzes each user's current role, determines
     * the appropriate new role, and creates audit records.
     * 
     * @param Workspace $workspace The workspace to migrate
     * 
     * @return WorkspaceMigrationResult The migration result with statistics
     */
    public function migrateWorkspace(Workspace $workspace): WorkspaceMigrationResult
    {
        try {
            $usersAffected = 0;
            $roleMappings = [];
            $userMigrations = [];

            // Get all users with roles in this workspace
            $userRoles = DB::table('role_user')
                ->where('workspace_id', $workspace->id)
                ->get();

            // Get predefined role IDs for quick lookup
            $predefinedRoleIds = Role::whereIn('name', [
                Role::OWNER,
                Role::ADMIN,
                Role::EDITOR,
                Role::VIEWER
            ])->pluck('id')->toArray();

            DB::transaction(function () use (
                $workspace,
                $userRoles,
                $predefinedRoleIds,
                &$usersAffected,
                &$roleMappings,
                &$userMigrations
            ) {
                foreach ($userRoles as $userRole) {
                    // Skip if user already has a predefined role
                    if (in_array($userRole->role_id, $predefinedRoleIds)) {
                        continue;
                    }

                    // Get the legacy role
                    $legacyRole = Role::with('permissions')->find($userRole->role_id);
                    
                    if (!$legacyRole) {
                        continue;
                    }

                    // Analyze the legacy role to determine target role
                    $targetRoleName = $this->analyzeLegacyRole($legacyRole);
                    $targetRole = Role::where('name', $targetRoleName)->first();

                    if (!$targetRole) {
                        Log::error("Target role '{$targetRoleName}' not found during migration");
                        continue;
                    }

                    // Get the user
                    $user = User::find($userRole->user_id);
                    
                    if (!$user) {
                        continue;
                    }

                    // Update the user's role assignment
                    DB::table('role_user')
                        ->where('id', $userRole->id)
                        ->update([
                            'role_id' => $targetRole->id,
                            'assigned_at' => now(),
                        ]);

                    // Track the migration
                    $usersAffected++;
                    
                    // Track role mappings
                    if (!isset($roleMappings[$legacyRole->name])) {
                        $roleMappings[$legacyRole->name] = $targetRoleName;
                    }

                    // Track user migrations
                    $userMigrations[] = [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'old_role' => $legacyRole->name,
                        'new_role' => $targetRoleName,
                    ];

                    // Create legacy_role_migrations record for audit
                    // Check if this legacy role has already been logged for this workspace
                    $existingMigration = DB::table('legacy_role_migrations')
                        ->where('workspace_id', $workspace->id)
                        ->where('legacy_role_name', $legacyRole->name)
                        ->first();

                    if (!$existingMigration) {
                        DB::table('legacy_role_migrations')->insert([
                            'workspace_id' => $workspace->id,
                            'legacy_role_name' => $legacyRole->name,
                            'legacy_permissions' => json_encode(
                                $legacyRole->permissions->pluck('name')->toArray()
                            ),
                            'mapped_to_role' => $targetRoleName,
                            'affected_user_count' => 1,
                            'migrated_at' => now(),
                        ]);
                    } else {
                        // Update the affected user count
                        DB::table('legacy_role_migrations')
                            ->where('id', $existingMigration->id)
                            ->increment('affected_user_count');
                    }

                    // Clear permission cache for the user
                    $this->clearUserPermissionCache($user, $workspace);
                }
            });

            return new WorkspaceMigrationResult(
                workspaceId: $workspace->id,
                workspaceName: $workspace->name,
                usersAffected: $usersAffected,
                roleMappings: $roleMappings,
                userMigrations: $userMigrations,
                success: true
            );

        } catch (\Exception $e) {
            Log::error("Workspace migration failed for workspace {$workspace->id}: " . $e->getMessage());
            
            return new WorkspaceMigrationResult(
                workspaceId: $workspace->id,
                workspaceName: $workspace->name,
                usersAffected: 0,
                roleMappings: [],
                userMigrations: [],
                success: false,
                error: $e->getMessage()
            );
        }
    }

    /**
     * Execute migration for all workspaces
     * 
     * This method iterates through all workspaces and migrates their users
     * from legacy roles to the new simplified structure. It collects results
     * and errors for reporting.
     * 
     * @return MigrationReport The aggregated migration report
     */
    public function migrateAllWorkspaces(): MigrationReport
    {
        $totalWorkspaces = 0;
        $totalUsersAffected = 0;
        $roleMapping = [];
        $errors = [];

        // Get all workspaces
        $workspaces = Workspace::all();

        foreach ($workspaces as $workspace) {
            $totalWorkspaces++;
            
            $result = $this->migrateWorkspace($workspace);

            if ($result->success) {
                $totalUsersAffected += $result->usersAffected;

                // Aggregate role mappings
                foreach ($result->roleMappings as $legacyRole => $newRole) {
                    if (!isset($roleMapping[$legacyRole])) {
                        $roleMapping[$legacyRole] = [
                            'new_role' => $newRole,
                            'count' => 0,
                        ];
                    }
                    $roleMapping[$legacyRole]['count'] += count(
                        array_filter($result->userMigrations, fn($m) => $m['old_role'] === $legacyRole)
                    );
                }
            } else {
                $errors[] = [
                    'workspace_id' => $workspace->id,
                    'workspace_name' => $workspace->name,
                    'error' => $result->error,
                ];
            }
        }

        return new MigrationReport(
            totalWorkspaces: $totalWorkspaces,
            totalUsersAffected: $totalUsersAffected,
            roleMapping: $roleMapping,
            errors: $errors,
            completedAt: Carbon::now()
        );
    }

    /**
     * Archive legacy role definitions
     * 
     * This method exports legacy role definitions to JSON and stores them
     * in the legacy_role_migrations table. It also marks legacy roles as
     * archived in the database (if an 'archived' column exists).
     * 
     * @return void
     */
    public function archiveLegacyRoles(): void
    {
        // Get predefined role IDs
        $predefinedRoleIds = Role::whereIn('name', [
            Role::OWNER,
            Role::ADMIN,
            Role::EDITOR,
            Role::VIEWER
        ])->pluck('id')->toArray();

        // Get all legacy roles (roles that are not predefined)
        $legacyRoles = Role::with('permissions')
            ->whereNotIn('id', $predefinedRoleIds)
            ->get();

        foreach ($legacyRoles as $legacyRole) {
            // Export role definition to JSON
            $roleDefinition = [
                'name' => $legacyRole->name,
                'display_name' => $legacyRole->display_name,
                'description' => $legacyRole->description,
                'permissions' => $legacyRole->permissions->pluck('name')->toArray(),
                'approval_participant' => $legacyRole->approval_participant,
                'archived_at' => now()->toIso8601String(),
            ];

            // Store in legacy_role_migrations table for each workspace that used this role
            $workspaceIds = DB::table('role_user')
                ->where('role_id', $legacyRole->id)
                ->distinct()
                ->pluck('workspace_id');

            foreach ($workspaceIds as $workspaceId) {
                // Check if already archived
                $exists = DB::table('legacy_role_migrations')
                    ->where('workspace_id', $workspaceId)
                    ->where('legacy_role_name', $legacyRole->name)
                    ->exists();

                if (!$exists) {
                    // Determine mapped role
                    $mappedRole = $this->analyzeLegacyRole($legacyRole);
                    
                    // Count affected users
                    $affectedUserCount = DB::table('role_user')
                        ->where('workspace_id', $workspaceId)
                        ->where('role_id', $legacyRole->id)
                        ->count();

                    DB::table('legacy_role_migrations')->insert([
                        'workspace_id' => $workspaceId,
                        'legacy_role_name' => $legacyRole->name,
                        'legacy_permissions' => json_encode($roleDefinition),
                        'mapped_to_role' => $mappedRole,
                        'affected_user_count' => $affectedUserCount,
                        'migrated_at' => now(),
                    ]);
                }
            }

            // Mark role as archived if column exists
            // Note: This assumes an 'archived' or 'is_archived' column might exist
            // If not, we can skip this step or soft-delete the role
            if (DB::getSchemaBuilder()->hasColumn('roles', 'is_archived')) {
                $legacyRole->update(['is_archived' => true]);
            }

            Log::info("Archived legacy role: {$legacyRole->name}");
        }
    }

    /**
     * Send migration notifications to affected users
     * 
     * This method queues notification emails for all affected users,
     * informing them about their role changes with explanations.
     * 
     * @param WorkspaceMigrationResult $result The migration result
     * 
     * @return void
     */
    public function notifyAffectedUsers(WorkspaceMigrationResult $result): void
    {
        if (!$result->success || empty($result->userMigrations)) {
            return;
        }

        foreach ($result->userMigrations as $migration) {
            $user = User::find($migration['user_id']);
            
            if (!$user) {
                continue;
            }

            // Queue notification email
            try {
                $user->notify(new RoleMigrationNotification(
                    workspaceName: $result->workspaceName,
                    oldRole: $migration['old_role'],
                    newRole: $migration['new_role'],
                    explanation: $this->getRoleChangeExplanation($migration['old_role'], $migration['new_role'])
                ));

                Log::info("Queued role migration notification for user {$user->id} in workspace {$result->workspaceId}");
            } catch (\Exception $e) {
                Log::error("Failed to queue notification for user {$user->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Get explanation for role change
     * 
     * @param string $oldRole The old role name
     * @param string $newRole The new role name
     * 
     * @return string The explanation text
     */
    private function getRoleChangeExplanation(string $oldRole, string $newRole): string
    {
        $explanations = [
            Role::ADMIN => 'Your new Admin role gives you full workspace management capabilities, including the ability to publish content and manage team members.',
            Role::EDITOR => 'Your new Editor role allows you to create and manage content. You can submit content for approval but cannot publish directly.',
            Role::VIEWER => 'Your new Viewer role allows you to view content without modification rights. This ensures content integrity while keeping you informed.',
        ];

        $explanation = $explanations[$newRole] ?? 'Your role has been updated to align with our simplified role structure.';

        return "Your role has been migrated from '{$oldRole}' to '{$newRole}'. {$explanation}";
    }

    /**
     * Clear user permission cache
     * 
     * @param User $user
     * @param Workspace $workspace
     * 
     * @return void
     */
    private function clearUserPermissionCache(User $user, Workspace $workspace): void
    {
        // This mirrors the cache clearing logic from RoleService
        $allPermissionsKey = "permissions:user:{$user->id}:workspace:{$workspace->id}";
        \Illuminate\Support\Facades\Redis::del($allPermissionsKey);

        // Clear individual permission caches
        $permissions = [
            Permission::VIEW_CONTENT,
            Permission::CREATE_CONTENT,
            Permission::MANAGE_CONTENT,
            Permission::PUBLISH_CONTENT,
            Permission::MANAGE_WORKSPACE,
        ];

        foreach ($permissions as $permission) {
            $key = "permission:user:{$user->id}:workspace:{$workspace->id}:permission:{$permission}";
            \Illuminate\Support\Facades\Redis::del($key);
        }
    }
}


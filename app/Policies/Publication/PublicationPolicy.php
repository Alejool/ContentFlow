<?php

namespace App\Policies\Publication;

use App\Models\Auth\Permission;
use App\Models\User;
use App\Models\Publications\Publication;
use App\Models\Workspace\Workspace;
use App\Models\Auth\Role;
use App\Services\Roles\RoleService;
use App\Services\Approval\ApprovalWorkflowService;
use Illuminate\Support\Facades\DB;

class PublicationPolicy
{
    public function __construct(
        private RoleService $roleService,
        private ApprovalWorkflowService $approvalWorkflowService
    ) {}

    /**
     * Determine if the user can submit content for approval.
     * 
     * Rule: Anyone with 'manage-content' OR 'publish' permission can submit for approval.
     * - manage-content: Editors can create and submit content
     * - publish: Publishers/Admins can also submit content
     */
    public function submitForApproval(User $user, Publication $publication): bool
    {

        
        $workspace = $publication->workspace;

        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            \Log::warning('submitForApproval: User has no role in workspace', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
            ]);
            return false;
        }

        \Log::info('submitForApproval: Checking permissions for user', [
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
            'role' => $userRole->slug,
        ]);

        // Usuarios con 'manage-content' O 'publish' pueden enviar a revisión
        // Owner, Admin y roles híbridos como admin-owner siempre pueden
        $isAdminOrOwner = in_array($userRole->slug, [Role::OWNER, Role::ADMIN, 'admin-owner']);
        $hasManageContent = $this->roleService->userHasPermission($user, $workspace, 'manage-content');
        $hasPublishPermission = $this->roleService->userHasPermission($user, $workspace, 'publish');
        $hasSubmitApprovalPermission = $this->roleService->userHasPermission($user, $workspace, Permission::SUBMIT_FOR_APPROVAL);
        
        if (!$isAdminOrOwner && !$hasManageContent && !$hasPublishPermission && !$hasSubmitApprovalPermission) {
            \Log::warning('submitForApproval: User lacks required permission to submit for approval', [
                'user_id' => $user->id,
                'workspace_id' => $workspace->id,
                'role' => $userRole->slug,
                'has_manage_content' => $hasManageContent,
                'has_publish' => $hasPublishPermission,
                'has_submit_for_approval' => $hasSubmitApprovalPermission,
            ]);
            return false;
        }

        // Check if content is in a valid status for submission
        if (!in_array($publication->status, ['draft', 'rejected', 'failed'])) {
            \Log::warning('submitForApproval: Invalid publication status', [
                'publication_id' => $publication->id,
                'status' => $publication->status,
            ]);
            return false;
        }

        \Log::info('submitForApproval: User can submit for approval', [
            'user_id' => $user->id,
            'publication_id' => $publication->id,
            'workspace_id' => $workspace->id,
            'role' => $userRole->slug,
            'has_manage_content' => $hasManageContent,
            'has_publish' => $hasPublishPermission,
            'is_admin_or_owner' => $isAdminOrOwner,
        ]);

        return true;
    }

    /**
     * Determine if the user can approve content.
     * 
     * Requirements: 5.4, 7.3
     * - Content must be in pending_review status
     * - For simple workflow: user must have publish_content permission
     * - For multi-level workflow: user must have the role required for current level
     * - Owner can always approve
     */
    public function approve(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // Content must be pending review
        if ($publication->status !== 'pending_review') {
            return false;
        }

        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return false;
        }

        // Owner can always approve
        if ($userRole->slug === Role::OWNER) {
            return true;
        }

        // Get approval workflow
        $workflow = $workspace->approvalWorkflow;
        
        if (!$workflow || !$workflow->is_active) {
            return false;
        }

        // For simple workflow, check publish permission
        if ($workflow->isSimpleWorkflow()) {
            return $this->roleService->userHasPermission($user, $workspace, 'publish');
        }

        // For multi-level workflow, check if user has the required role for current level
        $currentLevel = $workflow->getLevelByNumber($publication->current_approval_level);
        
        if (!$currentLevel) {
            return false;
        }

        // Check if assigned to specific user
        if ($currentLevel->user_id && $user->id === $currentLevel->user_id) {
            return true;
        }

        // Check if assigned to specific users via pivot table
        if ($currentLevel->users()->where('users.id', $user->id)->exists()) {
            return true;
        }

        // Check if assigned to role
        if ($currentLevel->role_id && $userRole->id === $currentLevel->role_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can reject content.
     * 
     * Requirements: 5.5, 7.5
     * - Same rules as approve
     */
    public function reject(User $user, Publication $publication): bool
    {
        return $this->approve($user, $publication);
    }

    /**
     * Determine if the user can publish content.
     *
     * REGLAS:
     * 1. Owner / Admin / admin-owner → bypass total, siempre pueden publicar.
     * 2. Plan SIN soporte de workflows (approval_workflows = false):
     *    → El rol puede publicar si tiene el permiso 'publish'. No hay workflow que bloquee.
     * 3. Plan CON soporte de workflows PERO sin workflow activo en el workspace:
     *    → Igual que caso 2: el rol puede publicar si tiene el permiso 'publish'.
     * 4. Plan CON soporte de workflows Y workflow activo:
     *    → Nadie más que Owner/Admin puede publicar directamente.
     *    → Retorna false. El controller detecta este caso y muestra mensaje informativo
     *      (no es un error de permisos, es una restricción del flujo).
     */
    public function publish(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        if (!$workspace) {
            \Log::warning('PublicationPolicy::publish - Workspace not found', [
                'user_id'        => $user->id,
                'publication_id' => $publication->id,
            ]);
            return false;
        }

        $userRole = $this->getUserRoleInWorkspace($user, $workspace);

        \Log::info('PublicationPolicy::publish', [
            'user_id'            => $user->id,
            'publication_id'     => $publication->id,
            'workspace_id'       => $workspace->id,
            'role_slug'          => $userRole?->slug ?? 'NULL',
            'publication_status' => $publication->status,
        ]);

        if (!$userRole) {
            \Log::warning('PublicationPolicy::publish - No role found', [
                'user_id'      => $user->id,
                'workspace_id' => $workspace->id,
            ]);
            return false;
        }

        // ── Regla 1: Owner / Admin siempre pueden publicar ────────────────────
        if (in_array($userRole->slug, [Role::OWNER, Role::ADMIN, 'admin-owner'])) {
            \Log::info('PublicationPolicy::publish - Owner/Admin bypass granted', [
                'role' => $userRole->slug,
            ]);
            return true;
        }

        // ── Verificar permiso 'publish' del rol ───────────────────────────────
        // Si el rol tiene este permiso, puede publicar directo siempre,
        // independientemente de si hay workflow activo o no.
        $hasPublishPermission = $this->roleService->userHasPermission(
            $user,
            $workspace,
            Permission::PUBLISH_CONTENT_SLUG
        );

        if ($hasPublishPermission) {
            \Log::info('PublicationPolicy::publish - Role has publish permission, granting', [
                'role' => $userRole->slug,
            ]);
            return true;
        }

        // ── El rol NO tiene permiso 'publish': verificar si hay workflow activo ─
        // Solo en ese caso se bloquea con mensaje de "envía a revisión".
        $planFeatures         = $workspace->getPlanFeatures();
        $planSupportsWorkflow = ($planFeatures['approval_workflows'] ?? false) !== false;

        $workflow       = $workspace->approvalWorkflow;
        $workflowActive = $planSupportsWorkflow
            && $workflow
            && $workflow->is_enabled
            && $workflow->is_active;

        \Log::info('PublicationPolicy::publish - No publish permission, checking workflow', [
            'role'                   => $userRole->slug,
            'plan_supports_workflow' => $planSupportsWorkflow,
            'workflow_active'        => $workflowActive,
        ]);

        // Hay workflow activo y el rol no puede publicar directo → debe ir a revisión
        // Retorna false; el controller mostrará el mensaje informativo correcto.
        if ($workflowActive) {
            return false;
        }

        // Sin workflow activo y sin permiso → denegado
        return false;
    }

    /**
     * Determine if the user can view the publication.
     */
    public function view(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;
        
        return $this->roleService->userHasPermission($user, $workspace, 'view-content');
    }

    /**
     * Determine if the user can update the publication.
     */
    public function update(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // User must have manage-content permission or be the creator
        if ($publication->user_id === $user->id) {
            return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
        }

        return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
    }

    /**
     * Determine if the user can delete the publication.
     */
    public function delete(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // User must have manage-content permission or be the creator
        if ($publication->user_id === $user->id) {
            return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
        }

        return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
    }

    /**
     * Determine if the user can create publications.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        return $this->roleService->userHasPermission($user, $workspace, 'manage-content');
    }

    /**
     * Determine if the user can manually resolve approval state.
     * 
     * Requirements: 11.7, 8.6
     * - User must be Admin or Owner
     * - This is for emergency resolution when approval workflow is stuck
     */
    public function manualResolve(User $user, Publication $publication): bool
    {
        $workspace = $publication->workspace;

        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return false;
        }

        // Only Admin, Owner and hybrid admin-owner can manually resolve
        return in_array($userRole->slug, [Role::ADMIN, Role::OWNER, 'admin-owner']);
    }

    /**
     * Determine if the user can bypass the approval workflow.
     * 
     * Only workspace owners can bypass approval workflow and publish directly.
     * 
     * @param User $user
     * @param Workspace $workspace
     * @return bool
     */
    public function canBypassApprovalWorkflow(User $user, Workspace $workspace): bool
    {
        // Get user's role in workspace
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);
        
        if (!$userRole) {
            return false;
        }

        // Owner-like roles can bypass the workflow
        return in_array($userRole->slug, [Role::OWNER, 'admin-owner']);
    }

    /**
     * Determine the appropriate action for a user when creating/editing content.
     * Returns 'publish' if user can publish directly, 'review' if must go through approval.
     *
     * CRITICAL RULES:
     * - Owner and Admin can ALWAYS publish directly, regardless of workflow state.
     * - All other roles must always send to review.
     *
     * @param User $user
     * @param Workspace $workspace
     * @return string 'publish' or 'review'
     */
    public function getPublicationAction(User $user, Workspace $workspace): string
    {
        $userRole = $this->getUserRoleInWorkspace($user, $workspace);

        if (!$userRole) {
            return 'review';
        }

        // Owner and Admin can always publish directly.
        if (in_array($userRole->slug, [Role::OWNER, Role::ADMIN, 'admin-owner'])) {
            return 'publish';
        }

        return 'review';
    }

    /**
     * Get the user's role in a workspace.
     *
     * Looks up the role via the role_user pivot table directly to avoid issues
     * with the Publication global scope or a stale current_workspace_id on the user.
     */
    private function getUserRoleInWorkspace(User $user, Workspace $workspace): ?Role
    {
        // Query the pivot table directly to avoid any global scope interference.
        $pivot = \Illuminate\Support\Facades\DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('workspace_id', $workspace->id)
            ->first();

        if ($pivot && $pivot->role_id) {
            $role = Role::find($pivot->role_id);
            if ($role) {
                return $role;
            }
        }

        // Fallback: if the user is the workspace creator, treat them as owner
        // even if no explicit pivot entry exists (legacy / auto-created workspaces).
        if ($workspace->created_by === $user->id) {
            return Role::where('slug', Role::OWNER)->first();
        }

        \Log::warning('PublicationPolicy::getUserRoleInWorkspace - No role found', [
            'user_id' => $user->id,
            'workspace_id' => $workspace->id,
        ]);

        return null;
    }
}

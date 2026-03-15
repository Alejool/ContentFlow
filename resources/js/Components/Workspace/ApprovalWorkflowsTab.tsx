import AlertCard from "@/Components/common/Modern/AlertCard";
import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import ConfirmDialog from "@/Components/common/ui/ConfirmDialog";
import axios from "axios";
import {
  CheckCircle,
  ChevronRight,
  Edit2,
  Plus,
  Save,
  Shield,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import CreateRoleModal from "./CreateRoleModal";
import InviteMemberModal from "./InviteMemberModal";

// @ts-ignore
declare global {
  function route(name: string, params?: any): string;
}

interface ApprovalStep {
  id?: number;
  name: string;
  role_id?: number | null;
  user_id?: number | null;
  step_order: number;
}

interface Workflow {
  id: number;
  name: string;
  is_active: boolean;
  steps: ApprovalStep[];
}

interface ApprovalWorkflowsTabProps {
  workspace: any;
  roles: any[];
  canManageWorkspace: boolean;
  hasAdvancedAccess?: boolean;
}

export default function ApprovalWorkflowsTab({
  workspace,
  roles: initialRoles,
  canManageWorkspace,
  hasAdvancedAccess = false,
}: ApprovalWorkflowsTabProps) {
  const { t } = useTranslation();

  // Get plan ID with multiple fallbacks
  const planId = (workspace.subscription?.plan || workspace.plan || "demo").toLowerCase();

  // Obtener características del plan desde el backend
  const planFeatures = workspace.features || {};
  const approvalWorkflowFeature = planFeatures.approval_workflows;

  // Determinar si tiene acceso a aprobaciones basado en el plan
  let hasBasicApprovalAccess = false;

  if (approvalWorkflowFeature !== undefined) {
    // Si tenemos features del backend, usarlas
    hasBasicApprovalAccess = approvalWorkflowFeature !== false;
  } else {
    // Fallback: usar lógica basada en planId
    hasBasicApprovalAccess = ["demo", "professional", "enterprise"].includes(planId);
  }

  // Determinar si tiene acceso avanzado (multinivel)
  let hasAdvancedApprovalAccess = false;

  if (approvalWorkflowFeature !== undefined) {
    hasAdvancedApprovalAccess = approvalWorkflowFeature === "advanced";
  } else {
    // Fallback: Enterprise tiene acceso avanzado, o usar prop
    hasAdvancedApprovalAccess = hasAdvancedAccess || planId === "enterprise";
  }

  // Debug: Log access level
  console.log("🔍 ApprovalWorkflowsTab Debug:", {
    hasAdvancedAccess,
    hasAdvancedApprovalAccess,
    planId,
    subscriptionPlan: workspace.subscription?.plan,
    subscriptionObject: workspace.subscription,
    directPlan: workspace.plan,
    workspaceFeatures: workspace.features,
    approvalWorkflowFeature,
    hasBasicApprovalAccess,
  });

  // Si no tiene acceso, mostrar mensaje de upgrade
  if (!hasBasicApprovalAccess) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-8 text-center dark:border-blue-800 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {t("common.approvals.upgrade.title")}
          </h3>
          <p className="mx-auto mb-6 max-w-2xl text-gray-600 dark:text-gray-400">
            {t("common.approvals.upgrade.description")}
          </p>

          <div className="mx-auto mb-6 max-w-md rounded-lg bg-white p-6 dark:bg-neutral-900">
            <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("common.approvals.upgrade.benefits_title") || "With approvals you get:"}
            </p>
            <ul className="space-y-2 text-left text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                {t("common.approvals.upgrade.benefits.custom_workflows")}
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                {t("common.approvals.upgrade.benefits.content_control")}
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                {t("common.approvals.upgrade.benefits.role_assignment")}
              </li>
              <li className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                {t("common.approvals.upgrade.benefits.approval_history")}
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              buttonStyle="solid"
              onClick={() => (window.location.href = route("pricing"))}
              icon={TrendingUp}
            >
              {t("common.view_plans")}
            </Button>
            <Button
              variant="secondary"
              buttonStyle="outline"
              onClick={() =>
                (window.location.href = route("workspaces.settings", {
                  workspace: workspace.slug,
                  tab: "overview",
                }))
              }
            >
              {t("common.back_to_settings")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [roles, setRoles] = useState(initialRoles);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<number | null>(null);

  // Filter roles that have "approve" permission
  const rolesWithApprovePermission = roles.filter((role: any) => {
    return role.permissions?.some(
      (permission: any) => permission.name === "approve" || permission.slug === "approve",
    );
  });

  // Filter users that have "approve" permission (either through their role or direct permission)
  const usersWithApprovePermission = (workspace.users || []).filter((user: any) => {
    // Check if user's role has approve permission
    const userRole = roles.find((role: any) => role.id === user.pivot?.role_id);
    if (
      userRole?.permissions?.some(
        (permission: any) => permission.name === "approve" || permission.slug === "approve",
      )
    ) {
      return true;
    }

    // Check if user has direct approve permission
    if (
      user.permissions?.some(
        (permission: any) => permission.name === "approve" || permission.slug === "approve",
      )
    ) {
      return true;
    }

    return false;
  });

  console.log("🔍 Filtrado de permisos:", {
    totalRoles: roles.length,
    rolesConApprove: rolesWithApprovePermission.length,
    totalUsuarios: workspace.users?.length || 0,
    usuariosConApprove: usersWithApprovePermission.length,
    rolesConApprove_lista: rolesWithApprovePermission.map((r: any) => r.name),
    usuariosConApprove_lista: usersWithApprovePermission.map((u: any) => u.name),
  });

  const fetchWorkflows = async () => {
    if (!workspace?.id) return;
    try {
      setIsLoading(true);
      const response = await axios.get(
        route("api.v1.workspaces.approval-workflows.index", workspace.id),
      );
      // Backend returns collections in 'data' key due to ApiResponse trait wrapping lists
      setWorkflows(response.data.data || []);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || t("common.unknown");
      toast.error(`${t("common.approvals.errors.fetch")}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [workspace.id]);

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(JSON.parse(JSON.stringify(workflow)));
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingWorkflow({
      id: 0,
      name: t("common.approvals.createFlow"),
      is_active: true,
      steps: [
        {
          name: `${t("common.approvals.level")} 1`,
          role_id: roles[0]?.id || null,
          user_id: null,
          step_order: 1,
        },
      ],
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingWorkflow) return;

    // Validation: Check for duplicate roles
    const roleIds = editingWorkflow.steps
      .map((s) => s.role_id)
      .filter((id) => id !== null && id !== undefined);
    const uniqueRoleIds = new Set(roleIds);
    if (roleIds.length !== uniqueRoleIds.size) {
      toast.error("No puedes asignar el mismo rol a múltiples niveles");
      return;
    }

    // Validation: Check for duplicate users
    const userIds = editingWorkflow.steps
      .map((s) => s.user_id)
      .filter((id) => id !== null && id !== undefined);
    const uniqueUserIds = new Set(userIds);
    if (userIds.length !== uniqueUserIds.size) {
      toast.error("No puedes asignar el mismo usuario a múltiples niveles");
      return;
    }

    // Validation: Each step must have either role_id or user_id
    const invalidSteps = editingWorkflow.steps.filter((s) => !s.role_id && !s.user_id);
    if (invalidSteps.length > 0) {
      toast.error("Cada nivel debe tener asignado un rol o usuario");
      return;
    }

    try {
      // Prepare steps ensuring all fields are present
      const preparedSteps = editingWorkflow.steps.map((step) => ({
        name: step.name,
        role_id: step.role_id || null,
        user_id: step.user_id || null,
        step_order: step.step_order,
        ...(step.id ? { id: step.id } : {}),
      }));

      // Automatically set is_multi_level based on number of steps
      const workflowToSave = {
        name: editingWorkflow.name,
        is_active: editingWorkflow.is_active,
        is_multi_level: editingWorkflow.steps.length > 1,
        steps: preparedSteps,
      };

      console.log("📤 Enviando workflow:", workflowToSave);

      if (editingWorkflow.id === 0) {
        await axios.post(
          route("api.v1.workspaces.approval-workflows.store", workspace.id),
          workflowToSave,
        );
        toast.success(t("common.approvals.success.created"));
      } else {
        await axios.put(
          route("api.v1.workspaces.approval-workflows.update", {
            idOrSlug: workspace.id,
            workflow: editingWorkflow.id,
          }),
          workflowToSave,
        );
        toast.success(t("common.approvals.success.updated"));
      }
      setIsEditing(false);
      fetchWorkflows();
    } catch (error: any) {
      console.error("❌ Error guardando workflow:", error.response?.data || error);
      toast.error(
        `${t("common.approvals.errors.save")}: ` + (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDelete = (id: number) => {
    setWorkflowToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!workflowToDelete) return;
    try {
      await axios.delete(
        route("api.v1.workspaces.approval-workflows.destroy", {
          idOrSlug: workspace.id,
          workflow: workflowToDelete,
        }),
      );
      toast.success(t("common.approvals.success.deleted"));
      fetchWorkflows();
    } catch (error: any) {
      toast.error(
        `${t("common.approvals.errors.delete")}: ` +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsDeleteModalOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const addStep = () => {
    // Verificar que el plan actual soporte multinivel
    if (!hasAdvancedApprovalAccess) {
      toast.error(
        t("common.approvals.errors.multiLevelEnterprise") ||
          "Los flujos multinivel solo están disponibles en el plan Enterprise",
      );
      return;
    }
    if (!editingWorkflow) return;
    const newSteps = [...editingWorkflow.steps];
    newSteps.push({
      name: `${t("common.approvals.level")} ${newSteps.length + 1}`,
      role_id: null,
      user_id: null,
      step_order: newSteps.length + 1,
    });
    setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
  };

  const removeStep = (index: number) => {
    if (!editingWorkflow) return;
    const newSteps = editingWorkflow.steps.filter((_, i) => i !== index);
    // Reorder
    newSteps.forEach((s, i) => (s.step_order = i + 1));
    setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
  };

  const handleRoleCreated = (newRole: any) => {
    setRoles([...roles, newRole]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isEditing && editingWorkflow) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col border-b border-gray-200 bg-gray-50 p-6 dark:border-neutral-800 dark:bg-neutral-800/50 md:flex-row md:items-center md:justify-between">
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingWorkflow.id === 0
                ? t("common.approvals.createFlow")
                : t("common.approvals.editFlow")}
            </h3>
            <p className="text-sm text-gray-500">{t("common.approvals.configureSequence")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              icon={X}
              buttonStyle="outline"
              size="md"
              onClick={() => setIsEditing(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              icon={Save}
              buttonStyle="solid"
              size="md"
              onClick={handleSave}
            >
              {t("common.save_changes")}
            </Button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <Input
            id="workflow-name"
            label={t("common.approvals.workflowName")}
            value={editingWorkflow.name}
            onChange={(e: any) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
            placeholder={t("common.approvals.workflowName")}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 dark:text-white">
                {t("common.approvals.approvalLevels")}
              </h4>
              <div className="flex gap-2">
                <Button
                  size="md"
                  variant="ghost"
                  buttonStyle="outline"
                  onClick={() => setShowCreateRoleModal(true)}
                  className="text-primary-600"
                  icon={Shield}
                >
                  {t("common.approvals.newRole")}
                </Button>
                {hasAdvancedApprovalAccess ? (
                  <Button
                    size="md"
                    variant="ghost"
                    buttonStyle="outline"
                    onClick={addStep}
                    className="text-primary-600"
                    icon={Plus}
                  >
                    {t("common.approvals.addLevel")}
                  </Button>
                ) : (
                  <Button
                    size="md"
                    variant="ghost"
                    buttonStyle="outline"
                    className="cursor-not-allowed text-gray-400 opacity-50"
                    icon={Plus}
                    disabled
                    title={t("approvals.locked.title") || "Requiere plan Enterprise"}
                  >
                    {t("common.approvals.addLevel")}
                  </Button>
                )}
              </div>
            </div>

            {rolesWithApprovePermission.length === 0 && usersWithApprovePermission.length === 0 && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                      No hay roles o usuarios con permiso de aprobación
                    </p>
                    <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                      Para crear un flujo de aprobación, primero debes asignar el permiso "Aprobar"
                      a al menos un rol o usuario. Puedes crear un nuevo rol con este permiso usando
                      el botón "Crear Nuevo Rol" arriba.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {editingWorkflow.steps.map((step, index) => (
                <div
                  key={index}
                  className="animate-in fade-in slide-in-from-top-2 group flex flex-col items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 duration-300 dark:border-neutral-800 dark:bg-neutral-800/20 xl:flex-row xl:items-center"
                >
                  <div className="flex w-full flex-1 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {index + 1}
                    </div>
                    <Input
                      id={`step-name-${index}`}
                      value={step.name}
                      variant="outlined"
                      sizeType="md"
                      className="border-none bg-transparent px-0 focus:ring-0"
                      containerClassName="flex-1"
                      onChange={(e: any) => {
                        const newSteps = [...editingWorkflow.steps];
                        newSteps[index].name = e.target.value;
                        setEditingWorkflow({
                          ...editingWorkflow,
                          steps: newSteps,
                        });
                      }}
                    />
                  </div>

                  <div className="flex w-full flex-col items-center gap-3 sm:flex-row xl:w-auto">
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                      <Select
                        id={`step-role-${index}`}
                        options={[
                          { value: "", label: t("common.approvals.anyRole") },
                          ...rolesWithApprovePermission
                            .filter((r) => {
                              // Allow current selection or roles not selected in other steps
                              const selectedRoleIds = editingWorkflow.steps
                                .filter((_, i) => i !== index) // Exclude current step
                                .map((s) => s.role_id)
                                .filter((id) => id !== null && id !== undefined);
                              return step.role_id === r.id || !selectedRoleIds.includes(r.id);
                            })
                            .map((r) => ({
                              value: String(r.id),
                              label: r.name,
                            })),
                        ]}
                        value={
                          step.role_id !== null && step.role_id !== undefined
                            ? String(step.role_id)
                            : ""
                        }
                        size="md"
                        containerClassName="w-full sm:w-48"
                        onChange={(val: any) => {
                          const newSteps = [...editingWorkflow.steps];
                          if (val === "" || val === null || val === undefined) {
                            newSteps[index].role_id = null;
                          } else {
                            newSteps[index].role_id = parseInt(val);
                            newSteps[index].user_id = null; // Clear user when role is selected
                          }
                          setEditingWorkflow({
                            ...editingWorkflow,
                            steps: newSteps,
                          });
                        }}
                      />
                      <span className="px-1 text-center text-xs text-gray-400">
                        {t("common.approvals.or")}
                      </span>
                      <Select
                        id={`step-user-${index}`}
                        options={[
                          { value: "", label: t("common.approvals.anyUser") },
                          ...usersWithApprovePermission
                            .filter((u: any) => {
                              // Allow current selection or users not selected in other steps
                              const selectedUserIds = editingWorkflow.steps
                                .filter((_, i) => i !== index) // Exclude current step
                                .map((s) => s.user_id)
                                .filter((id) => id !== null && id !== undefined);
                              return step.user_id === u.id || !selectedUserIds.includes(u.id);
                            })
                            .map((u: any) => ({
                              value: String(u.id),
                              label: u.name,
                            })),
                        ]}
                        value={
                          step.user_id !== null && step.user_id !== undefined
                            ? String(step.user_id)
                            : ""
                        }
                        size="md"
                        containerClassName="w-full sm:w-48"
                        onChange={(val: any) => {
                          const newSteps = [...editingWorkflow.steps];
                          if (val === "" || val === null || val === undefined) {
                            newSteps[index].user_id = null;
                          } else {
                            newSteps[index].user_id = parseInt(val);
                            newSteps[index].role_id = null; // Clear role when user is selected
                          }
                          setEditingWorkflow({
                            ...editingWorkflow,
                            steps: newSteps,
                          });
                        }}
                      />
                    </div>

                    <Button
                      size="md"
                      buttonStyle="icon"
                      onClick={() => removeStep(index)}
                      className="shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                      title={t("common.approvals.deleteLevel")}
                      icon={Trash2}
                    ></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <CreateRoleModal
          isOpen={showCreateRoleModal}
          onClose={() => setShowCreateRoleModal(false)}
          onSuccess={handleRoleCreated}
          workspace={workspace}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("common.approvals.title")}
          </h3>
          <p className="text-sm text-gray-500">{t("common.approvals.subtitle")}</p>
        </div>
        {canManageWorkspace && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              buttonStyle="outline"
              className="text-primary-600"
              onClick={() => setShowInviteModal(true)}
              icon={UserPlus}
            >
              {t("common.approvals.invite")}
            </Button>
            {workflows.length === 0 || hasAdvancedApprovalAccess ? (
              <Button variant="primary" buttonStyle="solid" onClick={handleCreate} icon={Plus}>
                {t("common.approvals.createWorkflow")}
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/10">
            <CheckCircle className="h-8 w-8 text-primary-600" />
          </div>
          <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
            {t("common.approvals.noWorkflowsTitle")}
          </h4>
          <p className="mx-auto mb-6 max-w-sm text-gray-500">
            {t("common.approvals.noWorkflowsDesc")}
          </p>
          <Button
            variant="primary"
            buttonStyle="solid"
            onClick={handleCreate}
            className="shadow-lg shadow-primary-500/20"
            icon={Plus}
          >
            {t("common.approvals.configureFirstWorkflow")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/20">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{workflow.name}</h4>
                    <p className="text-xs text-gray-500">
                      {workflow.steps.length} {t("common.approvals.levelsConfigured")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    buttonStyle="outline"
                    onClick={() => handleEdit(workflow)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    buttonStyle="outline"
                    className="text-red-500"
                    onClick={() => handleDelete(workflow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {workflow.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
                      {step.user_id ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {step.name}
                    </div>
                    {idx < workflow.steps.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertCard
        type="warning"
        message={t("common.approvals.activeWorkflowNote")}
        className="mt-4"
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          // Success logic if needed
        }}
        workspace={workspace}
        roles={roles}
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={t("common.deleteConfirmTitle")}
        message={t("common.approvals.confirmDelete")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        type="danger"
      />
    </div>
  );
}

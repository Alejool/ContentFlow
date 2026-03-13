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
  const planId = (
    workspace.subscription?.plan ||
    workspace.plan ||
    "demo"
  ).toLowerCase();
  
  // Debug: Log access level
  console.log("🔍 ApprovalWorkflowsTab Debug:", {
    hasAdvancedAccess,
    planId,
    subscriptionPlan: workspace.subscription?.plan,
    subscriptionObject: workspace.subscription,
    directPlan: workspace.plan,
    workspaceFeatures: workspace.features,
  });
  
  // Verificar que el workspace tenga acceso a aprobaciones
  const hasBasicApprovalAccess = ["demo", "professional", "enterprise"].includes(planId);
  
  // Si no tiene acceso, mostrar mensaje de upgrade
  if (!hasBasicApprovalAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t("approvals.upgrade.title") || "Aprobaciones no disponibles"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            {t("approvals.upgrade.description") || 
              "Las aprobaciones son una funcionalidad premium disponible en los planes Professional y Enterprise. Actualiza tu plan para obtener acceso a flujos de aprobación y control de contenido."}
          </p>
          
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 mb-6 max-w-md mx-auto">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Con aprobaciones obtienes:
            </p>
            <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                Flujos de aprobación personalizados
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                Control de contenido antes de publicar
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                Asignación por roles o usuarios
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                Historial de aprobaciones
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              buttonStyle="solid"
              onClick={() => (window.location.href = route("pricing"))}
              icon={TrendingUp}
            >
              Ver Planes
            </Button>
            <Button
              variant="secondary"
              buttonStyle="outline"
              onClick={() => (window.location.href = route("workspaces.settings", { workspace: workspace.slug, tab: "overview" }))}
            >
              Volver a Settings
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
    return role.permissions?.some((permission: any) => 
      permission.name === 'approve' || permission.slug === 'approve'
    );
  });

  // Filter users that have "approve" permission (either through their role or direct permission)
  const usersWithApprovePermission = (workspace.users || []).filter((user: any) => {
    // Check if user's role has approve permission
    const userRole = roles.find((role: any) => role.id === user.pivot?.role_id);
    if (userRole?.permissions?.some((permission: any) => 
      permission.name === 'approve' || permission.slug === 'approve'
    )) {
      return true;
    }
    
    // Check if user has direct approve permission
    if (user.permissions?.some((permission: any) => 
      permission.name === 'approve' || permission.slug === 'approve'
    )) {
      return true;
    }
    
    return false;
  });

  console.log('🔍 Filtrado de permisos:', {
    totalRoles: roles.length,
    rolesConApprove: rolesWithApprovePermission.length,
    totalUsuarios: workspace.users?.length || 0,
    usuariosConApprove: usersWithApprovePermission.length,
    rolesConApprove_lista: rolesWithApprovePermission.map((r: any) => r.name),
    usuariosConApprove_lista: usersWithApprovePermission.map((u: any) => u.name)
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
      const message =
        error.response?.data?.message || error.message || t("common.unknown");
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
    const roleIds = editingWorkflow.steps.map(s => s.role_id).filter(id => id !== null && id !== undefined);
    const uniqueRoleIds = new Set(roleIds);
    if (roleIds.length !== uniqueRoleIds.size) {
      toast.error("No puedes asignar el mismo rol a múltiples niveles");
      return;
    }

    // Validation: Check for duplicate users
    const userIds = editingWorkflow.steps.map(s => s.user_id).filter(id => id !== null && id !== undefined);
    const uniqueUserIds = new Set(userIds);
    if (userIds.length !== uniqueUserIds.size) {
      toast.error("No puedes asignar el mismo usuario a múltiples niveles");
      return;
    }

    // Validation: Each step must have either role_id or user_id
    const invalidSteps = editingWorkflow.steps.filter(s => !s.role_id && !s.user_id);
    if (invalidSteps.length > 0) {
      toast.error("Cada nivel debe tener asignado un rol o usuario");
      return;
    }

    try {
      // Prepare steps ensuring all fields are present
      const preparedSteps = editingWorkflow.steps.map(step => ({
        name: step.name,
        role_id: step.role_id || null,
        user_id: step.user_id || null,
        step_order: step.step_order,
        ...(step.id ? { id: step.id } : {})
      }));

      // Automatically set is_multi_level based on number of steps
      const workflowToSave = {
        name: editingWorkflow.name,
        is_active: editingWorkflow.is_active,
        is_multi_level: editingWorkflow.steps.length > 1,
        steps: preparedSteps
      };

      console.log('📤 Enviando workflow:', workflowToSave);

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
      console.error('❌ Error guardando workflow:', error.response?.data || error);
      toast.error(
        `${t("common.approvals.errors.save")}: ` +
          (error.response?.data?.message || error.message),
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
    if (!hasAdvancedAccess) {
      toast.error(t("common.approvals.errors.multiLevelEnterprise"));
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isEditing && editingWorkflow) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 dark:bg-neutral-800/50">
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingWorkflow.id === 0
                ? t("common.approvals.createFlow")
                : t("common.approvals.editFlow")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("common.approvals.configureSequence")}
            </p>
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

        <div className="p-6 space-y-6">
          <Input
            id="workflow-name"
            label={t("common.approvals.workflowName")}
            value={editingWorkflow.name}
            onChange={(e: any) =>
              setEditingWorkflow({ ...editingWorkflow, name: e.target.value })
            }
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
                {hasAdvancedAccess ? (
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
                    className="text-gray-400 cursor-not-allowed opacity-50"
                    icon={Plus}
                    disabled
                  >
                    {t("common.approvals.addLevel")}
                  </Button>
                )}
              </div>
            </div>

            {!hasAdvancedAccess && (
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-full shrink-0">
                    <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary-900 dark:text-primary-300">
                      {t("approvals.locked.title") ||
                        "Flujos de aprobación multi-nivel"}
                    </p>
                    <p className="text-xs text-primary-700 dark:text-primary-400 mt-1 leading-relaxed max-w-xl">
                      {t("approvals.locked.description") ||
                        "Tu plan actual permite aprobaciones de un nivel. Mejora tu plan para crear flujos de aprobación avanzados y multi-nivel con responsables jerárquicos."}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  buttonStyle="solid"
                  onClick={() => (window.location.href = route("pricing"))}
                  className="shrink-0 whitespace-nowrap shadow-md shadow-primary-500/20"
                >
                  {t("common.upgradePlan") || "Mejorar Plan"}
                </Button>
              </div>
            )}

            {(rolesWithApprovePermission.length === 0 && usersWithApprovePermission.length === 0) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                      No hay roles o usuarios con permiso de aprobación
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Para crear un flujo de aprobación, primero debes asignar el permiso "Aprobar" a al menos un rol o usuario. 
                      Puedes crear un nuevo rol con este permiso usando el botón "Crear Nuevo Rol" arriba.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {editingWorkflow.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col xl:flex-row items-start xl:items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-800/20 border border-gray-200 dark:border-neutral-800 rounded-lg group animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <Input
                      id={`step-name-${index}`}
                      value={step.name}
                      variant="outlined"
                      sizeType="md"
                      className="bg-transparent border-none focus:ring-0 px-0"
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

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select
                        id={`step-role-${index}`}
                        options={[
                          { value: "", label: t("common.approvals.anyRole") },
                          ...rolesWithApprovePermission
                            .filter((r) => {
                              // Allow current selection or roles not selected in other steps
                              const selectedRoleIds = editingWorkflow.steps
                                .filter((_, i) => i !== index) // Exclude current step
                                .map(s => s.role_id)
                                .filter(id => id !== null && id !== undefined);
                              return step.role_id === r.id || !selectedRoleIds.includes(r.id);
                            })
                            .map((r) => ({ value: String(r.id), label: r.name })),
                        ]}
                        value={step.role_id !== null && step.role_id !== undefined ? String(step.role_id) : ""}
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
                      <span className="text-gray-400 text-xs text-center px-1">
                        {t("common.approvals.or")}
                      </span>
                      <Select
                        id={`step-user-${index}`}
                        options={[
                          { value: "", label: t("common.approvals.anyUser") },
                          ...usersWithApprovePermission.filter((u: any) => {
                            // Allow current selection or users not selected in other steps
                            const selectedUserIds = editingWorkflow.steps
                              .filter((_, i) => i !== index) // Exclude current step
                              .map(s => s.user_id)
                              .filter(id => id !== null && id !== undefined);
                            return step.user_id === u.id || !selectedUserIds.includes(u.id);
                          }).map((u: any) => ({
                            value: String(u.id),
                            label: u.name,
                          })),
                        ]}
                        value={step.user_id !== null && step.user_id !== undefined ? String(step.user_id) : ""}
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
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 shrink-0"
                      title={t("common.approvals.deleteLevel")}
                      icon={Trash2}
                    >
                    </Button>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("common.approvals.title")}
          </h3>
          <p className="text-sm text-gray-500">
            {t("common.approvals.subtitle")}
          </p>
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
            {workflows.length === 0 || hasAdvancedAccess ? (
              <Button
                variant="primary"
                buttonStyle="solid"
                onClick={handleCreate}
                icon={Plus}
              >
                {t("common.approvals.createWorkflow")}
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {workflows.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-12 text-center">
          <div className="bg-primary-50 dark:bg-primary-900/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t("common.approvals.noWorkflowsTitle")}
          </h4>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">
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
              className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/20 text-primary-600 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {workflow.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {workflow.steps.length}{" "}
                      {t("common.approvals.levelsConfigured")}
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
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    buttonStyle="outline"
                    className="text-red-500"
                    onClick={() => handleDelete(workflow.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {workflow.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 flex items-center gap-1.5">
                      {step.user_id ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      {step.name}
                    </div>
                    {idx < workflow.steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
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

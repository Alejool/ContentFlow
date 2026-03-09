import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import ConfirmDialog from "@/Components/common/ui/ConfirmDialog";
import axios from "axios";
import {
  AlertCircle,
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
  
  // Verificar que el workspace tenga acceso a aprobaciones
  const planId = workspace.subscription?.plan?.toLowerCase() || workspace.plan?.toLowerCase() || "demo";
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
          role_id: roles[0]?.id,
          step_order: 1,
        },
      ],
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingWorkflow) return;

    try {
      if (editingWorkflow.id === 0) {
        await axios.post(
          route("api.v1.workspaces.approval-workflows.store", workspace.id),
          editingWorkflow,
        );
        toast.success(t("common.approvals.success.created"));
      } else {
        await axios.put(
          route("api.v1.workspaces.approval-workflows.update", {
            idOrSlug: workspace.id,
            workflow: editingWorkflow.id,
          }),
          editingWorkflow,
        );
        toast.success(t("common.approvals.success.updated"));
      }
      setIsEditing(false);
      fetchWorkflows();
    } catch (error: any) {
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
      role_id: roles[0]?.id,
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
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-gray-50 dark:bg-neutral-800/50">
          <div>
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
              onClick={() => setIsEditing(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              icon={Save}
              buttonStyle="solid"
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
                          ...roles.map((r) => ({ value: r.id, label: r.name })),
                        ]}
                        value={step.role_id || ""}
                        size="md"
                        containerClassName="w-full sm:w-48"
                        onChange={(val: any) => {
                          const newSteps = [...editingWorkflow.steps];
                          newSteps[index].role_id = val ? parseInt(val) : null;
                          newSteps[index].user_id = null;
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
                          ...(workspace.users?.map((u: any) => ({
                            value: u.id,
                            label: u.name,
                          })) || []),
                        ]}
                        value={step.user_id || ""}
                        size="md"
                        containerClassName="w-full sm:w-48"
                        onChange={(val: any) => {
                          const newSteps = [...editingWorkflow.steps];
                          newSteps[index].user_id = val ? parseInt(val) : null;
                          newSteps[index].role_id = null;
                          setEditingWorkflow({
                            ...editingWorkflow,
                            steps: newSteps,
                          });
                        }}
                      />
                    </div>

                    <Button
                      size="md"
                      variant="ghost"
                      onClick={() => removeStep(index)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 shrink-0"
                      title={t("common.approvals.deleteLevel")}
                    >
                      <Trash2 className="w-4 h-4" />
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

      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <p className="text-sm text-orange-800 dark:text-orange-300">
          {t("common.approvals.activeWorkflowNote")}
        </p>
      </div>

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

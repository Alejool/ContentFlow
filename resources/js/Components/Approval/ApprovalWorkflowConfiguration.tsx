import AlertCard from "@/Components/common/Modern/AlertCard";
import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import axios from "axios";
import {
  AlertTriangle,
  ChevronRight,
  Plus,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { route } from "ziggy-js";

interface ApprovalLevel {
  id?: number;
  level_number: number;
  level_name: string;
  role_id: number;
}

interface ApprovalWorkflow {
  id?: number;
  workspace_id: number;
  is_enabled: boolean;
  is_multi_level: boolean;
  levels: ApprovalLevel[];
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  approval_participant: boolean;
}

interface ApprovalWorkflowConfigurationProps {
  workspace: any;
  roles: Role[];
  canManageWorkflow: boolean;
  hasPendingContent?: boolean;
  hasBasicAccess?: boolean;
  hasAdvancedAccess?: boolean;
}

export default function ApprovalWorkflowConfiguration({
  workspace,
  roles,
  canManageWorkflow,
  hasPendingContent = false,
  hasBasicAccess = true,
  hasAdvancedAccess = true,
}: ApprovalWorkflowConfigurationProps) {
  const { t } = useTranslation();

  // Check if workspace has access to approval workflows
  if (!hasBasicAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t("approvals.upgrade.title") || "Aprobaciones no disponibles"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            {t("approvals.upgrade.description") ||
              "Las aprobaciones son una funcionalidad premium disponible en los planes Professional y Enterprise. Actualiza tu plan para obtener acceso a flujos de aprobación y control de contenido."}
          </p>
          <Button
            variant="primary"
            buttonStyle="solid"
            onClick={() => (window.location.href = route("pricing"))}
          >
            Ver Planes
          </Button>
        </div>
      </div>
    );
  }

  const [workflow, setWorkflow] = useState<ApprovalWorkflow>({
    workspace_id: workspace.id,
    is_enabled: false,
    is_multi_level: false,
    levels: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filter roles that can participate in approvals
  const approvalRoles = roles.filter(
    (r) => r.approval_participant === true || r.approval_participant === 1,
  );

  // If no approval roles found, use all roles as fallback (for development/testing)
  const availableRoles = approvalRoles.length > 0 ? approvalRoles : roles;

  // Debug logging
  console.log("🔍 ApprovalWorkflow Debug:", {
    totalRoles: roles.length,
    approvalRoles: approvalRoles.length,
    availableRoles: availableRoles.length,
    roles: roles.map((r) => ({
      id: r.id,
      name: r.name,
      approval_participant: r.approval_participant,
    })),
  });

  useEffect(() => {
    fetchWorkflow();
  }, [workspace.id]);

  const fetchWorkflow = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        route("api.v1.workspaces.approval-workflow.show", {
          idOrSlug: workspace.id,
        }),
      );
      if (response.data.data) {
        setWorkflow(response.data.data);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error(t("approval.errors.fetch_failed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!canManageWorkflow) {
      toast.error(t("approval.errors.insufficient_permissions"));
      return;
    }

    try {
      setIsSaving(true);
      const endpoint = workflow.is_enabled
        ? route("api.v1.workspaces.approval-workflow.disable", {
            idOrSlug: workspace.id,
          })
        : route("api.v1.workspaces.approval-workflow.enable", {
            idOrSlug: workspace.id,
          });

      await axios.post(endpoint);

      setWorkflow({ ...workflow, is_enabled: !workflow.is_enabled });
      toast.success(
        workflow.is_enabled
          ? t("approval.success.disabled")
          : t("approval.success.enabled"),
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("approval.errors.toggle_failed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMultiLevel = () => {
    if (hasPendingContent) {
      toast.error(t("approval.errors.pending_content_warning"));
      return;
    }

    setWorkflow({
      ...workflow,
      is_multi_level: !workflow.is_multi_level,
      levels:
        !workflow.is_multi_level && workflow.levels.length === 0
          ? [
              {
                level_number: 1,
                level_name: t("approval.level_1"),
                role_id: availableRoles[0]?.id || 0,
              },
            ]
          : workflow.levels,
    });
  };

  const handleAddLevel = () => {
    if (hasPendingContent) {
      toast.error(t("approval.errors.pending_content_warning"));
      return;
    }

    if (!hasAdvancedAccess && workflow.levels.length >= 1) {
      toast.error(t("approval.errors.multi_level_requires_enterprise"));
      return;
    }

    const newLevel: ApprovalLevel = {
      level_number: workflow.levels.length + 1,
      level_name: t("approval.level_n", { n: workflow.levels.length + 1 }),
      role_id: availableRoles[0]?.id || 0,
    };

    setWorkflow({
      ...workflow,
      levels: [...workflow.levels, newLevel],
    });
  };

  const handleRemoveLevel = (index: number) => {
    if (hasPendingContent) {
      toast.error(t("approval.errors.pending_content_warning"));
      return;
    }

    const newLevels = workflow.levels.filter((_, i) => i !== index);
    // Renumber levels
    newLevels.forEach((level, i) => {
      level.level_number = i + 1;
    });

    setWorkflow({
      ...workflow,
      levels: newLevels,
    });
  };

  const handleLevelChange = (
    index: number,
    field: keyof ApprovalLevel,
    value: any,
  ) => {
    const newLevels = [...workflow.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setWorkflow({ ...workflow, levels: newLevels });
  };

  // Check for duplicate roles in real-time
  const getDuplicateRoles = () => {
    if (!workflow.is_multi_level) return new Set();

    const roleIds = workflow.levels.map((l) => l.role_id);
    const duplicates = new Set();
    const seen = new Set();

    roleIds.forEach((roleId) => {
      if (seen.has(roleId)) {
        duplicates.add(roleId);
      }
      seen.add(roleId);
    });

    return duplicates;
  };

  const duplicateRoles = getDuplicateRoles();

  const handleSave = async () => {
    if (!canManageWorkflow) {
      toast.error(t("approval.errors.insufficient_permissions"));
      return;
    }

    // Validation
    if (workflow.is_multi_level && workflow.levels.length === 0) {
      toast.error(t("approval.errors.multi_level_requires_levels"));
      return;
    }

    // Check for duplicate roles
    if (workflow.is_multi_level) {
      const roleIds = workflow.levels.map((l) => l.role_id);
      const uniqueRoleIds = new Set(roleIds);
      if (roleIds.length !== uniqueRoleIds.size) {
        toast.error(t("approval.errors.duplicate_roles"));
        return;
      }

      // Check for invalid role selections (role_id = 0 or null)
      const invalidRoles = workflow.levels.filter(
        (l) => !l.role_id || l.role_id === 0,
      );
      if (invalidRoles.length > 0) {
        toast.error(t("approval.errors.invalid_role_selection"));
        return;
      }
    }

    try {
      setIsSaving(true);

      // Transform the data to match backend expectations
      const payload = {
        is_multi_level: workflow.is_multi_level,
        levels: workflow.is_multi_level
          ? workflow.levels.map((level) => {
              const role = roles.find((r) => r.id === level.role_id);
              if (!role) {
                throw new Error(`Role with ID ${level.role_id} not found`);
              }
              return {
                level_number: level.level_number,
                level_name: level.level_name,
                role_name: role.name,
              };
            })
          : [],
      };

      console.log("🔍 Sending payload:", payload); // Debug log

      await axios.put(
        route("api.v1.workspaces.approval-workflow.configure", {
          idOrSlug: workspace.id,
        }),
        payload,
      );

      toast.success(t("approval.success.configured"));
      fetchWorkflow();
    } catch (error: any) {
      console.error("❌ Save error:", error.response?.data); // Debug log
      toast.error(
        error.response?.data?.message || t("approval.errors.save_failed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("approval.configuration.title")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("approval.configuration.subtitle")}
              </p>
            </div>
          </div>

          {canManageWorkflow && (
            <Button
              variant="primary"
              buttonStyle="solid"
              onClick={handleSave}
              disabled={isSaving || duplicateRoles.size > 0}
              icon={Save}
            >
              {t("common.save_changes")}
            </Button>
          )}
        </div>
      </div>

      {/* Warning for pending content */}
      {hasPendingContent && (
        <AlertCard
          type="warning"
          message={t("approval.warnings.pending_content")}
          icon={AlertTriangle}
        />
      )}

      {/* Enable/Disable Workflow */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">
              {t("approval.enable_workflow")}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("approval.enable_workflow_description")}
            </p>
          </div>
          <button
            onClick={handleToggleEnabled}
            disabled={!canManageWorkflow || isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              workflow.is_enabled
                ? "bg-primary-600"
                : "bg-gray-200 dark:bg-neutral-700"
            } ${!canManageWorkflow || isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                workflow.is_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Multi-Level Toggle */}
      {workflow.is_enabled && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                {t("approval.multi_level_workflow")}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("approval.multi_level_description")}
              </p>
            </div>
            <button
              onClick={handleToggleMultiLevel}
              disabled={!canManageWorkflow || hasPendingContent}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                workflow.is_multi_level
                  ? "bg-primary-600"
                  : "bg-gray-200 dark:bg-neutral-700"
              } ${!canManageWorkflow || hasPendingContent ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  workflow.is_multi_level ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Multi-Level Configuration */}
      {workflow.is_enabled && workflow.is_multi_level && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 dark:text-white">
              {t("approval.approval_levels")}
            </h4>
            <Button
              variant="ghost"
              buttonStyle="outline"
              onClick={handleAddLevel}
              disabled={
                !canManageWorkflow ||
                hasPendingContent ||
                workflow.levels.length >= 5 ||
                (!hasAdvancedAccess && workflow.levels.length >= 1)
              }
              icon={Plus}
              size="sm"
            >
              {t("approval.add_level")}
            </Button>
          </div>

          <div className="space-y-3">
            {workflow.levels.map((level, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-800/20 border border-gray-200 dark:border-neutral-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                    {level.level_number}
                  </div>

                  <Input
                    id={`level-name-${index}`}
                    value={level.level_name}
                    onChange={(e: any) =>
                      handleLevelChange(index, "level_name", e.target.value)
                    }
                    placeholder={t("approval.level_name")}
                    disabled={!canManageWorkflow || hasPendingContent}
                    containerClassName="flex-1"
                  />

                  <Select
                    id={`level-role-${index}`}
                    options={availableRoles
                      .filter((r) => {
                        // Allow current selection or roles not selected in other levels
                        const selectedRoleIds = workflow.levels
                          .filter((_, i) => i !== index) // Exclude current level
                          .map((l) => l.role_id);
                        return (
                          r.id === level.role_id ||
                          !selectedRoleIds.includes(r.id)
                        );
                      })
                      .map((r) => ({
                        value: r.id.toString(),
                        label: r.display_name,
                      }))}
                    value={level.role_id.toString()}
                    onChange={(value) =>
                      handleLevelChange(index, "role_id", parseInt(value))
                    }
                    disabled={!canManageWorkflow || hasPendingContent}
                    containerClassName={`w-48 ${duplicateRoles.has(level.role_id) ? "border-red-500" : ""}`}
                  />

                  {duplicateRoles.has(level.role_id) && (
                    <div className="text-red-500 text-xs mt-1">
                      {t("approval.errors.duplicate_role_selected")}
                    </div>
                  )}
                </div>

                {workflow.levels.length > 1 && (
                  <>
                    {index < workflow.levels.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveLevel(index)}
                      disabled={!canManageWorkflow || hasPendingContent}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          {workflow.levels.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{t("approval.no_levels_configured")}</p>
              <p className="text-sm mt-1">{t("approval.click_add_level")}</p>
            </div>
          )}
        </div>
      )}

      {/* Simple Workflow Info */}
      {workflow.is_enabled && !workflow.is_multi_level && (
        <AlertCard type="info" message={t("approval.simple_workflow_info")} />
      )}

      {!canManageWorkflow && (
        <AlertCard
          type="warning"
          message={t("approval.insufficient_permissions")}
        />
      )}
    </div>
  );
}

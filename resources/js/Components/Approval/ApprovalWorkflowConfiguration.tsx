import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import AlertCard from "@/Components/common/Modern/AlertCard";
import axios from "axios";
import {
  AlertTriangle,
  ChevronRight,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
}

export default function ApprovalWorkflowConfiguration({
  workspace,
  roles,
  canManageWorkflow,
  hasPendingContent = false,
}: ApprovalWorkflowConfigurationProps) {
  const { t } = useTranslation();
  const [workflow, setWorkflow] = useState<ApprovalWorkflow>({
    workspace_id: workspace.id,
    is_enabled: false,
    is_multi_level: false,
    levels: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filter roles that can participate in approvals
  const approvalRoles = roles.filter((r) => r.approval_participant);

  useEffect(() => {
    fetchWorkflow();
  }, [workspace.id]);

  const fetchWorkflow = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        route("api.workspaces.approval-workflow", workspace.id)
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
        ? route("api.workspaces.approval-workflow.disable", workspace.id)
        : route("api.workspaces.approval-workflow.enable", workspace.id);

      await axios.post(endpoint);
      
      setWorkflow({ ...workflow, is_enabled: !workflow.is_enabled });
      toast.success(
        workflow.is_enabled
          ? t("approval.success.disabled")
          : t("approval.success.enabled")
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("approval.errors.toggle_failed"));
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
      levels: !workflow.is_multi_level && workflow.levels.length === 0
        ? [{ level_number: 1, level_name: t("approval.level_1"), role_id: approvalRoles[0]?.id || 0 }]
        : workflow.levels,
    });
  };

  const handleAddLevel = () => {
    if (hasPendingContent) {
      toast.error(t("approval.errors.pending_content_warning"));
      return;
    }

    const newLevel: ApprovalLevel = {
      level_number: workflow.levels.length + 1,
      level_name: t("approval.level_n", { n: workflow.levels.length + 1 }),
      role_id: approvalRoles[0]?.id || 0,
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

  const handleLevelChange = (index: number, field: keyof ApprovalLevel, value: any) => {
    const newLevels = [...workflow.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setWorkflow({ ...workflow, levels: newLevels });
  };

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
    }

    try {
      setIsSaving(true);
      await axios.put(
        route("api.workspaces.approval-workflow.configure", workspace.id),
        workflow
      );
      
      toast.success(t("approval.success.configured"));
      fetchWorkflow();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("approval.errors.save_failed"));
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
              disabled={isSaving}
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
              disabled={!canManageWorkflow || hasPendingContent || workflow.levels.length >= 5}
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
                    onChange={(e: any) => handleLevelChange(index, "level_name", e.target.value)}
                    placeholder={t("approval.level_name")}
                    disabled={!canManageWorkflow || hasPendingContent}
                    containerClassName="flex-1"
                  />

                  <Select
                    id={`level-role-${index}`}
                    options={approvalRoles.map((r) => ({
                      value: r.id.toString(),
                      label: r.display_name,
                    }))}
                    value={level.role_id.toString()}
                    onChange={(value) => handleLevelChange(index, "role_id", parseInt(value))}
                    disabled={!canManageWorkflow || hasPendingContent}
                    containerClassName="w-48"
                  />
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
        <AlertCard
          type="info"
          message={t("approval.simple_workflow_info")}
        />
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

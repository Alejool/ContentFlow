import React, { useState } from "react";
import { useTimezoneStore } from "@/stores/timezoneStore";
import { useTranslation } from "react-i18next";
import Select from "@/Components/common/Modern/Select";
import { Globe } from "lucide-react";

interface WorkspaceTimezoneSettingsProps {
  canManage?: boolean;
}

export const WorkspaceTimezoneSettings: React.FC<WorkspaceTimezoneSettingsProps> = ({
  canManage = false,
}) => {
  const { t } = useTranslation();
  const { workspaceTimezone, effectiveTimezone, updateWorkspaceTimezone } = useTimezoneStore();
  const [selectedTimezone, setSelectedTimezone] = useState(workspaceTimezone || "UTC");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Lista de timezones comunes
  const COMMON_TIMEZONES = [
    { value: "UTC", label: t("workspace.timezone.utc") },
    { value: "America/New_York", label: t("workspace.timezone.eastern") },
    { value: "America/Chicago", label: t("workspace.timezone.central") },
    { value: "America/Denver", label: t("workspace.timezone.mountain") },
    { value: "America/Los_Angeles", label: t("workspace.timezone.pacific") },
    { value: "America/Bogota", label: t("workspace.timezone.bogota") },
    { value: "America/Mexico_City", label: t("workspace.timezone.mexico") },
    {
      value: "America/Argentina/Buenos_Aires",
      label: t("workspace.timezone.buenos_aires"),
    },
    { value: "America/Sao_Paulo", label: t("workspace.timezone.sao_paulo") },
    { value: "Europe/London", label: t("workspace.timezone.london") },
    { value: "Europe/Paris", label: t("workspace.timezone.paris") },
    { value: "Europe/Moscow", label: t("workspace.timezone.moscow") },
    { value: "Asia/Dubai", label: t("workspace.timezone.dubai") },
    { value: "Asia/Kolkata", label: t("workspace.timezone.mumbai") },
    { value: "Asia/Shanghai", label: t("workspace.timezone.beijing") },
    { value: "Asia/Tokyo", label: t("workspace.timezone.tokyo") },
    { value: "Australia/Sydney", label: t("workspace.timezone.sydney") },
  ];

  const handleSave = async () => {
    if (!canManage) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateWorkspaceTimezone(selectedTimezone);
      setSuccess(true);

      // El store ya recarga la página automáticamente
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error updating timezone:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error updating timezone";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const hasChanges = selectedTimezone !== workspaceTimezone;

  return (
    <div className="workspace-timezone-settings rounded-lg border border-white/70 bg-gradient-to-br from-white/90 to-white/95 p-6 shadow-sm dark:border-black/70 dark:from-black/90 dark:to-black/95">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("workspace.timezone.title")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-500">
            {t("workspace.timezone.description")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Timezone Info */}
        <div className="mb-6 rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-blue-800/30 dark:from-blue-900/10 dark:to-neutral-950">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <i className="bi bi-info-circle text-lg"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {t("workspace.timezone.current")}
              </p>
              <p className="mt-1 font-mono text-sm text-blue-700 dark:text-blue-300">
                {effectiveTimezone()}
              </p>
              {!workspaceTimezone && (
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  {t("workspace.timezone.using_default")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timezone Selector */}
        <div className="mb-6">
          <Select
            id="workspace-timezone"
            label={t("workspace.timezone.select_label")}
            options={COMMON_TIMEZONES}
            value={selectedTimezone}
            onChange={(value) => setSelectedTimezone(value as string)}
            disabled={!canManage || isLoading}
            searchable
            icon={Globe}
            size="md"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <i className="bi bi-exclamation-triangle text-red-600 dark:text-red-400"></i>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <i className="bi bi-check-circle text-green-600 dark:text-green-400"></i>
              <p className="text-sm text-green-700 dark:text-green-300">
                {t("workspace.timezone.update_success")}
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        {canManage && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-6 dark:border-neutral-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasChanges
                ? t("workspace.timezone.unsaved_changes")
                : t("workspace.timezone.no_changes")}
            </p>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isLoading ? (
                <>
                  <i className="bi bi-arrow-repeat mr-2 animate-spin"></i>
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <i className="bi bi-save mr-2"></i>
                  {t("common.save_changes")}
                </>
              )}
            </button>
          </div>
        )}

        {!canManage && (
          <div className="rounded-lg border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white p-4 dark:border-yellow-800/30 dark:from-yellow-900/10 dark:to-neutral-950">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                <i className="bi bi-lock text-lg"></i>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {t("workspace.timezone.permission_required")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw, Info, AlertTriangle } from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import { useOnboardingStore } from "@/stores/onboardingStore";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function ConfirmationDialog({ isOpen, onClose, onConfirm, isLoading }: ConfirmationDialogProps) {
  const { t } = useTranslation();

  // Early return after all hooks
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm duration-200">
      <div className="animate-in zoom-in-95 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-200 dark:bg-neutral-800">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              {t("profile.onboarding.confirmTitle") || "Restart Onboarding?"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("profile.onboarding.confirmMessage") ||
                "This will reset your onboarding progress and restart the guided tour. Your account data and settings will not be affected."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            disabled={isLoading}
            buttonStyle="outline"
            className="px-4 py-2"
          >
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            loading={isLoading}
            icon={RotateCcw}
            className="bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            {t("profile.onboarding.confirmButton") || "Restart"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingSection() {
  const { t } = useTranslation();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { restartOnboarding, isLoading } = useOnboardingStore();

  const handleRestartClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmRestart = async () => {
    await restartOnboarding();
    setShowConfirmDialog(false);
    // Optionally redirect to dashboard to trigger tour
    window.location.href = "/dashboard";
  };

  const handleCancelRestart = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="border-b border-gray-200 pb-4 dark:border-neutral-700">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <RotateCcw className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            {t("profile.onboarding.title") || "Onboarding"}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("profile.onboarding.description") ||
              "Manage your onboarding experience and guided tour"}
          </p>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t("profile.onboarding.infoTitle") || "What happens when you restart?"}
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>
                {t("profile.onboarding.infoPoint1") || "Your onboarding progress will be reset"}
              </li>
              <li>
                {t("profile.onboarding.infoPoint2") ||
                  "The guided tour will restart from the beginning"}
              </li>
              <li>
                {t("profile.onboarding.infoPoint3") ||
                  "Your account data and settings remain unchanged"}
              </li>
            </ul>
          </div>
        </div>

        {/* Restart Button */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t("profile.onboarding.restartLabel") || "Restart Onboarding Tour"}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {t("profile.onboarding.restartHint") ||
                "Review the platform features and setup process again"}
            </p>
          </div>
          <Button
            onClick={handleRestartClick}
            disabled={isLoading}
            icon={RotateCcw}
            buttonStyle="outline"
            className="ml-4 whitespace-nowrap"
          >
            {t("profile.onboarding.restartButton") || "Restart"}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelRestart}
        onConfirm={handleConfirmRestart}
        isLoading={isLoading}
      />
    </>
  );
}

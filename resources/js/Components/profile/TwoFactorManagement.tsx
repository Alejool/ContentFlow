import { useState } from "react";
import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { Shield, ShieldCheck, ShieldOff, RefreshCw, AlertTriangle } from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Modal from "@/Components/common/Modern/Modal";

interface TwoFactorManagementProps {
  isEnabled: boolean;
  enabledAt?: string;
}

export default function TwoFactorManagement({ isEnabled, enabledAt }: TwoFactorManagementProps) {
  const { t } = useTranslation();
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; code?: string }>({});

  const handleDisable2FA = () => {
    setIsSubmitting(true);
    setErrors({});

    router.post(
      route("2fa.disable"),
      { password },
      {
        onSuccess: () => {
          setShowDisableModal(false);
          setPassword("");
        },
        onError: (errors) => {
          setErrors(errors as any);
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const handleRegenerateBackupCodes = () => {
    setIsSubmitting(true);
    setErrors({});

    router.post(
      route("2fa.regenerate-backup-codes"),
      { code },
      {
        onSuccess: () => {
          setShowRegenerateModal(false);
          setCode("");
        },
        onError: (errors) => {
          setErrors(errors as any);
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const handleSetup2FA = () => {
    router.visit(route("2fa.setup"));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEnabled
                ? "Your account is protected with 2FA"
                : "Add an extra layer of security to your account"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              Enabled
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 text-xs font-medium rounded-full">
              Disabled
            </span>
          )}
        </div>
      </div>

      {isEnabled && enabledAt && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Enabled on {new Date(enabledAt).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {isEnabled ? (
          <>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => setShowRegenerateModal(true)}
            >
              Regenerate Backup Codes
            </Button>
            <Button
              variant="outline"
              icon={ShieldOff}
              onClick={() => setShowDisableModal(true)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Disable 2FA
            </Button>
          </>
        ) : (
          <Button icon={Shield} onClick={handleSetup2FA}>
            Enable Two-Factor Authentication
          </Button>
        )}
      </div>

      {/* Disable 2FA Modal */}
      <Modal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setPassword("");
          setErrors({});
        }}
        title="Disable Two-Factor Authentication"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  Warning
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                  Disabling 2FA will make your account less secure. You'll need to re-enable it to access admin features.
                </p>
              </div>
            </div>
          </div>

          <Input
            id="password"
            label="Confirm Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="Enter your password to confirm"
          />

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableModal(false);
                setPassword("");
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDisable2FA}
              loading={isSubmitting}
              disabled={!password}
              className="bg-red-600 hover:bg-red-700"
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Regenerate Backup Codes Modal */}
      <Modal
        isOpen={showRegenerateModal}
        onClose={() => {
          setShowRegenerateModal(false);
          setCode("");
          setErrors({});
        }}
        title="Regenerate Backup Codes"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              This will invalidate your current backup codes and generate new ones. Make sure to save the new codes in a safe place.
            </p>
          </div>

          <Input
            id="code"
            label="Verification Code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={errors.code}
            placeholder="Enter 6-digit code from your authenticator"
            maxLength={6}
          />

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowRegenerateModal(false);
                setCode("");
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRegenerateBackupCodes}
              loading={isSubmitting}
              disabled={!code}
            >
              Regenerate Codes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

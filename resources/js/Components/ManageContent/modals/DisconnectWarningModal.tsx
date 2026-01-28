import Button from "@/Components/common/Modern/Button";
import { useTheme } from "@/Hooks/useTheme";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertTriangle, Calendar, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DisconnectWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountName: string;
  posts: any[];
  isLoading?: boolean;
}

export default function DisconnectWarningModal({
  isOpen,
  onClose,
  onConfirm,
  accountName,
  posts,
  isLoading = false,
}: DisconnectWarningModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full max-w-lg transform overflow-hidden rounded-lg p-6 text-left align-middle shadow-xl transition-all ${
            theme === "dark"
              ? "bg-neutral-800 border border-neutral-700"
              : "bg-white"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div
                className={`p-3 rounded-full ${
                  theme === "dark" ? "bg-primary-900/30" : "bg-primary-100"
                }`}
              >
                <AlertTriangle
                  className={`w-6 h-6 ${
                    theme === "dark" ? "text-primary-400" : "text-primary-600"
                  }`}
                />
              </div>
            </div>

            <div className="flex-1">
              <DialogTitle
                as="h3"
                className={`text-lg font-bold leading-6 mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {t("manageContent.socialMedia.disconnectModal.title")}
              </DialogTitle>

              <div className="mt-2 text-sm">
                <p
                  className={`mb-4 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  <span className="font-semibold text-primary-500">
                    {t("manageContent.socialMedia.disconnectModal.warning")}
                  </span>
                  <br />
                  {t("manageContent.socialMedia.disconnectModal.explanation")}
                </p>

                <div
                  className={`mt-4 rounded-lg overflow-hidden border ${
                    theme === "dark"
                      ? "bg-neutral-900/50 border-neutral-700"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead
                        className={`${
                          theme === "dark"
                            ? "bg-neutral-800 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <tr>
                          <th className="px-4 py-2 font-medium">
                            {t(
                              "manageContent.socialMedia.disconnectModal.table.date",
                            )}
                          </th>
                          <th className="px-4 py-2 font-medium">
                            {t(
                              "manageContent.socialMedia.disconnectModal.table.publication",
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          theme === "dark"
                            ? "divide-neutral-700 text-gray-300"
                            : "divide-gray-200 text-gray-700"
                        }`}
                      >
                        {posts.map((post) => (
                          <tr key={post.id}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 opacity-60" />
                                {(() => {
                                  const dateVal =
                                    post.scheduled_at || post.published_at;
                                  if (!dateVal)
                                    return (
                                      <span className="text-xs opacity-50">
                                        {t("common.noDate") || "Sin fecha"}
                                      </span>
                                    );
                                  const dateObj = new Date(dateVal);
                                  return !isNaN(dateObj.getTime())
                                    ? dateObj.toLocaleString()
                                    : t("common.invalidDate") ||
                                        "Fecha inválida";
                                })()}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {post.title ||
                                post.campaign?.title ||
                                t("common.unknown")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  buttonStyle="ghost"
                  shadow="none"
                  onClick={onClose}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === "dark"
                      ? "text-gray-300 hover:bg-neutral-700"
                      : "text-gray-700 hover:bg-gray-100"
                  } h-auto`}
                >
                  {t("manageContent.socialMedia.disconnectModal.cancelButton")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  buttonStyle="solid"
                  onClick={onConfirm}
                  disabled={isLoading}
                  loading={isLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-auto"
                >
                  {t("manageContent.socialMedia.disconnectModal.confirmButton")}
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              buttonStyle="ghost"
              shadow="none"
              onClick={onClose}
              className={`flex-shrink-0 -mt-2 -mr-2 p-2 rounded-full transition-colors ${
                theme === "dark"
                  ? "text-gray-400 hover:bg-neutral-700"
                  : "text-gray-400 hover:bg-gray-100"
              } h-auto min-w-0`}
              icon={<X className="w-5 h-5" />}
            >
              {""}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

import { Check, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { useState } from "react";

interface SocialAccount {
  id: number;
  platform: string;
  name: string;
  account_name?: string;
}

interface PublicationStatusSectionProps {
  publishingAccountIds: number[];
  publishedAccountIds: number[];
  socialAccounts: SocialAccount[];
  t: any;
  onCancel: () => void;
}

export default function PublicationStatusSection({
  publishingAccountIds,
  publishedAccountIds,
  socialAccounts,
  t,
  onCancel,
}: PublicationStatusSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const publishingAccounts = socialAccounts.filter((acc) =>
    publishingAccountIds.includes(acc.id),
  );
  const publishedAccounts = socialAccounts.filter((acc) =>
    publishedAccountIds.includes(acc.id),
  );

  const totalInProgress = publishingAccountIds.length;
  const totalCompleted = publishedAccountIds.length;
  const totalAccounts = totalInProgress + totalCompleted;

  return (
    <div className="px-6 pb-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-gray-200 dark:border-neutral-700">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    {totalInProgress > 0 ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Check className="w-5 h-5 text-white stroke-[3]" />
                    )}
                  </div>
                  {totalInProgress > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
                      <span className="text-[10px] font-bold text-white">
                        {totalInProgress}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {totalInProgress > 0
                      ? t("publish.publishingSocial", {
                          count: totalInProgress,
                        }) || `Publicando en redes (${totalInProgress})...`
                      : t("publish.allPublished") ||
                        "Todas las publicaciones completadas"}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {totalCompleted > 0 && (
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {totalCompleted}{" "}
                        {t("publish.completed") || "completadas"}
                      </span>
                    )}
                    {totalCompleted > 0 && totalInProgress > 0 && (
                      <span className="mx-1.5">•</span>
                    )}
                    {totalInProgress > 0 && (
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {totalInProgress} {t("publish.inProgress") || "en curso"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalInProgress > 0 && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm hover:shadow-md group"
                  >
                    <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                    <span className="text-xs font-bold">
                      {t("common.cancel") || "Cancelar"}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                  aria-label={isExpanded ? "Contraer" : "Expandir"}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {totalInProgress > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(totalCompleted / totalAccounts) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 text-right">
                  {totalCompleted} / {totalAccounts}{" "}
                  {t("publish.platforms") || "plataformas"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="p-4 space-y-3 bg-gray-50 dark:bg-neutral-900/50">
            {/* Publishing Accounts (In Progress) */}
            {publishingAccounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  {t("publish.inProgress") || "En Curso"}
                </h4>
                <div className="space-y-2">
                  {publishingAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg border border-blue-200 dark:border-blue-900/50 shadow-sm"
                    >
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {account.platform}
                        </p>
                        {(account.account_name || account.name) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            @{account.account_name || account.name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                        {t("publish.sending") || "Enviando"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Published Accounts (Completed) */}
            {publishedAccounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  {t("publish.completed") || "Completadas"}
                </h4>
                <div className="space-y-2">
                  {publishedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg border border-green-200 dark:border-green-900/50 shadow-sm"
                    >
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 stroke-[3]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {account.platform}
                        </p>
                        {(account.account_name || account.name) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            @{account.account_name || account.name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-tight px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                        {t("publish.published") || "Publicado"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

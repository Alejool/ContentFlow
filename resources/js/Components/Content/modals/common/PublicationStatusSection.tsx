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

  const publishingAccounts = socialAccounts.filter((acc) => publishingAccountIds.includes(acc.id));
  const publishedAccounts = socialAccounts.filter((acc) => publishedAccountIds.includes(acc.id));

  const totalInProgress = publishingAccountIds.length;
  const totalCompleted = publishedAccountIds.length;
  const totalAccounts = totalInProgress + totalCompleted;

  return (
    <div className="px-6 pb-4">
      <div className="overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-neutral-700 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600">
                    {totalInProgress > 0 ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <Check className="h-5 w-5 stroke-[3] text-white" />
                    )}
                  </div>
                  {totalInProgress > 0 && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-500 dark:border-neutral-900">
                      <span className="text-[10px] font-bold text-white">{totalInProgress}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {totalInProgress > 0
                      ? t("publish.publishingSocial", {
                          count: totalInProgress,
                        }) || `Publicando en redes (${totalInProgress})...`
                      : t("publish.allPublished") || "Todas las publicaciones completadas"}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                    {totalCompleted > 0 && (
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {totalCompleted} {t("publish.completed") || "completadas"}
                      </span>
                    )}
                    {totalCompleted > 0 && totalInProgress > 0 && <span className="mx-1.5">•</span>}
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
                    className="group flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md"
                  >
                    <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                    <span className="text-xs font-bold">{t("common.cancel") || "Cancelar"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="rounded-lg p-2 transition-colors hover:bg-white/50 dark:hover:bg-black/20"
                  aria-label={isExpanded ? "Contraer" : "Expandir"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {totalInProgress > 0 && (
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{
                      width: `${(totalCompleted / totalAccounts) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-right text-xs text-gray-600 dark:text-gray-400">
                  {totalCompleted} / {totalAccounts} {t("publish.platforms") || "plataformas"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="space-y-3 bg-gray-50 p-4 dark:bg-neutral-900/50">
            {/* Publishing Accounts (In Progress) */}
            {publishingAccounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  {t("publish.inProgress") || "En Curso"}
                </h4>
                <div className="space-y-2">
                  {publishingAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-3 shadow-sm dark:border-blue-900/50 dark:bg-neutral-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
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
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold uppercase tracking-tight text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
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
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  {t("publish.completed") || "Completadas"}
                </h4>
                <div className="space-y-2">
                  {publishedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 rounded-lg border border-green-200 bg-white p-3 shadow-sm dark:border-green-900/50 dark:bg-neutral-800"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <Check className="h-4 w-4 stroke-[3] text-green-600 dark:text-green-400" />
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
                      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold uppercase tracking-tight text-green-600 dark:bg-green-900/20 dark:text-green-400">
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

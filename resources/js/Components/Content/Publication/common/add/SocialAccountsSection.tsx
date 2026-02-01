import DatePickerModern from "@/Components/common/Modern/DatePicker";
import { parseISO } from "date-fns";
import { Check, Clock, Loader2, Settings, Target, X } from "lucide-react";
import React, { memo, useState } from "react";

interface SocialAccount {
  id: number;
  platform: string;
  name: string;
  account_name?: string;
}

interface SocialAccountsSectionProps {
  socialAccounts: SocialAccount[];
  selectedAccounts: number[];
  accountSchedules: Record<number, string>;
  t: any;
  onAccountToggle: (accountId: number) => void;
  onScheduleChange: (accountId: number, schedule: string) => void;
  onScheduleRemove: (accountId: number) => void;
  onPlatformSettingsClick: (platform: string) => void;
  globalSchedule?: string;
  publishedAccountIds?: number[];
  publishingAccountIds?: number[];
  failedAccountIds?: number[];
  unpublishing?: number | null;
  error?: string;
  disabled?: boolean;
}

const VisualCheckbox = memo(
  ({
    isChecked,
    onToggle,
  }: {
    isChecked: boolean;
    onToggle: (e?: React.MouseEvent) => void;
  }) => (
    <div className="relative">
      <div
        className={`
        w-5 h-5 rounded border-2 flex items-center justify-center
        transition-all duration-200
        ${
          isChecked
            ? "bg-primary-500 border-primary-500"
            : "border-gray-300 bg-white dark:bg-neutral-800"
        }
      `}
        onClick={onToggle}
      >
        {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
      </div>
    </div>
  ),
);

const SchedulePopoverContent = memo(
  ({
    account,
    customSchedule,
    onScheduleChange,
    onScheduleRemove,
    onClose,
  }: {
    account: SocialAccount;
    customSchedule?: string;
    onScheduleChange: (date: string) => void;
    onScheduleRemove: () => void;
    onClose: () => void;
  }) => {
    return (
      <>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Schedule for {account.platform}
          </h4>
          <button type="button" onClick={onClose}>
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <DatePickerModern
          selected={customSchedule ? parseISO(customSchedule) : null}
          onChange={(date: Date | null) => {
            onScheduleChange(date ? date.toISOString() : "");
          }}
          showTimeSelect
          placeholder="Select date & time"
          dateFormat="dd/MM/yyyy HH:mm"
          withPortal
          popperPlacement="bottom-start"
          isClearable
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
          >
            Done
          </button>
        </div>
      </>
    );
  },
);

const ScheduleButton = memo(
  ({
    account,
    customSchedule,
    activePopover,
    onScheduleClick,
    onScheduleChange,
    onScheduleRemove,
    onPopoverClose,
  }: {
    account: SocialAccount;
    customSchedule?: string;
    activePopover: number | null;
    onScheduleClick: (e: React.MouseEvent) => void;
    onScheduleChange: (date: string) => void;
    onScheduleRemove: () => void;
    onPopoverClose: () => void;
  }) => {
    return (
      <div className="ml-2 relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onScheduleClick}
          className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${
            customSchedule
              ? "text-primary-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
          title="Set individual time"
        >
          <Clock className="w-4 h-4" />
        </button>

        {activePopover === account.id && (
          <div className="absolute right-0 top-full mt-2 z-50 p-4 rounded-lg shadow-xl border w-64 bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-600 animate-in fade-in zoom-in-95">
            <SchedulePopoverContent
              account={account}
              customSchedule={customSchedule}
              onScheduleChange={onScheduleChange}
              onScheduleRemove={onScheduleRemove}
              onClose={onPopoverClose}
            />
          </div>
        )}
      </div>
    );
  },
);

interface SocialAccountItemProps {
  account: SocialAccount;
  isChecked: boolean;
  customSchedule?: string;
  activePopover: number | null;
  onToggle: () => void;
  onScheduleClick: () => void;
  onScheduleChange: (date: string) => void;
  onScheduleRemove: () => void;
  onPlatformSettingsClick: () => void;
  onPopoverClose: () => void;
  t: any;
  globalSchedule?: string;
  isPublished?: boolean;
  isPublishing?: boolean;
  isFailed?: boolean;
  isUnpublishing?: boolean;
  disabled?: boolean;
}

const SocialAccountItem = memo(
  ({
    account,
    isChecked,
    customSchedule,
    activePopover,
    onToggle,
    onScheduleClick,
    onScheduleChange,
    onScheduleRemove,
    onPlatformSettingsClick,
    onPopoverClose,
    t,
    globalSchedule,
    isPublished,
    isPublishing,
    isFailed,
    isUnpublishing,
    disabled = false,
  }: SocialAccountItemProps) => {
    const isInternalDisabled =
      isPublished || isPublishing || isUnpublishing || disabled;
    const isCheckedActually =
      isChecked || isPublished || isPublishing || isUnpublishing;

    return (
      <div
        className={`relative flex items-center p-3 rounded-lg border transition-all duration-300 ${
          isInternalDisabled ? "cursor-default" : "cursor-pointer"
        } ${
          isFailed
            ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-sm"
            : isUnpublishing
              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10 shadow-sm"
              : isPublished
                ? "border-green-500 bg-green-50 dark:bg-green-900/10 shadow-sm"
                : isPublishing
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-sm"
                  : isCheckedActually
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                    : "border-gray-200 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700/5"
        }`}
        onClick={() => {
          if (!isInternalDisabled) onToggle();
        }}
      >
        {/* Blocking Overlay Effect for Publishing / Unpublishing */}
        {(isPublishing || isUnpublishing) && (
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-[0.5px] rounded-lg z-10 flex items-center justify-center pointer-events-none">
            <div
              className={`bg-white dark:bg-neutral-800 px-2 py-1 rounded-full shadow-sm border flex items-center gap-1.5 scale-90 ${
                isUnpublishing
                  ? "border-amber-200 dark:border-amber-900/50"
                  : "border-blue-200 dark:border-blue-900/50"
              }`}
            >
              <Loader2
                className={`w-3 h-3 animate-spin ${
                  isUnpublishing ? "text-amber-500" : "text-blue-500"
                }`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-tight ${
                  isUnpublishing
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {isUnpublishing
                  ? t("publications.modal.publish.unpublishing") ||
                    "Despublicando..."
                  : t("publications.modal.publish.publishing") || "Publicando"}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-5 h-5 flex items-center justify-center">
            {isPublished ? (
              <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </div>
            ) : isPublishing ? (
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              </div>
            ) : isFailed ? (
              <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                <X className="w-3 h-3 text-white stroke-[3]" />
              </div>
            ) : isUnpublishing ? (
              <div className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              </div>
            ) : (
              <VisualCheckbox
                isChecked={!!isCheckedActually}
                onToggle={(e) => {
                  e?.stopPropagation();
                  if (!isInternalDisabled) onToggle();
                }}
              />
            )}
          </div>

          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-neutral-100">
                {account.platform}
              </span>
              {isCheckedActually && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-black tracking-tighter uppercase ${
                    isPublished
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : isFailed
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : isUnpublishing
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : (customSchedule || globalSchedule) &&
                              !isPublished &&
                              !isPublishing
                            ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  }`}
                >
                  {isPublished
                    ? t("publications.modal.publish.published")
                    : isPublishing
                      ? t("publications.modal.publish.publishing")
                      : isFailed
                        ? t("publications.modal.publish.failed") || "Fallido"
                        : isUnpublishing
                          ? t("publications.modal.publish.unpublishing") ||
                            "Despublicando..."
                          : (customSchedule || globalSchedule) &&
                              !isPublished &&
                              !isPublishing
                            ? t("publications.status.scheduled") || "Programado"
                            : t("publications.status.instant") || "Instantáneo"}
                </span>
              )}
            </div>
            {(account.account_name || account.name) && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                @{account.account_name || account.name}
              </span>
            )}
            {isChecked &&
              (customSchedule || globalSchedule) &&
              !isPublished &&
              !isPublishing && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs flex items-center gap-1 ${
                      customSchedule
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {parseISO(
                      customSchedule || globalSchedule || "",
                    ).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    {!customSchedule && globalSchedule && (
                      <span className="text-[10px] opacity-70">(Global)</span>
                    )}
                  </span>
                  {customSchedule && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleRemove();
                      }}
                      className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 text-primary-500 transition-colors"
                      title={t("common.remove") || "Eliminar programación"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            {isPublished && (
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlatformSettingsClick();
                    }}
                    className="p-1.5 rounded-lg transition-all hover:bg-gray-100 text-gray-500 hover:text-primary-600 dark:hover:bg-neutral-700 dark:text-gray-400 dark:hover:text-white"
                    title={t("platformSettings.configure") || "Configurar red"}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {!customSchedule &&
                  !globalSchedule &&
                  !isPublished &&
                  !isPublishing && (
                    <div className="flex items-center gap-1 text-[10px] text-primary-500 font-medium animate-in fade-in slide-in-from-left-1">
                      <Clock className="w-3 h-3" />
                      {t("schedule.instantWarning") ||
                        "Para publicar ahora, usa el botón Publicar después de guardar."}
                    </div>
                  )}
              </div>
            )}
            {isPublished && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" />
                {t("publications.modal.publish.published")}
              </div>
            )}
            {isPublishing && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                {t("publications.modal.publish.publishing")}
              </div>
            )}
            {isUnpublishing && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                {t("publications.modal.publish.unpublishing") ||
                  "Despublicando..."}
              </div>
            )}
            {isFailed && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400">
                <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                  <X className="w-2 h-2 text-white" />
                </div>
                {t("publications.modal.publish.failed") || "Fallido"}
              </div>
            )}
          </div>
        </div>

        {isCheckedActually && !isInternalDisabled && (
          <ScheduleButton
            account={account}
            customSchedule={customSchedule}
            activePopover={activePopover}
            onScheduleClick={(e) => {
              e.stopPropagation();
              onScheduleClick();
            }}
            onScheduleChange={onScheduleChange}
            onScheduleRemove={onScheduleRemove}
            onPopoverClose={onPopoverClose}
          />
        )}
      </div>
    );
  },
);

const SocialAccountsSection = memo(
  ({
    socialAccounts,
    selectedAccounts,
    accountSchedules,
    t,
    onAccountToggle,
    onScheduleChange,
    onScheduleRemove,
    onPlatformSettingsClick,
    globalSchedule,
    publishedAccountIds,
    publishingAccountIds,
    failedAccountIds,
    unpublishing,
    error,
    disabled = false,
  }: SocialAccountsSectionProps) => {
    const [activePopover, setActivePopover] = useState<number | null>(null);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            {t("Content.configureNetworks") || "Configura tus redes sociales"}
          </label>
          {error && (
            <span className="text-xs text-primary-500 font-medium animate-pulse">
              {error}
            </span>
          )}
        </div>

        <div className="grid gap-3">
          {socialAccounts.map((account) => {
            const isChecked = selectedAccounts.includes(account.id);
            const customSchedule = accountSchedules[account.id];
            const isPublished = publishedAccountIds?.includes(account.id);
            const isPublishing = publishingAccountIds?.includes(account.id);

            return (
              <SocialAccountItem
                key={account.id}
                account={account}
                isChecked={isChecked}
                customSchedule={customSchedule}
                activePopover={activePopover}
                onToggle={() => onAccountToggle(account.id)}
                t={t}
                onScheduleClick={() =>
                  setActivePopover(
                    activePopover === account.id ? null : account.id,
                  )
                }
                onScheduleChange={(date) => onScheduleChange(account.id, date)}
                onScheduleRemove={() => onScheduleRemove(account.id)}
                onPlatformSettingsClick={() =>
                  onPlatformSettingsClick(account.platform)
                }
                onPopoverClose={() => setActivePopover(null)}
                globalSchedule={globalSchedule}
                isPublished={isPublished}
                isPublishing={isPublishing}
                isFailed={failedAccountIds?.includes(account.id)}
                isUnpublishing={unpublishing === account.id}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>
    );
  },
);

export default SocialAccountsSection;

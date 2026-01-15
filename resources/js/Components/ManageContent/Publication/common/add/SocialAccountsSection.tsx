import DatePickerModern from "@/Components/common/Modern/DatePicker";
import { format } from "date-fns";
import { Check, Clock, Eye, Settings, Target, X } from "lucide-react";
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
  error?: string;
}

const VisualCheckbox = memo(({ isChecked, onToggle }: {
  isChecked: boolean;
  onToggle: (e?: React.MouseEvent) => void;
}) => (
  <div className="relative">
    <div
      className={`
        w-5 h-5 rounded border-2 flex items-center justify-center
        transition-all duration-200
        ${isChecked
          ? "bg-primary-500 border-primary-500"
          : "border-gray-300 bg-white dark:bg-neutral-800"
        }
      `}
      onClick={onToggle}
    >
      {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
    </div>
  </div>
));

const SchedulePopoverContent = memo(({
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
        selected={customSchedule ? new Date(customSchedule) : null}
        onChange={(date: Date | null) => {
          onScheduleChange(date ? format(date, "yyyy-MM-dd'T'HH:mm") : "");
        }}
        showTimeSelect
        placeholder="Select date & time"
        dateFormat="Pp"
        minDate={new Date()}
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
});

const ScheduleButton = memo(({
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
        className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${customSchedule ? "text-primary-500" : "text-gray-500 dark:text-gray-400"
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
});

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
}

const SocialAccountItem = memo(({
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
}: SocialAccountItemProps) => {
  const isDisabled = isPublished || isPublishing;
  const isCheckedActually = isChecked || isPublished || isPublishing;

  return (
    <div
      className={`relative flex items-center p-3 rounded-lg border transition-all ${isDisabled ? "opacity-80 cursor-default" : ""
        } ${isCheckedActually
          ? `border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm`
          : "border-gray-200 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700/5"
        }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <VisualCheckbox
          isChecked={!!isCheckedActually}
          onToggle={(e) => {
            e?.stopPropagation();
            if (!isDisabled) onToggle();
          }}
        />

        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{account.platform}</span>
            {isCheckedActually && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${isPublished
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : isPublishing
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                    : (customSchedule || globalSchedule) &&
                      !isPublished &&
                      !isPublishing
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  }`}
              >
                {isPublished
                  ? t("publish.published")
                  : isPublishing
                    ? t("publish.publishing")
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
                  className={`text-xs flex items-center gap-1 ${customSchedule
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  <Clock className="w-3 h-3" />
                  {new Date(
                    customSchedule || globalSchedule || ""
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
              {t("publish.published")}
            </div>
          )}
          {isPublishing && (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
              <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
              {t("publish.publishing")}
            </div>
          )}
        </div>
      </div>

      {isCheckedActually && !isDisabled && (
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
});

const SocialAccountsSection = memo(({
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
  error,
}: SocialAccountsSectionProps) => {
  const [activePopover, setActivePopover] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" />
          {t("manageContent.configureNetworks") ||
            "Configura tus redes sociales"}
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
                  activePopover === account.id ? null : account.id
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
            />
          );
        })}
      </div>
    </div>
  );
});

export default SocialAccountsSection;

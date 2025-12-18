import DatePickerModern from "@/Components/common/Modern/DatePicker";
import { format } from "date-fns";
import { Check, Clock, Eye, Settings, Target, X } from "lucide-react";
import React, { useState } from "react";

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
  theme: "dark" | "light";
  t: (key: string) => string;
  onAccountToggle: (accountId: number) => void;
  onScheduleChange: (accountId: number, schedule: string) => void;
  onScheduleRemove: (accountId: number) => void;
  onPlatformSettingsClick: (platform: string) => void;
  onPreviewClick: (platform: string) => void;
  globalSchedule?: string;
}

const SocialAccountsSection: React.FC<SocialAccountsSectionProps> = ({
  socialAccounts,
  selectedAccounts,
  accountSchedules,
  theme,
  t,
  onAccountToggle,
  onScheduleChange,
  onScheduleRemove,
  onPlatformSettingsClick,
  onPreviewClick,
  globalSchedule,
}) => {
  const [activePopover, setActivePopover] = useState<number | null>(null);

  const borderColor =
    theme === "dark" ? "border-neutral-600" : "border-gray-200";

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Target className="w-4 h-4" />
        {t("publications.modal.add.configureNetworks") ||
          "Configura tus redes sociales"}
      </label>

      <div className="grid  gap-3">
        {socialAccounts.map((account) => {
          const isChecked = selectedAccounts.includes(account.id);
          const customSchedule = accountSchedules[account.id];

          return (
            <SocialAccountItem
              key={account.id}
              account={account}
              isChecked={isChecked}
              customSchedule={customSchedule}
              activePopover={activePopover}
              theme={theme}
              borderColor={borderColor}
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
              onPreviewClick={() => onPreviewClick(account.platform)}
              onPopoverClose={() => setActivePopover(null)}
              globalSchedule={globalSchedule}
            />
          );
        })}
      </div>
    </div>
  );
};

const SocialAccountItem: React.FC<{
  account: SocialAccount;
  isChecked: boolean;
  customSchedule?: string;
  activePopover: number | null;
  theme: "dark" | "light";
  borderColor: string;
  onToggle: () => void;
  onScheduleClick: () => void;
  onScheduleChange: (date: string) => void;
  onScheduleRemove: () => void;
  onPlatformSettingsClick: () => void;
  onPreviewClick: () => void;
  onPopoverClose: () => void;
  t: (key: string) => string;
  globalSchedule?: string;
}> = ({
  account,
  isChecked,
  customSchedule,
  activePopover,
  theme,
  borderColor,
  onToggle,
  onScheduleClick,
  onScheduleChange,
  onScheduleRemove,
  onPlatformSettingsClick,
  onPreviewClick,
  onPopoverClose,
  t,
  globalSchedule,
}) => {
  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";

  return (
    <div
      onClick={onToggle}
      className={`relative flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
        isChecked
          ? `border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm`
          : `${borderColor} hover:bg-gray-50 dark:hover:bg-neutral-700/50`
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <VisualCheckbox
          isChecked={isChecked}
          theme={theme}
          onToggle={(e) => {
            e?.stopPropagation();
            onToggle();
          }}
        />

        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{account.platform}</span>
            {isChecked && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                  customSchedule || globalSchedule
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                }`}
              >
                {customSchedule || globalSchedule
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
          {isChecked && (customSchedule || globalSchedule) && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs flex items-center gap-1 ${
                  customSchedule
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
          {isChecked && (
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewClick();
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  theme === "dark"
                    ? "hover:bg-neutral-700 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                }`}
                title={
                  t("publications.modal.preview.view") || "Ver vista previa"
                }
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlatformSettingsClick();
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  theme === "dark"
                    ? "hover:bg-neutral-700 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-500 hover:text-primary-600"
                }`}
                title={
                  t("publications.modal.platformSettings.configure") ||
                  "Configurar red"
                }
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isChecked && (
        <ScheduleButton
          account={account}
          customSchedule={customSchedule}
          activePopover={activePopover}
          theme={theme}
          borderColor={borderColor}
          modalBg={modalBg}
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
};

const VisualCheckbox: React.FC<{
  isChecked: boolean;
  theme: "dark" | "light";
  onToggle: (e?: React.MouseEvent) => void;
}> = ({ isChecked, theme, onToggle }) => (
  <div className="relative">
    <div
      className={`
        w-5 h-5 rounded border-2 flex items-center justify-center
        transition-all duration-200
        ${
          isChecked
            ? "bg-primary-500 border-primary-500"
            : `border-gray-300 ${
                theme === "dark" ? "bg-neutral-800" : "bg-white"
              }`
        }
      `}
      onClick={onToggle}
    >
      {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
    </div>
  </div>
);

const ScheduleButton: React.FC<{
  account: SocialAccount;
  customSchedule?: string;
  activePopover: number | null;
  theme: "dark" | "light";
  borderColor: string;
  modalBg: string;
  onScheduleClick: (e: React.MouseEvent) => void;
  onScheduleChange: (date: string) => void;
  onScheduleRemove: () => void;
  onPopoverClose: () => void;
}> = ({
  account,
  customSchedule,
  activePopover,
  theme,
  borderColor,
  modalBg,
  onScheduleClick,
  onScheduleChange,
  onScheduleRemove,
  onPopoverClose,
}) => {
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";

  return (
    <div className="ml-2 relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onScheduleClick}
        className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${
          customSchedule ? "text-primary-500" : textSecondary
        }`}
        title="Set individual time"
      >
        <Clock className="w-4 h-4" />
      </button>

      {activePopover === account.id && (
        <div
          className={`absolute right-0 top-full mt-2 z-50 p-4 rounded-lg shadow-xl border w-64 ${modalBg} ${borderColor} animate-in fade-in zoom-in-95`}
        >
          <SchedulePopoverContent
            account={account}
            customSchedule={customSchedule}
            theme={theme}
            onScheduleChange={onScheduleChange}
            onScheduleRemove={onScheduleRemove}
            onClose={onPopoverClose}
          />
        </div>
      )}
    </div>
  );
};

const SchedulePopoverContent: React.FC<{
  account: SocialAccount;
  customSchedule?: string;
  theme: "dark" | "light";
  onScheduleChange: (date: string) => void;
  onScheduleRemove: () => void;
  onClose: () => void;
}> = ({
  account,
  customSchedule,
  theme,
  onScheduleChange,
  onScheduleRemove,
  onClose,
}) => {
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h4 className={`text-sm font-semibold ${textPrimary}`}>
          Schedule for {account.platform}
        </h4>
        <button type="button" onClick={onClose}>
          <X className={`w-4 h-4 ${textSecondary}`} />
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
      />

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={() => {
            onScheduleRemove();
            onClose();
          }}
          className="text-xs text-primary-500 hover:text-primary-700 font-medium px-2 py-1"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded hover:bg-primary-700"
        >
          Done
        </button>
      </div>
    </>
  );
};

export default SocialAccountsSection;

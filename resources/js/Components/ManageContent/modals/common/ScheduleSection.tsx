import DatePickerModern from "@/Components/common/Modern/DatePicker";
import Label from "@/Components/common/Modern/Label";
import { format } from "date-fns";
import { Clock, X } from "lucide-react";
import React from "react";

interface ScheduleSectionProps {
  scheduledAt?: string;
  theme: "dark" | "light";
  t: (key: string) => string;
  onScheduleChange: (date: string) => void;
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  scheduledAt,
  theme,
  t,
  onScheduleChange,
}) => {
  return (
    <div>
      <Label
        htmlFor="scheduled_at"
        icon={Clock}
        size="md"
        tooltip={t("publications.modal.edit.optionalSchedule")}
      >
        {t("publications.modal.edit.schedulePublication")}
      </Label>

      <div className="relative">
        <DatePickerModern
          selected={scheduledAt ? new Date(scheduledAt) : null}
          onChange={(date) =>
            onScheduleChange(date ? format(date, "yyyy-MM-dd'T'HH:mm") : "")
          }
          showTimeSelect
          placeholder={
            t("publications.modal.edit.schedulePublication") ||
            "Schedule Publication"
          }
          dateFormat="Pp"
          minDate={new Date()}
          withPortal
          popperPlacement="bottom-start"
          size="md"
        />
        {scheduledAt && (
          <button
            type="button"
            onClick={() => onScheduleChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-primary-500 transition-colors"
            title={t("common.clear") || "Clear"}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ScheduleSection;

import DatePickerModern from "@/Components/common/Modern/DatePicker";
import Label from "@/Components/common/Modern/Label";
import { format } from "date-fns";
import { Clock } from "lucide-react";
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
      <Label htmlFor="scheduled_at" icon={Clock} size="lg">
        {t("publications.modal.schedule.title") || "Date for all networks"}
      </Label>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 ml-1">
        {t("publications.modal.schedule.description") ||
          "Set a single date to publish on all selected social networks at once."}
      </p>

      <div className="relative">
        <DatePickerModern
          selected={scheduledAt ? new Date(scheduledAt) : null}
          onChange={(date) =>
            onScheduleChange(date ? format(date, "yyyy-MM-dd'T'HH:mm") : "")
          }
          showTimeSelect
          placeholder={
            t("publications.modal.schedule.placeholder") ||
            "Select date and time"
          }
          dateFormat="Pp"
          minDate={new Date()}
          withPortal
          popperPlacement="bottom-start"
          size="lg"
          isClearable
        />
      </div>
    </div>
  );
};

export default ScheduleSection;

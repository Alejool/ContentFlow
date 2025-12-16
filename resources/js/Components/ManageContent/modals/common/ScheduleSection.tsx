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
    <div >
      <Label
        htmlFor="scheduled_at"
        icon={Clock}
        size="md"
        hint={t("publications.modal.edit.optionalSchedule")}
      >
        {t("publications.modal.edit.schedulePublication")}
      </Label>

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
    </div>
  );
};

export default ScheduleSection;

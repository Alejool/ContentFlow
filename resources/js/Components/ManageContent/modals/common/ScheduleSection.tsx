import React from "react";
import { Clock } from "lucide-react";
import Label from "@/Components/common/Modern/Label";
import ModernDatePicker from "@/Components/common/ui/ModernDatePicker";
import { format } from "date-fns";

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
    <div className="space-y-4">
      <Label
        htmlFor="scheduled_at"
        icon={Clock}
        size="lg"
        hint={t("publications.modal.edit.optionalSchedule")}
      >
        {t("publications.modal.edit.schedulePublication")}
      </Label>

      <ModernDatePicker
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
        theme={theme}
      />
    </div>
  );
};

export default ScheduleSection;

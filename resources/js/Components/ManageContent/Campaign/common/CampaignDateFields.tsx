import DatePickerModern from "@/Components/common/Modern/DatePicker";
import { format } from "date-fns";
import React from "react";
import { FieldErrors, UseFormSetValue } from "react-hook-form";

interface CampaignDateFieldsProps {
  startDate?: string;
  endDate?: string;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  watch: (name?: string) => any;
  theme: "dark" | "light";
  t: (key: string) => string;
}

const CampaignDateFields: React.FC<CampaignDateFieldsProps> = ({
  startDate,
  endDate,
  errors,
  setValue,
  watch,
  theme,
  t,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="form-group">
        <DatePickerModern
          register={undefined}
          name="start_date"
          error={errors.start_date?.message as string}
          label={t("campaigns.modal.add.startDate") || "Start Date"}
          selected={startDate ? new Date(startDate) : null}
          onChange={(date: Date | null) =>
            setValue("start_date", date ? format(date, "yyyy-MM-dd") : "", {
              shouldValidate: true,
            })
          }
          placeholder={
            t("campaigns.modal.add.placeholders.startDate") ||
            "Select start date"
          }
          withPortal
        />
      </div>

      <div className="form-group">
        <DatePickerModern
          register={undefined}
          name="end_date"
          error={errors.end_date?.message as string}
          label={t("campaigns.modal.add.endDate") || "End Date"}
          selected={endDate ? new Date(endDate) : null}
          onChange={(date: Date | null) =>
            setValue("end_date", date ? format(date, "yyyy-MM-dd") : "", {
              shouldValidate: true,
            })
          }
          placeholder={
            t("campaigns.modal.add.placeholders.endDate") || "End Date"
          }
          minDate={
            watch("start_date") ? new Date(watch("start_date")!) : undefined
          }
          withPortal
        />
      </div>
    </div>
  );
};

export default CampaignDateFields;

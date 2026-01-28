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
  t: (key: string) => string;
  disabled?: boolean;
}

const CampaignDateFields: React.FC<CampaignDateFieldsProps> = ({
  startDate,
  endDate,
  errors,
  setValue,
  watch,
  t,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="form-group">
        <DatePickerModern
          register={undefined}
          isClearable={true}
          dateFormat="dd/MM/yyyy"
          name="start_date"
          error={errors.start_date?.message as string}
          label={t("campaigns.modal.add.startDate")}
          selected={startDate ? new Date(startDate) : null}
          onChange={(date: Date | null) =>
            setValue("start_date", date ? format(date, "yyyy-MM-dd") : "", {
              shouldValidate: true,
            })
          }
          placeholder={t("campaigns.modal.add.placeholders.startDate")}
          size="lg"
          variant="filled"
          withPortal
        />
      </div>

      <div className="form-group">
        <DatePickerModern
          register={undefined}
          isClearable={true}
          dateFormat="dd/MM/yyyy"
          name="end_date"
          error={errors.end_date?.message as string}
          label={t("campaigns.modal.add.endDate")}
          selected={endDate ? new Date(endDate) : null}
          onChange={(date: Date | null) =>
            setValue("end_date", date ? format(date, "yyyy-MM-dd") : "", {
              shouldValidate: true,
            })
          }
          placeholder={t("campaigns.modal.add.placeholders.endDate")}
          minDate={
            watch("start_date") ? new Date(watch("start_date")!) : undefined
          }
          size="lg"
          variant="filled"
          withPortal
        />
      </div>
    </div>
  );
};

export default CampaignDateFields;

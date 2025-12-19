import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import { FileText, Target } from "lucide-react";
import React from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface CampaignFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watched: any;
  theme: "dark" | "light";
  t: (key: string) => string;
  mode?: "add" | "edit";
}

const CampaignFormFields: React.FC<CampaignFormFieldsProps> = ({
  register,
  errors,
  watched,
  theme,
  t,
  mode = "add",
}) => {
  const goalPlaceholder =
    mode === "edit"
      ? t("campaigns.modal.edit.placeholders.goal") || "e.g. $1000.00"
      : t("campaigns.modal.add.placeholders.goal") || "Campaign goal";

  const budgetPlaceholder =
    mode === "edit"
      ? t("campaigns.modal.edit.placeholders.budget") || "e.g. $1000.00"
      : t("campaigns.modal.add.placeholders.budget") || "Campaign budget";

  return (
    <>
      <div className="form-group">
        <Input
          id="name"
          label={t("campaigns.modal.add.name") || "Campaign Name"}
          register={register}
          name="name"
          placeholder={
            t("campaigns.modal.add.placeholders.name") ||
            "e.g. Summer Sale 2024"
          }
          sizeType= "lg"
          variant="filled"
          theme={theme}
          error={errors.name?.message as string}
        />
      </div>

      <div className="form-group">
        <Textarea
          id="description"
          label={t("campaigns.modal.add.description")}
          register={register}
          name="description"
          placeholder={t("campaigns.modal.add.placeholders.description")}
          error={errors.description?.message as string}
          icon={FileText}
          theme={theme}
          variant="filled"
          rows={4}
          size="lg"
          maxLength={200}
          showCharCount
          hint="Maximum 200 characters"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <Input
            id="goal"
            label={
              mode === "edit"
                ? t("campaigns.modal.edit.goal") || "Goal"
                : t("campaigns.modal.add.goal") || "Goal"
            }
            register={register}
            name="goal"
            placeholder={goalPlaceholder}
            error={errors.goal?.message as string}
            icon={Target}
            theme={theme}
            variant="filled"
            sizeType="lg"
            hint={`${watched.goal?.length || 0}/200 characters`}
          />
        </div>

        <div className="form-group">
          <Input
            id="budget"
            label={
              mode === "edit"
                ? t("campaigns.modal.edit.budget") || "Budget"
                : t("campaigns.modal.add.budget") || "Budget"
            }
            type="number"
            register={register}
            name="budget"
            placeholder={budgetPlaceholder}
            error={errors.budget?.message as string}
            icon={Target}
            theme={theme}
            variant="filled"
            sizeType="lg"
          />
        </div>
      </div>
    </>
  );
};

export default CampaignFormFields;

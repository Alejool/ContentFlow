import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import { FileText, Target } from "lucide-react";
import React from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface CampaignFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watched: any;
  t: (key: string) => string;
  mode?: "add" | "edit";
  disabled?: boolean;
}

const CampaignFormFields: React.FC<CampaignFormFieldsProps> = ({
  register,
  errors,
  watched,
  t,
  mode = "add",
  disabled = false,
}) => {
  const goalPlaceholder =
    mode === "edit"
      ? t("campaigns.modal.edit.placeholders.goal")
      : t("campaigns.modal.add.placeholders.goal");

  const budgetPlaceholder =
    mode === "edit"
      ? t("campaigns.modal.edit.placeholders.budget")
      : t("campaigns.modal.add.placeholders.budget");

  return (
    <>
      <div className="form-group">
        <Input
          id="name"
          label={t("campaigns.modal.add.name") || "Campaign Name"}
          register={register}
          name="name"
          placeholder={t("campaigns.modal.add.placeholders.name")}
          sizeType="lg"
          variant="filled"
          error={errors.name?.message as string}
          disabled={disabled}
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
          variant="filled"
          rows={4}
          size="lg"
          maxLength={200}
          showCharCount
          hint={t("campaigns.modal.add.placeholders.description_hint")}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <Input
            id="goal"
            label={
              mode === "edit"
                ? t("campaigns.modal.edit.goal")
                : t("campaigns.modal.add.goal")
            }
            register={register}
            name="goal"
            placeholder={goalPlaceholder}
            error={errors.goal?.message as string}
            icon={Target}
            variant="filled"
            sizeType="lg"
            hint={`${watched.goal?.length || 0}/200 characters`}
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <Input
            id="budget"
            label={
              mode === "edit"
                ? t("campaigns.modal.edit.budget")
                : t("campaigns.modal.add.budget")
            }
            type="number"
            register={register}
            name="budget"
            placeholder={budgetPlaceholder}
            error={errors.budget?.message as string}
            icon={Target}
            variant="filled"
            sizeType="lg"
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
};

export default CampaignFormFields;

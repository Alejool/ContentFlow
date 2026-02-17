import AiFieldSuggester from "@/Components/AiAssistant/AiFieldSuggester";
import AiPromptSection from "@/Components/AiAssistant/AiPromptSection";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import { FileText, Target } from "lucide-react";
import React from "react";
import { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

interface CampaignFormFieldsProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  watched: any;
  t: (key: string) => string;
  mode?: "add" | "edit";
  disabled?: boolean;
  showAiPrompt?: boolean;
}

const CampaignFormFields: React.FC<CampaignFormFieldsProps> = ({
  register,
  setValue,
  errors,
  watched,
  t,
  mode = "add",
  disabled = false,
  showAiPrompt = true,
}) => {
  const handleAiSuggestion = (data: any) => {
    if (data.name || data.title) {
      setValue("name", data.name || data.title, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.description) {
      setValue("description", data.description, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.goal) {
      setValue("goal", data.goal, { shouldValidate: true, shouldDirty: true });
    }
    if (data.budget !== undefined) {
      setValue("budget", data.budget.toString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.start_date) {
      setValue("start_date", data.start_date, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.end_date) {
      setValue("end_date", data.end_date, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

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
      {showAiPrompt && (
        <AiPromptSection
          type="campaign"
          currentFields={watched}
          onSuggest={handleAiSuggestion}
        />
      )}
      <div className="flex justify-between items-end mb-4 px-1">
        <AiFieldSuggester
          fields={watched}
          type="campaign"
          onSuggest={handleAiSuggestion}
          disabled={disabled}
        />
      </div>
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
          maxLength={500}
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

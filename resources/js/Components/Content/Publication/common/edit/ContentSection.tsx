import AiFieldSuggester from "@/Components/AiAssistant/AiFieldSuggester";
import CampaignSelector from "@/Components/Content/Publication/common/CampaignSelector";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import { FileText, Hash } from "lucide-react";
import { memo } from "react";
import { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";

interface ContentSectionProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  watched: any;
  t: (key: string) => string;
  campaigns?: any[];
  publication?: any;
  onHashtagChange: (value: string) => void;
  disabled?: boolean;
}

const ContentSection = memo(
  ({
    register,
    setValue,
    errors,
    watched,
    t,
    campaigns,
    publication,
    onHashtagChange,
    disabled,
  }: ContentSectionProps) => {
    const handleAiSuggest = (data: Record<string, any>) => {
      if (data.title) setValue("title", data.title, { shouldValidate: true });
      if (data.description)
        setValue("description", data.description, { shouldValidate: true });
      if (data.goal) setValue("goal", data.goal, { shouldValidate: true });
      if (data.hashtags) {
        setValue("hashtags", data.hashtags, { shouldValidate: true });
        onHashtagChange(data.hashtags);
      }
    };

    return (
      <div className={`space-y-6 ${disabled ? "opacity-75" : ""}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("publications.modal.edit.contentSection") || "Contenido"}
          </h3>
          {!disabled && (
            <AiFieldSuggester
              type="publication"
              fields={{
                title: watched.title,
                description: watched.description,
                goal: watched.goal,
              }}
              onSuggest={handleAiSuggest}
            />
          )}
        </div>

        <Input
          id="title"
          label={t("publications.modal.edit.titleField")}
          type="text"
          register={register}
          name="title"
          placeholder={t("publications.modal.edit.placeholders.title")}
          error={errors.title?.message as string}
          icon={FileText}
          variant="filled"
          sizeType="lg"
          required
          hint={`${watched.title?.length || 0}/70 characters`}
          disabled={disabled}
        />

        <Textarea
          id="description"
          label={t("publications.modal.edit.description")}
          register={register}
          name="description"
          placeholder={t("publications.modal.edit.placeholders.description")}
          error={errors.description?.message as string}
          icon={FileText}
          variant="filled"
          size="lg"
          required
          rows={4}
          maxLength={200}
          showCharCount
          hint="Maximum 200 characters"
          disabled={disabled}
        />

        <Input
          id="goal"
          label={t("publications.modal.edit.goal")}
          type="text"
          register={register}
          name="goal"
          placeholder={t("publications.modal.edit.placeholders.goal")}
          error={errors.goal?.message as string}
          icon={FileText}
          variant="filled"
          sizeType="lg"
          required
          hint={`${watched.goal?.length || 0}/200 characters`}
          disabled={disabled}
        />

        <Input
          id="hashtags"
          label={t("publications.modal.edit.hashtags")}
          type="text"
          register={register}
          name="hashtags"
          placeholder={t("publications.modal.edit.placeholders.hashtags")}
          required
          error={errors.hashtags?.message as string}
          onChange={(e) => onHashtagChange(e.target.value)}
          icon={Hash}
          variant="filled"
          sizeType="lg"
          hint={`${
            watched.hashtags
              ? typeof watched.hashtags === 'string'
                ? watched.hashtags
                    .split(" ")
                    .filter((tag: string) => tag.startsWith("#")).length
                : Array.isArray(watched.hashtags)
                ? watched.hashtags.length
                : 0
              : 0
          }/10 hashtags`}
          disabled={disabled}
        />

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("publications.modal.edit.campaigns") || "Add to Campaign"}
          </label>
          <div className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-gray-50 dark:bg-black/20">
            <CampaignSelector
              campaigns={campaigns || []}
              selectedId={
                watched.campaign_id
                  ? parseInt(watched.campaign_id.toString())
                  : null
              }
              loading={false}
              t={t}
              onSelectCampaign={(id: number | null) => {
                setValue("campaign_id", id?.toString() ?? "", {
                  shouldValidate: true,
                });
              }}
              disabled={disabled}
            />
          </div>
          {errors.campaign_id?.message && (
            <p className="text-xs text-red-500 mt-1">
              {errors.campaign_id.message as string}
            </p>
          )}
        </div>
      </div>
    );
  },
);

export default ContentSection;

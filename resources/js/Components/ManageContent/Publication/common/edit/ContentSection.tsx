import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import Textarea from "@/Components/common/Modern/Textarea";
import { FileText, Hash, Target } from "lucide-react";
import React from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";

interface ContentSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watched: any;
  theme: "dark" | "light";
  t: (key: string) => string;
  campaigns?: any[];
  publication?: any;
  onHashtagChange: (value: string) => void;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  register,
  errors,
  watched,
  theme,
  t,
  campaigns,
  publication,
  onHashtagChange,
}) => {
  return (
    <div className="space-y-6">
      <Input
        id="title"
        label={t("publications.modal.edit.titleField")}
        type="text"
        register={register}
        name="title"
        placeholder={t("publications.modal.edit.placeholders.title")}
        error={errors.title?.message as string}
        icon={FileText}
        theme={theme}
        variant="filled"
        size="lg"
        required
        hint={`${watched.title?.length || 0}/70 characters`}
      />

      <Textarea
        id="description"
        label={t("publications.modal.edit.description")}
        register={register}
        name="description"
        placeholder={t("publications.modal.edit.placeholders.description")}
        error={errors.description?.message as string}
        icon={FileText}
        theme={theme}
        variant="filled"
        size="lg"
        required
        rows={4}
        maxLength={200}
        showCharCount
        hint="Maximum 200 characters"
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
        theme={theme}
        variant="filled"
        size="lg"
        required
        hint={`${watched.goal?.length || 0}/200 characters`}
      />

      <Input
        id="hashtags"
        label={t("publications.modal.edit.hashtags")}
        type="text"
        register={register}
        name="hashtags"
        placeholder={t("publications.modal.edit.placeholders.hashtags")}
        error={errors.hashtags?.message as string}
        onChange={(e) => onHashtagChange(e.target.value)}
        icon={Hash}
        theme={theme}
        variant="filled"
        size="lg"
        hint={`${
          watched.hashtags
            ? watched.hashtags
                .split(" ")
                .filter((tag: string) => tag.startsWith("#")).length
            : 0
        }/10 hashtags`}
      />

      {(!publication?.scheduled_posts ||
        publication.scheduled_posts.length === 0) && (
        <Select
          id="campaign_id"
          label={t("publications.modal.edit.campaigns") || "Add to Campaign"}
          options={(campaigns || []).map((campaign: any) => ({
            value: campaign.id,
            label: campaign.name || campaign.title || `Campaign ${campaign.id}`,
          }))}
          register={register}
          name="campaign_id"
          placeholder={t("common.select") || "Select a campaign..."}
          error={errors.campaign_id?.message as string}
          icon={Target}
          theme={theme}
          variant="filled"
          size="lg"
          clearable
        />
      )}
    </div>
  );
};

export default ContentSection;

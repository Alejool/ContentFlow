import { TFunction } from "i18next";
import ContentSection from "@/Components/Content/Publication/common/edit/ContentSection";
import { SectionHeader } from "../common/SectionHeader";
import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";

interface ContentFormSectionProps {
  t: TFunction;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  watched: any;
  campaigns: any[];
  publication?: any;
  hasPublishedPlatform: boolean;
  isContentSectionDisabled: boolean;
  contentType: string;
  onHashtagChange: (hashtags: string[]) => void;
}

export const ContentFormSection = ({
  t,
  register,
  setValue,
  errors,
  watched,
  campaigns,
  publication,
  hasPublishedPlatform,
  isContentSectionDisabled,
  contentType,
  onHashtagChange,
}: ContentFormSectionProps) => {
  return (
    <div className="space-y-4">
      <SectionHeader title={t("publications.modal.edit.contentSection") || "Contenido"} />

      <ContentSection
        register={register}
        setValue={setValue}
        errors={errors}
        watched={watched}
        t={t}
        campaigns={campaigns}
        publication={publication}
        onHashtagChange={onHashtagChange}
        disabled={hasPublishedPlatform || isContentSectionDisabled}
        contentType={contentType}
      />
    </div>
  );
};

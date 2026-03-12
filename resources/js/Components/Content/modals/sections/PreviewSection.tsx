import { TFunction } from "i18next";
import { LivePreviewSection } from "@/Components/Content/Publication/common/edit/LivePreviewSection";
import { SectionHeader } from "../common/SectionHeader";

interface PreviewSectionProps {
  t: TFunction;
  content: string;
  mediaUrls: string[];
  user: {
    name: string;
    username: string;
    avatar?: string;
  };
  title?: string;
  publishedAt?: string;
  publishedLinks?: Record<string, string>;
  className?: string;
}

export const PreviewSection = ({
  t,
  content,
  mediaUrls,
  user,
  title,
  publishedAt,
  publishedLinks,
  className = "",
}: PreviewSectionProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <SectionHeader
        title={t("publications.modal.edit.previewSection") || "Vista Previa"}
        className="pt-6"
      />

      <LivePreviewSection
        content={content}
        mediaUrls={mediaUrls}
        user={user}
        title={title}
        publishedAt={publishedAt}
        publishedLinks={publishedLinks}
      />
    </div>
  );
};

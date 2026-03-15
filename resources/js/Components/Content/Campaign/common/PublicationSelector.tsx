import Loader from "@/Components/common/Loader";
import SearchableSelector from "@/Components/common/Modern/SearchableSelector";
import { Check } from "lucide-react";
import React from "react";

interface PublicationSelectorProps {
  publications: any[];
  selectedIds: number[];
  loading: boolean;
  t: (key: string) => string;
  getThumbnail: (pub: any) => { url: string | null; type: string } | null;
  onTogglePublication: (id: number) => void;
  mode?: "add" | "edit";
  disabled?: boolean;
  maxHeight?: string;
}

const PublicationSelector: React.FC<PublicationSelectorProps> = ({
  publications,
  selectedIds,
  loading,
  t,
  getThumbnail,
  onTogglePublication,
  mode = "add",
  disabled = false,
  maxHeight,
}) => {
  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        <Loader />
        {t("campaigns.modal.add.loadingPublications")}
      </div>
    );
  }

  if (publications.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        {mode === "edit"
          ? t("campaigns.modal.edit.noPublications")
          : t("campaigns.modal.add.noPublications")}
      </div>
    );
  }

  return (
    <SearchableSelector
      items={publications}
      selectedIds={selectedIds}
      onToggle={onTogglePublication}
      loading={loading}
      mode="multiple"
      searchPlaceholder={t("common.search") || "Search publications..."}
      emptyMessage={
        mode === "edit"
          ? t("campaigns.modal.edit.noPublications")
          : t("campaigns.modal.add.noPublications")
      }
      noResultsMessage={t("common.noResults") || "No publications found"}
      getItemId={(pub) => pub.id}
      getSearchableText={(pub) => pub.title || pub.name || ""}
      disabled={disabled}
      maxHeight={maxHeight}
      renderItem={(pub, isSelected) => {
        const thumbnail = getThumbnail(pub);

        return (
          <div
            className={`flex cursor-pointer items-center gap-3 rounded border p-2 transition-all ${
              disabled ? "cursor-default opacity-60" : ""
            } ${
              isSelected
                ? "border-primary-500 bg-primary-50 shadow-sm dark:bg-primary-900/20"
                : "border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/50"
            }`}
          >
            <Checkbox isSelected={isSelected} disabled={disabled} />

            <PublicationThumbnail thumbnail={thumbnail} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {pub.title || pub.name || "Untitled"}
              </p>
            </div>
          </div>
        );
      }}
    />
  );
};

const Checkbox: React.FC<{ isSelected: boolean; disabled?: boolean }> = ({
  isSelected,
  disabled,
}) => (
  <div
    className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
      isSelected
        ? "border-primary-500 bg-primary-500"
        : disabled
          ? "border-gray-300 bg-gray-50"
          : "border-gray-400"
    }`}
  >
    {isSelected && <Check className="h-3 w-3 stroke-[3] text-white" />}
  </div>
);

const PublicationThumbnail: React.FC<{
  thumbnail: { url: string | null; type: string } | null;
}> = ({ thumbnail }) => {
  if (!thumbnail) return null;

  if (thumbnail.type === "image" && thumbnail.url) {
    return <img src={thumbnail.url} className="h-8 w-8 rounded object-cover" alt="Thumbnail" />;
  }

  if (thumbnail.type === "video") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary-500 to-primary-700">
        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      </div>
    );
  }

  return null;
};

export default PublicationSelector;

import Loader from "@/Components/common/Loader";
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
}) => {
  if (loading) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        <Loader />
        {t("campaigns.modal.add.loadingPublications")}
      </div>
    );
  }

  if (publications.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        {mode === "edit"
          ? t("campaigns.modal.edit.noPublications")
          : t("campaigns.modal.add.noPublications")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {publications.map((pub) => {
        const isSelected = selectedIds.includes(pub.id);
        const thumbnail = getThumbnail(pub);

        return (
          <div
            key={pub.id}
            onClick={() => !disabled && onTogglePublication(pub.id)}
            className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all ${disabled ? "opacity-60 cursor-default" : ""} ${
              isSelected
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                : "border-gray-200 bg-white hover:border-primary-300 dark:border-neutral-700 dark:bg-neutral-800 hover:bg-gray-50"
            }`}
          >
            <Checkbox isSelected={isSelected} disabled={disabled} />

            <PublicationThumbnail thumbnail={thumbnail} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                {pub.title || pub.name || "Untitled"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Checkbox: React.FC<{ isSelected: boolean; disabled?: boolean }> = ({
  isSelected,
  disabled,
}) => (
  <div
    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
      isSelected
        ? "bg-primary-500 border-primary-500"
        : disabled
          ? "border-gray-300 bg-gray-50"
          : "border-gray-400"
    }`}
  >
    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
  </div>
);

const PublicationThumbnail: React.FC<{
  thumbnail: { url: string | null; type: string } | null;
}> = ({ thumbnail }) => {
  if (!thumbnail) return null;

  if (thumbnail.type === "image" && thumbnail.url) {
    return (
      <img
        src={thumbnail.url}
        className="w-8 h-8 rounded object-cover"
        alt="Thumbnail"
      />
    );
  }

  if (thumbnail.type === "video") {
    return (
      <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      </div>
    );
  }

  return null;
};

export default PublicationSelector;

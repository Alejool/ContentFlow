import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatSpeed, formatTime } from "@/Utils/formatters";

interface UploadItemProps {
  upload: {
    id: string;
    file: { name: string };
    progress: number;
    status: "uploading" | "pending" | "completed" | "error";
    error?: string;
    stats?: { speed?: number; eta?: number };
  };
  onRemove: (id: string) => void;
}

export function UploadItem({ upload, onRemove }: UploadItemProps) {
  const { t } = useTranslation();

  // Ensure progress is a valid number between 0-100
  const progress = Math.min(100, Math.max(0, Math.round(upload.progress || 0)));

  const getProgressColor = () => {
    switch (upload.status) {
      case "error":
        return "bg-red-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-primary";
    }
  };

  const getStatusText = () => {
    if (upload.status === "uploading" && upload.stats?.eta) {
      return `~${formatTime(upload.stats.eta)} ${t("publications.modal.upload.left", { defaultValue: "restante" })}`;
    }
    if (upload.status === "error") return upload.error;
    if (upload.status === "completed") return t("publications.modal.upload.done", { defaultValue: "Listo" });
    return t("publications.modal.upload.pending", { defaultValue: "Pendiente" });
  };

  return (
    <div className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0 group">
      <div className="flex justify-between items-start mb-2">
        <span
          className="text-xs font-medium truncate max-w-[200px] text-neutral-900 dark:text-neutral-100"
          title={upload.file.name}
        >
          {upload.file.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(upload.id);
          }}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 bg-gray-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 w-10 text-right">
          {progress}%
        </span>
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 dark:text-neutral-400">
        <span>
          {upload.status === "uploading" && upload.stats?.speed
            ? formatSpeed(upload.stats.speed)
            : ""}
        </span>
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
}

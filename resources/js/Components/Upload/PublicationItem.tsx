import { Publication } from "@/types/Publication";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlatformProgress } from "./PlatformProgress";

interface PublicationItemProps {
  publication: Publication;
  onCancel: (e: React.MouseEvent, id: number) => void;
  onDismiss: (e: React.MouseEvent, id: number) => void;
}

export function PublicationItem({ publication, onCancel, onDismiss }: PublicationItemProps) {
  const { t } = useTranslation();

  const getStatusIcon = () => {
    switch (publication.status) {
      case "failed":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      case "publishing":
      case "processing":
        return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    }
  };

  const getStatusBadge = () => {
    const badges = {
      publishing: {
        text: t("common.publishing") || "Publicando",
        className: "bg-primary/10 text-primary dark:bg-primary/20",
      },
      published: {
        text: t("common.success") || "Éxito",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      },
      failed: {
        text: t("common.failed") || "Falló",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      },
    };

    const badge = badges[publication.status as keyof typeof badges];
    if (!badge) return null;

    return (
      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const canCancel = publication.status === "publishing" || publication.status === "processing";
  const canDismiss = publication.status === "failed" || publication.status === "published";

  return (
    <div className="p-3 border-b border-gray-100 dark:border-neutral-700 last:border-0 group">
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon()}
        <span
          className="text-xs font-medium truncate text-neutral-900 dark:text-neutral-100 flex-1"
          title={publication.title}
        >
          {publication.title}
        </span>
        <div className="flex items-center gap-1.5">
          {canDismiss && (
            <button
              onClick={(e) => onDismiss(e, publication.id)}
              className="text-gray-400 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title={t("common.dismiss") || "Descartar"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {canCancel && (
            <button
              onClick={(e) => onCancel(e, publication.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title={t("publications.publish.button.cancel") || "Cancelar"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {getStatusBadge()}
        </div>
      </div>

      <PlatformProgress publication={publication} />
    </div>
  );
}

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Globe,
  Rocket,
  Trash2,
} from "lucide-react";

interface ContentCardProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onViewDetails?: (item: any) => void;
  onPublish?: (item: any) => void;
  type: "publication" | "campaign";
  permissions?: string[];
}

export default function ContentCard({
  item,
  onEdit,
  onDelete,
  onViewDetails,
  onPublish,
  type,
  permissions,
}: ContentCardProps) {
  const canManageContent = permissions?.includes("manage-content");
  const canPublish = permissions?.includes("publish");

  const statusColors = {
    published:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    scheduled:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusKey = (item.status || "draft") as keyof typeof statusColors;
  const StatusIcon =
    {
      published: CheckCircle,
      draft: Edit,
      scheduled: Calendar,
      failed: AlertCircle,
    }[statusKey] || Edit;

  // Determine thumbnail and if it's a video
  const mediaFile = item.media_files?.[0];
  const isVideo = mediaFile?.file_type?.includes("video");
  const thumbnail =
    mediaFile?.thumbnail?.file_path || mediaFile?.file_path || item.thumbnail;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
      {/* Image / Thumbnail Section */}
      <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {thumbnail ? (
          <div className="relative w-full h-full">
            <img
              src={thumbnail}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <div className="bg-white/90 dark:bg-gray-900/90 p-2.5 rounded-full shadow-lg backdrop-blur-sm transform group-hover:scale-110 transition-transform">
                  <Rocket className="w-5 h-5 text-primary-600 fill-primary-600" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {type === "campaign" ? (
              <Globe className="w-12 h-12 opacity-20" />
            ) : (
              <Eye className="w-12 h-12 opacity-20" />
            )}
          </div>
        )}

        {/* Overlay Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm backdrop-blur-md ${statusColors[statusKey] || statusColors.draft}`}
          >
            {/* @ts-ignore */}
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="capitalize">{item.status}</span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {item.title || "Untitled"}
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            {item.scheduled_at && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {format(new Date(item.scheduled_at), "d MMM, HH:mm", {
                    locale: es,
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              {/* Platform icons could go here */}
              {type === "campaign" && (
                <span>{item.publications_count || 0} Pubs</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-1 mt-auto">
          <div className="flex items-center gap-1 flex-1">
            {type === "publication" &&
              canManageContent &&
              (canPublish || item.status === "approved" ? (
                <button
                  onClick={() => onPublish?.(item)}
                  className="flex items-center justify-center gap-2 p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg transition-all font-bold text-sm flex-1"
                  title={
                    item.status === "approved"
                      ? "Publicar"
                      : "Publicar / Gestionar"
                  }
                >
                  <Rocket className="w-4 h-4" />
                  Publicar
                </button>
              ) : !canPublish &&
                ["draft", "failed", "rejected"].includes(
                  item.status || "draft",
                ) ? (
                <button
                  onClick={() => onPublish?.(item)}
                  className="flex items-center justify-center gap-2 p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg transition-all font-bold text-sm flex-1"
                  title="Solicitar Aprobación"
                >
                  <Clock className="w-4 h-4" />
                  Solicitar
                </button>
              ) : item.status === "published" ? (
                <button
                  onClick={() => onViewDetails?.(item)}
                  className="flex items-center justify-center gap-2 p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-neutral-800 dark:text-neutral-400 rounded-lg transition-all font-bold text-sm flex-1"
                  title="Ver Detalles"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
              ) : null)}
            {/* View Details button for Viewers (no manage-content permission) */}
            {!canManageContent &&
              (type === "publication" || type === "campaign") && (
                <button
                  onClick={() => onViewDetails?.(item)}
                  className="flex items-center justify-center gap-2 p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-neutral-800 dark:text-neutral-400 rounded-lg transition-all font-bold text-sm flex-1"
                  title="Ver Detalles"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalles
                </button>
              )}
            {canManageContent && (
              <button
                onClick={() => onEdit(item)}
                className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors font-bold text-sm px-3"
                title="Editar"
              >
                Editar
              </button>
            )}
          </div>

          {/* Delete button - Only for Owner/Admin */}
          <div className="flex items-center gap-1">
            {canPublish && canManageContent && (
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors font-bold text-sm"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

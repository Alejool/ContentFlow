import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Image as ImageIcon,
  Rocket,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const canManageContent = permissions?.includes("manage-content");
  const canPublish = permissions?.includes("publish");

  const statusColors = {
    published:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    scheduled:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    pending_review:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    approved:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    publishing:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const statusKey = (item.status || "draft") as keyof typeof statusColors;
  const StatusIcon =
    {
      published: CheckCircle,
      draft: Edit,
      scheduled: Calendar,
      failed: Clock,
      pending_review: Clock,
      approved: CheckCircle,
      rejected: Clock,
      publishing: Clock,
    }[statusKey] || Edit;

  // Check if there are media files
  const hasMedia = item.media_files && item.media_files.length > 0;
  const firstMedia = hasMedia ? item.media_files[0] : null;
  const isVideo = firstMedia?.file_type?.includes("video");
  const mediaUrl =
    firstMedia?.thumbnail?.file_path || firstMedia?.file_path || item.thumbnail;

  // Get platform icons for publication
  const getPlatformIcons = () => {
    if (!item.accounts || !Array.isArray(item.accounts)) return null;

    return (
      <div className="flex items-center gap-1">
        {item.accounts.slice(0, 3).map((account: any, index: number) => (
          <div
            key={index}
            className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
            title={account.provider}
          >
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {account.provider?.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
        {item.accounts.length > 3 && (
          <span className="text-xs text-gray-500">
            +{item.accounts.length - 3}
          </span>
        )}
      </div>
    );
  };

  const [imageError, setImageError] = useState(false);

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
      {hasMedia && mediaUrl && (
        <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="relative w-full h-full">
            {!imageError ? (
              <img
                src={mediaUrl}
                alt={item.title || "Media"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-gray-300 dark:bg-gray-600 mb-2 mx-auto w-12 h-12 flex items-center justify-center text-gray-500">
                    {isVideo ? (
                      <Video className="w-6 h-6" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isVideo ? "Video" : "Imagen"}
                  </span>
                </div>
              </div>
            )}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <div className="bg-white/90 dark:bg-gray-900/90 p-2.5 rounded-full shadow-lg backdrop-blur-sm">
                  <Video className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            )}
          </div>

          <div className="absolute top-3 right-3 z-10">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm backdrop-blur-md border border-white/20 ${statusColors[statusKey] || statusColors.draft}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span className="capitalize">
                {type === "campaign"
                  ? t(`campaigns.filters.${item.status || "active"}`)
                  : t(`publications.status.${item.status || "draft"}`)}
              </span>
            </span>
          </div>
        </div>
      )}

      {!hasMedia && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${type === "campaign" ? "bg-orange-100 dark:bg-orange-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}
              >
                {type === "campaign" ? (
                  <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                {type === "campaign" ? "Campaña" : "Publicación"}
              </span>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusColors[statusKey] || statusColors.draft}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span className="capitalize">
                {type === "campaign"
                  ? t(`campaigns.filters.${item.status || "active"}`)
                  : t(`publications.status.${item.status || "draft"}`)}
              </span>
            </span>
          </div>

          <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {item.title ? item.title : (item.name ?? "Sin título")}
          </h3>
        </div>
      )}

      <div className={`${hasMedia ? "p-4" : "px-4 pb-4"} flex-1 flex flex-col`}>
        {hasMedia && (
          <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {item.title ? item.title : (item.name ?? "Sin título")}
          </h3>
        )}

        <div className="mb-3 flex-1">
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 break-words">
            {item.content?.substring(0, 120) || "Sin contenido"}
            {(item.content?.length || 0) > 120 && "..."}
          </p>
        </div>

        <div className="space-y-2 mt-auto">
          {type === "publication" &&
            item.accounts &&
            item.accounts.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Plataformas:
                  </span>
                  {getPlatformIcons()}
                </div>
              </div>
            )}

          {type === "campaign" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {item.publications_count || 0} publicaciones
                </span>
              </div>
              {item.engagement_rate && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {item.engagement_rate}% engagement
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            {item.scheduled_at ? (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {format(new Date(item.scheduled_at), "d MMM, HH:mm", {
                    locale: es,
                  })}
                </span>
              </div>
            ) : (
              item.created_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {format(new Date(item.created_at), "d MMM yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
              )
            )}

            {type === "publication" && hasMedia && (
              <div className="flex items-center gap-1">
                {isVideo ? (
                  <Video className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.media_files.length}{" "}
                  {item.media_files.length === 1 ? "archivo" : "archivos"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          {type === "publication" && canManageContent && (
            <>
              {canPublish || item.status === "approved" ? (
                <button
                  onClick={() => onPublish?.(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all shadow-sm shadow-orange-200 dark:shadow-none text-sm font-semibold"
                  title="Publicar ahora"
                >
                  <Rocket className="w-4 h-4" />
                  <span className="hidden sm:inline">Publicar</span>
                </button>
              ) : !canPublish &&
                ["draft", "failed", "rejected"].includes(
                  item.status || "draft",
                ) ? (
                <button
                  onClick={() => onPublish?.(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
                  title="Solicitar aprobación"
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Solicitar</span>
                </button>
              ) : item.status === "published" ? (
                <button
                  onClick={() => onViewDetails?.(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 border border-gray-200 hover:border-orange-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-semibold shadow-sm"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Ver</span>
                </button>
              ) : (
                <button
                  onClick={() => onViewDetails?.(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 border border-gray-200 hover:border-orange-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-semibold shadow-sm"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Ver</span>
                </button>
              )}
            </>
          )}

          {(!canManageContent || type === "campaign") && (
            <button
              onClick={() => onViewDetails?.(item)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-700 border border-gray-200 hover:border-orange-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-semibold shadow-sm"
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
              Detalles
            </button>
          )}

          {canManageContent && (
            <button
              onClick={() => onEdit(item)}
              className="flex items-center justify-center px-3 py-2 bg-white hover:bg-orange-50 text-gray-500 hover:text-orange-600 border border-gray-200 hover:border-orange-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {canManageContent && (
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center justify-center px-3 py-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import SocialAccountsDisplay from "@/Components/Content/Publication/SocialAccountsDisplay";
import { formatDateTime } from "@/Utils/formatDate";
import { Publication } from "@/types/Publication";
import axios from "axios";
import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Eye,
  Image as ImageIcon,
  Loader2,
  Lock,
  MoreVertical,
  Rocket,
  Trash2,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import React, { memo, useCallback, useState } from "react";
import { toast } from "react-hot-toast";

interface PublicationMobileRowProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: any[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  onDuplicate?: (id: number) => void;
  remoteLocks?: Record<
    number,
    { user_id: number; user_name: string; expires_at: string }
  >;
  permissions?: string[];
  onPreviewMedia?: (
    media: {
      url: string;
      type: "image" | "video";
      title?: string;
    }[],
    initialIndex?: number,
  ) => void;
}

const PublicationMobileRow = memo(
  ({
    items,
    t,
    connectedAccounts,
    getStatusColor,
    onEdit,
    onDelete,
    onPublish,
    onEditRequest,
    onViewDetails,
    onDuplicate,
    remoteLocks = {},
    permissions,
    onPreviewMedia,
  }: PublicationMobileRowProps) => {
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [loadingStates, setLoadingStates] = useState<
      Record<
        number,
        { publishing?: boolean; editing?: boolean; deleting?: boolean }
      >
    >({});

    const countMediaFiles = useCallback((pub: Publication) => {
      if (
        !pub.media_files ||
        !Array.isArray(pub.media_files) ||
        pub.media_files.length === 0
      ) {
        return { images: 0, videos: 0, total: 0 };
      }
      let images = 0;
      let videos = 0;
      pub.media_files.forEach((f) => {
        if (!f || !f.file_type) return;
        if (f.file_type.includes("image")) images++;
        else if (f.file_type.includes("video")) videos++;
      });
      return { images, videos, total: pub.media_files.length };
    }, []);

    // Check for media to show inline
    const hasMedia = (item: Publication) => {
      return item.media_files && item.media_files.length > 0;
    };

    const getFirstMedia = (item: Publication) => {
      if (!hasMedia(item)) return null;
      return item.media_files?.[0];
    };

    const toggleExpand = (id: number) => {
      setExpandedRow((prev) => (prev === id ? null : id));
    };

    const handleRowClick = (id: number, event: React.MouseEvent) => {
      if ((event.target as HTMLElement).closest("button")) {
        return;
      }
      toggleExpand(id);
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "published":
          return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
        case "publishing":
          return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
        case "scheduled":
          return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
        case "failed":
          return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
        case "pending_review":
          return <Clock className="w-3.5 h-3.5 text-amber-500" />;
        case "approved":
          return <CheckCircle className="w-3.5 h-3.5 text-purple-500" />;
        case "rejected":
          return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
        default:
          return <Clock className="w-3.5 h-3.5 text-gray-500" />;
      }
    };

    const getStatusText = (status: string) => {
      return t(`publications.status.${status || "draft"}`);
    };

    const formatDate = (dateString?: string) => {
      if (!dateString) return "";
      try {
        return formatDateTime(dateString);
      } catch {
        return "";
      }
    };

    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

    const handleImageError = (id: number) => {
      setImageErrors((prev) => ({ ...prev, [id]: true }));
    };

    return (
      <div className="w-full space-y-3 px-1">
        {items.map((item) => {
          const mediaCount = countMediaFiles(item);
          const isExpanded = expandedRow === item.id;
          const isLoading = loadingStates[item.id];
          const firstMedia = getFirstMedia(item);
          const isVideo = firstMedia?.file_type?.includes("video");
          const mediaUrl =
            firstMedia?.thumbnail?.file_path || firstMedia?.file_path;
          const hasImageError = imageErrors[item.id];
          const lock = remoteLocks[item.id];
          const lockedByName = lock
            ? lock.user_name || (lock as any).user?.name || "Usuario"
            : "";

          return (
            <div
              key={item.id}
              onClick={(e) => handleRowClick(item.id, e)}
              className={`
                relative overflow-hidden rounded-lg border transition-all duration-300
                ${
                  isExpanded
                    ? "bg-white dark:bg-neutral-800 border-primary-200 dark:border-primary-900/40 shadow-md ring-1 ring-primary-500/10"
                    : "bg-white/80 dark:bg-neutral-900/80 border-gray-100 dark:border-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700 shadow-sm"
                }
              `}
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "0 88px",
              }}
            >
              {/* Header Content */}
              <div className="p-4 flex items-start gap-3">
                {/* Thumbnail with media preview */}
                <div
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger preview
                    if (hasMedia(item) && onPreviewMedia) {
                      const allMedia = (item.media_files || []).map(
                        (media: any) => {
                          const isV = media.file_type?.includes("video");
                          let mUrl =
                            media.thumbnail?.file_path || media.file_path;

                          if (!mUrl && media.file_type === "image") {
                            mUrl = media.file_path;
                          }

                          return {
                            url: isV
                              ? media.file_path.startsWith("http")
                                ? media.file_path
                                : `/storage/${media.file_path}`
                              : mUrl.startsWith("http")
                                ? mUrl
                                : `/storage/${mUrl}`,
                            type: (isV ? "video" : "image") as
                              | "image"
                              | "video",
                            title: item.title,
                          };
                        },
                      );

                      onPreviewMedia(allMedia, 0);
                    } else {
                      // If no media or preview handler, specific fallback logic or just toggle row?
                      // Let's toggle row if not previewable
                      if (!hasMedia(item)) toggleExpand(item.id);
                    }
                  }}
                >
                  {hasMedia(item) && mediaUrl ? (
                    <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 overflow-hidden shadow-sm">
                      {(item as any).type === "user_event" ? (
                        <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center shadow-sm">
                          <Calendar className="w-8 h-8 text-primary-500" />
                        </div>
                      ) : !hasImageError ? (
                        <img
                          src={mediaUrl}
                          alt={item.title || "Preview"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => handleImageError(item.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800 text-gray-400">
                          {isVideo ? (
                            <Video className="w-6 h-6" />
                          ) : (
                            <ImageIcon className="w-6 h-6" />
                          )}
                        </div>
                      )}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {mediaCount.total > 1 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] flex items-center justify-center border border-white">
                          +{mediaCount.total - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/30 flex items-center justify-center shadow-sm">
                      <div className="text-center">
                        <ImageIcon className="w-6 h-6 text-gray-300 dark:text-neutral-700 mx-auto" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate leading-tight">
                        {item.title || t("publications.table.untitled")}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words line-clamp-2">
                        {item.description || "Sin descripción"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(item as any).type === "user_event" &&
                        permissions?.includes("manage-content") && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setLoadingStates((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], deleting: true },
                              }));
                              try {
                                if (
                                  confirm(
                                    t(
                                      "calendar.userEvents.modal.messages.confirmDelete",
                                    ) ||
                                      "¿Estás seguro de que deseas eliminar este evento?",
                                  )
                                ) {
                                  await axios.delete(
                                    `/api/v1/calendar/user-events/${item.id}`,
                                  );
                                  toast.success(
                                    t(
                                      "calendar.userEvents.modal.messages.successDelete",
                                    ) || "Evento eliminado",
                                  );
                                  onDelete(item.id);
                                }
                              } catch (error) {
                                console.error("Delete failed", error);
                                toast.error("Error al eliminar");
                              } finally {
                                setLoadingStates((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    deleting: false,
                                  },
                                }));
                              }
                            }}
                            disabled={isLoading?.deleting}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20 disabled:opacity-50 transition-all"
                            title="Eliminar evento"
                          >
                            {isLoading?.deleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(item.id);
                        }}
                        className={`p-1 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Creator info for events */}
                  {(item as any).type === "user_event" && item.user && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 italic">
                        Creado por: {item.user.name}
                      </span>
                    </div>
                  )}

                  {/* Status and metadata row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status || "draft")}
                      <span className="font-medium">
                        {getStatusText(item.status || "draft")}
                      </span>
                    </span>

                    {/* Media indicators */}
                    {hasMedia(item) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {mediaCount.images > 0 && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-blue-500" />
                            <span>{mediaCount.images}</span>
                          </div>
                        )}
                        {mediaCount.videos > 0 && (
                          <div className="flex items-center gap-1">
                            <Video className="w-3 h-3 text-purple-500" />
                            <span>{mediaCount.videos}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scheduled time */}
                    {item.scheduled_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.scheduled_at)}</span>
                      </div>
                    )}

                    {/* Event indicators */}
                    {((item as any).type === "user_event" ||
                      (item.scheduled_at && item.status !== "published")) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {(item as any).type === "user_event"
                            ? "Evento Manual"
                            : "Evento Red Social"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lock indicator */}
                  {remoteLocks[item.id] && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 w-full animate-in fade-in slide-in-from-top-1">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400">
                        <Lock className="w-3 h-3" />
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Editando: {lockedByName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions bar */}
              <div className="px-4 pb-4 flex items-center gap-2">
                {/* View Details button - Always visible */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(item);
                  }}
                  className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>

                {/* Duplicate button */}
                {permissions?.includes("manage-content") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.(item.id);
                    }}
                    disabled={
                      isLoading?.publishing ||
                      isLoading?.editing ||
                      isLoading?.deleting
                    }
                    className="flex-1 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicar
                  </button>
                )}

                {/* Publish/Request button */}
                {(permissions?.includes("publish") ||
                  item.status === "approved") &&
                permissions?.includes("manage-content") ? (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setLoadingStates((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], publishing: true },
                      }));
                      try {
                        await onPublish(item);
                      } finally {
                        setLoadingStates((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], publishing: false },
                        }));
                      }
                    }}
                    disabled={
                      isLoading?.publishing ||
                      isLoading?.editing ||
                      isLoading?.deleting
                    }
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    title="Publicar"
                  >
                    {isLoading?.publishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4" />
                    )}
                    Publicar
                  </button>
                ) : permissions?.includes("manage-content") &&
                  !permissions?.includes("publish") &&
                  ["draft", "failed", "rejected"].includes(
                    item.status || "draft",
                  ) ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublish?.(item);
                    }}
                    className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                    title="Solicitar aprobación"
                  >
                    <Clock className="w-4 h-4" />
                    Solicitar
                  </button>
                ) : null}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="pt-4 border-t border-gray-100 dark:border-neutral-700/50 space-y-4">
                    {/* Additional info */}
                    <div className="space-y-3">
                      {/* User info */}
                      {item.user && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            {item.user.photo_url ? (
                              <img
                                src={item.user.photo_url}
                                alt={item.user.name}
                                className="h-full w-full rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs font-bold text-white uppercase">
                                {item.user.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Usuario
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Platform badges */}
                      {item.platform_settings &&
                        typeof item.platform_settings === "object" &&
                        !Array.isArray(item.platform_settings) &&
                        Object.keys(item.platform_settings).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                              Plataformas:
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.keys(item.platform_settings).map(
                                (platform) => (
                                  <span
                                    key={platform}
                                    className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 font-medium"
                                  >
                                    {platform.charAt(0).toUpperCase() +
                                      platform.slice(1)}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Campaigns */}
                      {item.campaigns && item.campaigns.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                            <Users className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              En {item.campaigns.length}{" "}
                              {item.campaigns.length === 1
                                ? "campaña"
                                : "campañas"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Accounts */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Cuentas vinculadas:
                        </h4>
                        <SocialAccountsDisplay
                          publication={item}
                          connectedAccounts={connectedAccounts}
                          compact={true}
                          t={t}
                        />
                      </div>
                    </div>

                    {/* Expanded actions */}
                    <div className="flex items-center gap-2">
                      {/* View Button (Expanded) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(item);
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors active:scale-95"
                        title="Ver detalles completos"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>

                      {/* Edit button */}
                      {permissions?.includes("manage-content") && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (remoteLocks[item.id]) {
                              toast.error(
                                `${t("publications.table.lockedBy") || "Editando por"} ${lockedByName}`,
                              );
                              return;
                            }
                            setLoadingStates((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], editing: true },
                            }));
                            try {
                              if (onEditRequest) {
                                await onEditRequest(item);
                              } else {
                                await onEdit(item);
                              }
                            } finally {
                              setLoadingStates((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], editing: false },
                              }));
                            }
                          }}
                          disabled={
                            isLoading?.publishing ||
                            isLoading?.editing ||
                            isLoading?.deleting ||
                            !!remoteLocks[item.id]
                          }
                          className={`flex-1 py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 ${
                            remoteLocks[item.id]
                              ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          } disabled:opacity-70`}
                          title={
                            remoteLocks[item.id]
                              ? `Editando por ${lockedByName}`
                              : (item.status as string) === "processing"
                                ? "Procesando..."
                                : "Editar"
                          }
                        >
                          {isLoading?.editing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : remoteLocks[item.id] ? (
                            <Lock className="w-4 h-4" />
                          ) : (item.status as string) === "processing" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Edit className="w-4 h-4" />
                          )}
                          {remoteLocks[item.id] ||
                          (item.status as string) === "processing"
                            ? (item.status as string) === "processing"
                              ? "Procesando"
                              : "Bloqueado"
                            : t("common.edit")}
                        </button>
                      )}

                      {/* Delete button */}
                      {permissions?.includes("publish") &&
                        permissions?.includes("manage-content") && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setLoadingStates((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  deleting: true,
                                },
                              }));
                              try {
                                if ((item as any).type === "user_event") {
                                  if (
                                    confirm(
                                      t(
                                        "calendar.userEvents.modal.messages.confirmDelete",
                                      ) ||
                                        "¿Estás seguro de que deseas eliminar este evento?",
                                    )
                                  ) {
                                    await axios.delete(
                                      `/api/v1/calendar/user-events/${item.id}`,
                                    );
                                    toast.success(
                                      t(
                                        "calendar.userEvents.modal.messages.successDelete",
                                      ) || "Evento eliminado",
                                    );
                                    onDelete(item.id);
                                  }
                                } else {
                                  await onDelete(item.id);
                                }
                              } catch (error) {
                                console.error("Delete failed", error);
                                toast.error("Error al eliminar");
                              } finally {
                                setLoadingStates((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    deleting: false,
                                  },
                                }));
                              }
                            }}
                            disabled={
                              isLoading?.publishing ||
                              isLoading?.editing ||
                              isLoading?.deleting
                            }
                            className="flex-1 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 font-medium text-xs flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-50"
                            title="Eliminar"
                          >
                            {isLoading?.deleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Eliminar
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

export default PublicationMobileRow;

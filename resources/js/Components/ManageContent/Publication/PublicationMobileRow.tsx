import PublicationThumbnail from "@/Components/ManageContent/Publication/PublicationThumbnail";
import SocialAccountsDisplay from "@/Components/ManageContent/Publication/SocialAccountsDisplay";
import { Publication } from "@/types/Publication";
import {
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Folder,
  Image,
  Loader2,
  MoreVertical,
  Rocket,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";
import React, { Fragment, useState, memo, useCallback } from "react";

interface PublicationMobileRowProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: any[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  remoteLocks?: Record<number, { user_id: number; user_name: string; expires_at: string }>;
}

const PublicationMobileRow = memo(({
  items,
  t,
  connectedAccounts,
  getStatusColor,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
  remoteLocks = {},
}: PublicationMobileRowProps) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<number, { publishing?: boolean; editing?: boolean; deleting?: boolean }>>({});

  const countMediaFiles = useCallback((pub: Publication) => {
    if (!pub.media_files || !Array.isArray(pub.media_files) || pub.media_files.length === 0) {
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

  const toggleExpand = (id: number) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  const handleRowClick = (id: number, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    toggleExpand(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published": return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case "failed": return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="w-full space-y-3 px-1">
      {items.map((item) => {
        const mediaCount = countMediaFiles(item);
        const isExpanded = expandedRow === item.id;
        const isLoading = loadingStates[item.id];

        return (
          <div
            key={item.id}
            onClick={(e) => handleRowClick(item.id, e)}
            className={`
              relative overflow-hidden rounded-2xl border transition-all duration-300
              ${isExpanded
                ? "bg-white dark:bg-neutral-800 border-primary-200 dark:border-primary-900/40 shadow-md ring-1 ring-primary-500/10"
                : "bg-white/80 dark:bg-neutral-900/80 border-gray-100 dark:border-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700 shadow-sm"}
            `}
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "0 88px",
            }}
          >
            {/* Header Content */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 border border-gray-100 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shadow-sm">
                  <PublicationThumbnail publication={item} t={t} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">
                    {item.title || t("publications.table.untitled")}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status || "draft")}
                      {item.status || "Draft"}
                    </span>
                    {mediaCount.total > 0 && (
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        {mediaCount.total} •
                        {mediaCount.images > 0 && <Image className="w-2.5 h-2.5" />}
                        {mediaCount.videos > 0 && <Video className="w-2.5 h-2.5" />}
                      </span>
                    )}
                    {remoteLocks[item.id] && (
                      <span className="flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="text-[10px] font-bold text-amber-500 uppercase">{remoteLocks[item.id].user_name.split(' ')[0]}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setLoadingStates(prev => ({ ...prev, [item.id]: { ...prev[item.id], publishing: true } }));
                    try { await onPublish(item); } finally { setLoadingStates(prev => ({ ...prev, [item.id]: { ...prev[item.id], publishing: false } })); }
                  }}
                  disabled={isLoading?.publishing || isLoading?.editing || isLoading?.deleting}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl dark:hover:bg-emerald-900/20 disabled:opacity-50 transition-colors"
                >
                  {isLoading?.publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                </button>
                <div className={`p-1.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="pt-4 border-t border-gray-100 dark:border-neutral-700/50 space-y-4">
                  {item.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-neutral-800/30 p-3 rounded-xl border border-gray-100 dark:border-neutral-700/50">
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t("publications.table.linkedAccount")}</h4>
                      <SocialAccountsDisplay publication={item} connectedAccounts={connectedAccounts} compact={true} />
                    </div>
                    {item.campaigns && item.campaigns.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t("campaigns.title")}</h4>
                        <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30">
                          {item.campaigns.length} {item.campaigns.length === 1 ? "Camp" : "Camps"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingStates(prev => ({ ...prev, [item.id]: { ...prev[item.id], editing: true } }));
                        try { onEditRequest ? await onEditRequest(item) : await onEdit(item); } finally { setLoadingStates(prev => ({ ...prev, [item.id]: { ...prev[item.id], editing: false } })); }
                      }}
                      disabled={isLoading?.publishing || isLoading?.editing || isLoading?.deleting || !!remoteLocks[item.id]}
                      className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-900/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isLoading?.editing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit className="w-3.5 h-3.5" />}
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingStates(prev => ({ ...prev, [item.id]: { ...prev[item.id], deleting: true } }));
                        try { await onDelete(item.id); } finally { setLoadingStates(prev => ({ ...prev, [item.id]: { ...prev[item.id], deleting: false } })); }
                      }}
                      disabled={isLoading?.publishing || isLoading?.editing || isLoading?.deleting}
                      className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 transition-all active:scale-95"
                    >
                      {isLoading?.deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default PublicationMobileRow;

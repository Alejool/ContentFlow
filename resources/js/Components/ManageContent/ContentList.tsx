import CampaignTable from "@/Components/Content/Campaign/CampaignTable";
import PublicationTable from "@/Components/Content/Publication/PublicationTable";
import FilterSection from "@/Components/Content/common/FilterSection";
import Button from "@/Components/common/Modern/Button";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import EmptyState from "@/Components/common/ui/EmptyState";
import { VirtualGrid } from "@/Components/common/ui/VirtualList";
import { useLockStore } from "@/stores/lockStore";
import { Filter, LayoutGrid, List as ListIcon, RotateCcw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import ContentCard from "./ContentCard";
import ContentCardSkeleton from "./ContentCardSkeleton";

import MediaLightbox from "@/Components/common/ui/MediaLightbox";

interface ContentListProps {
  items: any[];
  mode: "publications" | "campaigns";
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onDuplicate?: (id: number) => void;
  onViewDetails?: (item: any) => void;
  onPublish?: (item: any) => void;
  isLoading: boolean;
  pagination: any;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  connectedAccounts?: any[];
  onEditRequest?: (item: any) => void;
  expandedCampaigns?: number[];
  toggleExpand?: (id: number) => void;
  permissions?: string[];
  title?: string;
  onRefresh?: () => void;
  showFilters?: boolean;
  onToggleFilters?: (show: boolean) => void;
  filters?: any;
  onFilterChange?: (key: string, val: any) => void;
  onResetFilters?: () => void;
  search?: string;
  onSearchChange?: (val: string) => void;
}

export default function ContentList(props: ContentListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();
  const { remoteLocks } = useLockStore();

  const { items, isLoading, mode, title, onRefresh } = props;
  const [smoothLoading, setSmoothLoading] = useState(true);
  const [lightboxMedia, setLightboxMedia] = useState<
    | {
        url: string;
        type: "image" | "video";
        title?: string;
      }[]
    | null
  >(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handlePreviewMedia = (
    media: { url: string; type: "image" | "video"; title?: string }[],
    index = 0,
  ) => {
    setLightboxMedia(media);
    setLightboxIndex(index);
  };

  useEffect(() => {
    if (isLoading) {
      setSmoothLoading(true);
    } else {
      const timer = setTimeout(() => {
        setSmoothLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    setSmoothLoading(true);
    const timer = setTimeout(() => {
      setSmoothLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [viewMode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        {title && (
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              loading={isLoading}
              icon={RotateCcw}
              className="text-gray-500 hover:text-primary-600"
              title={t("common.refresh")}
            >
              {""}
            </Button>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              variant="secondary"
              buttonStyle="outline"
              size="sm"
              onClick={() =>
                props.onToggleFilters &&
                props.onToggleFilters(!props.showFilters)
              }
              icon={Filter}
              className={
                props.showFilters
                  ? "bg-primary-50 border-primary-200 text-primary-600 ring-1 ring-primary-500/20"
                  : ""
              }
            >
              {t("common.filters.title") || "Filtros"}
            </Button>

            <div className="bg-gray-100/80 dark:bg-neutral-900/80 p-1 rounded-lg flex items-center gap-1 border border-white/20 dark:border-white/5 ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-sm shadow-inner">
              <Button
                variant="ghost"
                buttonStyle="ghost"
                size="sm"
                shadow="none"
                onClick={() => {
                  setSmoothLoading(true);
                  startTransition(() => setViewMode("grid"));
                }}
                className={`p-2 rounded-lg transition-all duration-300 ease-out border-0 ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-neutral-800 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10 text-primary-600 dark:text-primary-400 scale-[1.05]"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-neutral-700/30"
                }`}
                title={t("common.gridView")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                buttonStyle="ghost"
                size="sm"
                shadow="none"
                onClick={() => {
                  setSmoothLoading(true);
                  startTransition(() => setViewMode("list"));
                }}
                className={`p-2 rounded-lg transition-all duration-300 ease-out border-0 ${
                  viewMode === "list"
                    ? "bg-white dark:bg-neutral-800 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10 text-primary-600 dark:text-primary-400 scale-[1.05]"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-neutral-700/30"
                }`}
                title={t("common.listView")}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {props.showFilters && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <FilterSection
            mode={mode}
            t={t}
            search={props.search || ""}
            setSearch={props.onSearchChange || (() => {})}
            statusFilter={props.filters?.status || "all"}
            platformFilter={props.filters?.platform || []}
            sortFilter={props.filters?.sort || "newest"}
            dateStart={props.filters?.date_start || ""}
            dateEnd={props.filters?.date_end || ""}
            handleFilterChange={
              props.onFilterChange
                ? (key: string, val: any) => {
                    props.onFilterChange!(key, val);
                  }
                : () => {}
            }
            onResetFilters={props.onResetFilters}
            filters={props.filters}
          />
        </div>
      )}

      {!smoothLoading && items.length === 0 ? (
        <EmptyState
          title={t(`${mode}.table.emptyState.title`)}
          description={t(`${mode}.table.emptyState.description`)}
          className="mt-4"
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 grid-rows-1">
          <div
            className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
            style={{ height: "calc(100vh - 400px)", minHeight: "600px" }}
          >
            <VirtualGrid
              items={items}
              columns={4}
              overscan={2}
              renderItem={(item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  type={mode === "campaigns" ? "campaign" : "publication"}
                  onEdit={props.onEdit}
                  onDelete={props.onDelete}
                  onViewDetails={props.onViewDetails}
                  onPublish={props.onPublish}
                  permissions={props.permissions}
                  remoteLock={remoteLocks[item.id]}
                  onPreviewMedia={handlePreviewMedia}
                  onDuplicate={props.onDuplicate}
                />
              )}
            />
          </div>

          {smoothLoading && (
            <div className="col-start-1 row-start-1 bg-gray-50 dark:bg-neutral-900 animate-out fade-out duration-500 fill-mode-forwards z-20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <ContentCardSkeleton key={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800 w-full overflow-x-auto">
          {mode === "campaigns" ? (
            <CampaignTable
              {...props}
              isLoading={smoothLoading}
              t={t}
              expandedCampaigns={props.expandedCampaigns || []}
              toggleExpand={props.toggleExpand || (() => {})}
              onViewDetails={props.onViewDetails || (() => {})}
              onPerPageChange={props.onPerPageChange}
            />
          ) : (
            <PublicationTable
              {...props}
              isLoading={smoothLoading}
              t={t}
              connectedAccounts={props.connectedAccounts || []}
              onPublish={props.onPublish || (() => {})}
              onViewDetails={props.onViewDetails}
              onPerPageChange={props.onPerPageChange}
              remoteLocks={remoteLocks}
              onPreviewMedia={(item: any) => {
                const allM = (item.media_files || []).map((m: any) => ({
                  url: m.file_path.startsWith("http")
                    ? m.file_path
                    : `/storage/${m.file_path}`,
                  type: (m.file_type?.includes("video") ? "video" : "image") as
                    | "image"
                    | "video",
                  title: item.title,
                }));
                handlePreviewMedia(allM, 0);
              }}
            />
          )}
        </div>
      )}

      {viewMode === "grid" && props.pagination && (
        <AdvancedPagination
          currentPage={props.pagination.current_page}
          lastPage={props.pagination.last_page}
          total={props.pagination.total}
          perPage={props.pagination.per_page || 12}
          onPageChange={props.onPageChange}
          onPerPageChange={props.onPerPageChange || (() => {})}
          t={t}
        />
      )}

      <MediaLightbox
        isOpen={!!lightboxMedia}
        onClose={() => setLightboxMedia(null)}
        media={lightboxMedia}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}

import CampaignTable from "@/Components/Content/Campaign/CampaignTable";
import ContentCard from "@/Components/Content/ContentCard";
import ContentCardSkeleton from "@/Components/Content/ContentCardSkeleton";
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

import MediaLightbox from "@/Components/common/ui/MediaLightbox";

// Componente extraído fuera para evitar recreación en cada render
interface ContentGridItemProps {
  item: any;
  mode: "publications" | "campaigns";
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onDuplicate?: (id: number) => void;
  onViewDetails?: (item: any) => void;
  onPublish?: (item: any) => void;
  permissions?: string[];
  remoteLock: any;
  onPreviewMedia: (
    media: { url: string; type: "image" | "video"; title?: string }[],
    initialIndex?: number,
  ) => void;
}

function ContentGridItem({
  item,
  mode,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
  onPublish,
  permissions,
  remoteLock,
  onPreviewMedia,
}: ContentGridItemProps) {
  // Guard against undefined or null items
  if (!item || !item.id) {
    return null;
  }

  return (
    <ContentCard
      key={item.id}
      item={item}
      type={mode === "campaigns" ? "campaign" : "publication"}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetails={onViewDetails}
      onPublish={onPublish}
      permissions={permissions}
      remoteLock={remoteLock}
      onPreviewMedia={onPreviewMedia}
      onDuplicate={onDuplicate}
    />
  );
}

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
  const [smoothLoading, setSmoothLoading] = useState(isLoading);

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
    initialIndex: number = 0,
  ) => {
    setLightboxMedia(media);
    setLightboxIndex(initialIndex);
  };

  // Wrapper para renderItem que pasa las props necesarias
  const renderGridItem = (item: any, index: number) => (
    <ContentGridItem
      item={item}
      mode={mode}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
      onDuplicate={props.onDuplicate}
      onViewDetails={props.onViewDetails}
      onPublish={props.onPublish}
      permissions={props.permissions}
      remoteLock={remoteLocks[item?.id]}
      onPreviewMedia={handlePreviewMedia}
    />
  );

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
      <div className="mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {title && <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>}
        <div className="ml-auto flex items-center gap-2">
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

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              buttonStyle="outline"
              size="sm"
              onClick={() => props.onToggleFilters && props.onToggleFilters(!props.showFilters)}
              icon={Filter}
              className={
                props.showFilters
                  ? "border-primary-200 bg-primary-50 text-primary-600 ring-1 ring-primary-500/20"
                  : ""
              }
            >
              {t("common.filters.title") || "Filtros"}
            </Button>

            <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-gray-100/80 p-1 shadow-inner ring-1 ring-black/5 backdrop-blur-sm dark:border-white/5 dark:bg-neutral-900/80 dark:ring-white/5">
              <Button
                variant="ghost"
                buttonStyle="ghost"
                size="sm"
                shadow="none"
                onClick={() => {
                  setSmoothLoading(true);
                  startTransition(() => setViewMode("grid"));
                }}
                className={`rounded-lg border-0 p-2 transition-all duration-300 ease-out ${
                  viewMode === "grid"
                    ? "scale-[1.05] bg-white text-primary-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:bg-neutral-800 dark:text-primary-400 dark:ring-white/10"
                    : "text-gray-400 hover:bg-white/50 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-neutral-700/30 dark:hover:text-gray-300"
                }`}
                title={t("common.gridView")}
              >
                <LayoutGrid className="h-4 w-4" />
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
                className={`rounded-lg border-0 p-2 transition-all duration-300 ease-out ${
                  viewMode === "list"
                    ? "scale-[1.05] bg-white text-primary-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:bg-neutral-800 dark:text-primary-400 dark:ring-white/10"
                    : "text-gray-400 hover:bg-white/50 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-neutral-700/30 dark:hover:text-gray-300"
                }`}
                title={t("common.listView")}
              >
                <ListIcon className="h-4 w-4" />
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
            contentTypeFilter={props.filters?.content_type || []}
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
        <div className="flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="grid h-full grid-cols-1 grid-rows-1">
              <div
                className={`col-start-1 row-start-1 overflow-y-auto transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
              >
                <VirtualGrid items={items} columns={4} overscan={2} renderItem={renderGridItem} />
              </div>

              {smoothLoading && (
                <div className="animate-out fade-out fill-mode-forwards z-20 col-start-1 row-start-1 overflow-y-auto bg-gray-50 duration-500 dark:bg-neutral-900">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(12)].map((_, i) => (
                      <ContentCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {props.pagination && (
            <div className="mt-4 bg-white pt-4 dark:border-neutral-700 dark:bg-neutral-900">
              <AdvancedPagination
                currentPage={props.pagination.current_page}
                lastPage={props.pagination.last_page}
                total={props.pagination.total}
                perPage={props.pagination.per_page || 12}
                onPageChange={props.onPageChange}
                onPerPageChange={props.onPerPageChange || (() => {})}
                t={t}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full overflow-hidden overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
                  url: m.file_path.startsWith("http") ? m.file_path : `/storage/${m.file_path}`,
                  type: (m.file_type?.includes("video") ? "video" : "image") as "image" | "video",
                  title: item.title,
                }));
                handlePreviewMedia(allM, 0);
              }}
            />
          )}
        </div>
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

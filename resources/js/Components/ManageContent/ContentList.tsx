import CampaignTable from "@/Components/ManageContent/Campaign/CampaignTable"; // Reuse existing table
import PublicationTable from "@/Components/ManageContent/Publication/PublicationTable"; // Reuse existing table
import Pagination from "@/Components/ManageContent/common/Pagination";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ContentCard from "./ContentCard";
import ContentCardSkeleton from "./ContentCardSkeleton";

interface ContentListProps {
  items: any[];
  mode: "publications" | "campaigns";
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onViewDetails?: (item: any) => void;
  onPublish?: (item: any) => void;
  isLoading: boolean;
  pagination: any;
  onPageChange: (page: number) => void;
  connectedAccounts?: any[];
  // .. add other props needed for tables
  onEditRequest?: (item: any) => void;
  expandedCampaigns?: number[];
  toggleExpand?: (id: number) => void;
  permissions?: string[];
}

export default function ContentList(props: ContentListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isPending, startTransition] = React.useTransition();
  const { t } = useTranslation();

  const { items, isLoading, mode } = props;
  const [smoothLoading, setSmoothLoading] = React.useState(true); // Start true for initial mount

  React.useEffect(() => {
    if (isLoading) {
      setSmoothLoading(true);
    } else {
      const timer = setTimeout(() => {
        setSmoothLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Force smooth transition when viewMode changes
  React.useEffect(() => {
    setSmoothLoading(true);
    const timer = setTimeout(() => {
      setSmoothLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [viewMode]);

  if (!smoothLoading && (!items || items.length === 0)) {
    return (
      <div className="text-center py-20 text-gray-400 animate-in fade-in duration-500">
        No content found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end mb-2">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center gap-1">
          <button
            onClick={() => {
              setSmoothLoading(true);
              startTransition(() => setViewMode("grid"));
            }}
            className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSmoothLoading(true);
              startTransition(() => setViewMode("list"));
            }}
            className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
            title="List View"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 grid-rows-1">
          {/* Reality Layer */}
          <div
            className={`col-start-1 row-start-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
          >
            {items.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-400">
                No content found.
              </div>
            ) : (
              items.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  type={mode === "campaigns" ? "campaign" : "publication"}
                  onEdit={props.onEdit}
                  onDelete={props.onDelete}
                  onViewDetails={props.onViewDetails}
                  onPublish={props.onPublish}
                  permissions={props.permissions}
                />
              ))
            )}
          </div>

          {/* Skeleton Layer */}
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
            />
          ) : (
            <PublicationTable
              {...props}
              isLoading={smoothLoading}
              t={t}
              connectedAccounts={props.connectedAccounts || []}
              onPublish={props.onPublish || (() => {})}
            />
          )}
        </div>
      )}

      {props.pagination && props.pagination.last_page > 1 && (
        <div className="mt-6">
          <Pagination
            pagination={props.pagination}
            onPageChange={props.onPageChange}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

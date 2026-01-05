import React, { memo, useState, useCallback, useMemo, useEffect } from "react";
import PublicationDesktopRow from "@/Components/ManageContent/Publication/PublicationDesktopRow";
import PublicationMobileGrid from "@/Components/ManageContent/Publication/PublicationMobileGrid";
import PublicationMobileRow from "@/Components/ManageContent/Publication/PublicationMobileRow";
import { TableHeader } from "@/Components/ManageContent/Publication/TableHeader";
import Loader from "@/Components/common/Loader";
import { Publication } from "@/types/Publication";
import { Folder, Grid3x3, List } from "lucide-react";
import { useWorkspaceLocks } from "@/Hooks/usePublicationLock";
import { TableVirtuoso } from "react-virtuoso";

interface PublicationTableProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: any[];
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  isLoading?: boolean;
}

const PublicationTable = memo(({
  items,
  t,
  connectedAccounts,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
  isLoading,
}: PublicationTableProps) => {
  const { remoteLocks } = useWorkspaceLocks();
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | undefined>(undefined);

  useEffect(() => {
    const main = document.getElementsByTagName('main')[0];
    if (main) {
      setScrollContainer(main);
    }
  }, []);

  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "publishing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }, []);

  // Compute context for Virtuoso to avoid passing props deeply or re-creating callbacks needlessly if not needed
  // However, Virtuoso accepts a context prop.
  const context = useMemo(() => ({
    t,
    connectedAccounts,
    getStatusColor,
    onEdit,
    onDelete,
    onPublish,
    onEditRequest,
    remoteLocks
  }), [t, connectedAccounts, getStatusColor, onEdit, onDelete, onPublish, onEditRequest, remoteLocks]);

  return (
    <div className="relative">
      {/* 
          Removed fixed height to allow table to adjust to content height.
          We use customScrollParent to link with the main layout scroller.
      */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg transition-all duration-300 min-h-[200px]">
          <div className="flex flex-col items-center space-y-3">
            <Loader />
            <span className="text-sm text-gray-500 font-medium animate-pulse">
              {t("publications.table.loading")}
            </span>
          </div>
        </div>
      )}

      <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
        <div className="hidden lg:block">
          {items.length === 0 ? (
            <div className="p-12 text-center text-gray-500 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/20 mt-4 flex flex-col items-center justify-center">
              <Folder className="w-12 h-12 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t("publications.table.emptyState.title")}</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {t("publications.table.emptyState.description")}
              </p>
            </div>
          ) : (
            <TableVirtuoso
              data={items}
              context={context}
              customScrollParent={scrollContainer}
              className="w-full"
              components={{
                Table: (props) => <table {...props} className="w-full text-left border-collapse z-0" style={{ borderCollapse: 'collapse' }} />,
                TableHead: React.forwardRef((props, ref) => (
                  <thead {...props} ref={ref} className="bg-gray-50 border-gray-100 dark:bg-neutral-900 dark:border-neutral-800 sticky top-0 z-10" />
                )),
                TableRow: (props) => <tr {...props} className="border-b border-gray-50 dark:border-neutral-800 hover:bg-gray-50/50 dark:hover:bg-neutral-800/50" />,
              }}
              fixedHeaderContent={() => (
                <tr className="text-xs uppercase tracking-wider border-b bg-gray-50 border-gray-100 dark:bg-neutral-900 dark:border-neutral-800 text-gray-500 dark:text-gray-400">
                  <TableHeader mode="publications" t={t} />
                </tr>
              )}
              itemContent={(index, item, ctx) => (
                <PublicationDesktopRow
                  item={item}
                  t={ctx.t}
                  connectedAccounts={ctx.connectedAccounts}
                  getStatusColor={ctx.getStatusColor}
                  onEdit={ctx.onEdit}
                  onDelete={ctx.onDelete}
                  onPublish={ctx.onPublish}
                  onEditRequest={ctx.onEditRequest}
                  remoteLock={ctx.remoteLocks[item.id]}
                />
              )}
            />
          )}
        </div>

        <div className="lg:hidden">
          {items.length > 0 ? (
            <div className="animate-in fade-in duration-500">
              <PublicationMobileRow
                items={items}
                t={t}
                connectedAccounts={connectedAccounts}
                getStatusColor={getStatusColor}
                onEdit={onEdit}
                onDelete={onDelete}
                onPublish={onPublish}
                onEditRequest={onEditRequest}
                remoteLocks={remoteLocks}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50">
              <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{t("publications.table.emptyState.title")}</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 mx-auto max-w-[200px]">
                {t("publications.table.emptyState.description")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PublicationTable;

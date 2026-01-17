import PublicationDesktopRow from "@/Components/ManageContent/Publication/PublicationDesktopRow";
import PublicationMobileRow from "@/Components/ManageContent/Publication/PublicationMobileRow";
import PublicationMobileRowSkeleton from "@/Components/ManageContent/Publication/PublicationMobileRowSkeleton";
import PublicationRowSkeleton from "@/Components/ManageContent/Publication/PublicationRowSkeleton";
import { TableHeader } from "@/Components/ManageContent/Publication/TableHeader";
import { useWorkspaceLocks } from "@/Hooks/usePublicationLock";
import { Publication } from "@/types/Publication";
import { Folder } from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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

const PublicationTable = memo(
  ({
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
    const [scrollContainer, setScrollContainer] = useState<
      HTMLElement | undefined
    >(undefined);
    const [smoothLoading, setSmoothLoading] = useState(isLoading);

    // Sync smoothLoading with isLoading with a slight delay when turning off
    useEffect(() => {
      if (isLoading) {
        setSmoothLoading(true);
      } else {
        const timer = setTimeout(() => {
          setSmoothLoading(false);
        }, 300); // 300ms delay to allow virtualized list to breathe
        return () => clearTimeout(timer);
      }
    }, [isLoading]);

    useEffect(() => {
      const main = document.getElementsByTagName("main")[0];
      if (main) {
        setScrollContainer(main);
      }
    }, []);

    const getStatusColor = useCallback((status?: string) => {
      switch (status) {
        case "published":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        case "publishing":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        case "draft":
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        case "scheduled":
          return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400";
        case "failed":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        case "pending_review":
          return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
        case "approved":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
        case "rejected":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      }
    }, []);

    // Compute context for Virtuoso to avoid passing props deeply or re-creating callbacks needlessly if not needed
    // However, Virtuoso accepts a context prop.
    const context = useMemo(
      () => ({
        t,
        connectedAccounts,
        getStatusColor,
        onEdit,
        onDelete,
        onPublish,
        onEditRequest,
        remoteLocks,
      }),
      [
        t,
        connectedAccounts,
        getStatusColor,
        onEdit,
        onDelete,
        onPublish,
        onEditRequest,
        remoteLocks,
      ],
    );

    return (
      <div className="relative">
        {/*
          Removed fixed height to allow table to adjust to content height.
          We use customScrollParent to link with the main layout scroller.
      */}
        <div className="transition-opacity duration-300">
          <div className="hidden lg:block">
            {!smoothLoading && items.length === 0 ? (
              <div className="p-12 text-center text-gray-500 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/20 mt-4 flex flex-col items-center justify-center animate-in fade-in duration-500">
                <Folder className="w-12 h-12 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {t("publications.table.emptyState.title")}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {t("publications.table.emptyState.description")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 grid-rows-1">
                {/* Data Layer */}
                <div
                  className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
                >
                  <TableVirtuoso
                    data={items}
                    context={context}
                    customScrollParent={scrollContainer}
                    className="w-full"
                    components={{
                      Table: (props) => (
                        <table
                          {...props}
                          className="w-full text-left border-collapse z-0"
                          style={{ borderCollapse: "collapse" }}
                        />
                      ),
                      TableHead: React.forwardRef((props, ref) => (
                        <thead
                          {...props}
                          ref={ref}
                          className="bg-gray-50 border-gray-100 dark:bg-neutral-900 dark:border-neutral-800 sticky top-0 z-10"
                        />
                      )),
                      TableRow: (props) => (
                        <tr
                          {...props}
                          className="border-b border-gray-50 dark:border-neutral-800 hover:bg-gray-50/50 dark:hover:bg-neutral-800/50"
                        />
                      ),
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
                </div>

                {/* Skeleton Layer */}
                {smoothLoading && (
                  <div className="col-start-1 row-start-1 bg-white dark:bg-neutral-900 animate-out fade-out duration-500 fill-mode-forwards z-20">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 border-gray-100 dark:bg-neutral-900 dark:border-neutral-800">
                        <tr className="text-xs uppercase tracking-wider border-b text-gray-500 dark:text-gray-400">
                          <TableHeader mode="publications" t={t} />
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(8)].map((_, i) => (
                          <PublicationRowSkeleton key={i} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:hidden">
            {!smoothLoading && items.length === 0 ? (
              <div className="p-8 text-center text-gray-500 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t("publications.table.emptyState.title")}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 mx-auto max-w-[200px]">
                  {t("publications.table.emptyState.description")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 grid-rows-1">
                {/* Data Layer */}
                <div
                  className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
                >
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

                {/* Skeleton Layer */}
                {smoothLoading && (
                  <div className="col-start-1 row-start-1 bg-white dark:bg-neutral-900 animate-out fade-out duration-500 fill-mode-forwards z-20">
                    <PublicationMobileRowSkeleton />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default PublicationTable;

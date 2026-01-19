import PublicationDesktopRow from "@/Components/ManageContent/Publication/PublicationDesktopRow";
import PublicationMobileRow from "@/Components/ManageContent/Publication/PublicationMobileRow";
import PublicationMobileRowSkeleton from "@/Components/ManageContent/Publication/PublicationMobileRowSkeleton";
import PublicationRowSkeleton from "@/Components/ManageContent/Publication/PublicationRowSkeleton";
import { TableHeader } from "@/Components/ManageContent/Publication/TableHeader";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import TableContainer from "@/Components/common/ui/TableContainer";
import { useWorkspaceLocks } from "@/Hooks/usePublicationLock";
import { Publication } from "@/types/Publication";
import { Folder } from "lucide-react";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TableVirtuoso } from "react-virtuoso";

interface PublicationTableProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: any[];
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  isLoading?: boolean;
  permissions?: string[];
  pagination?: any;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
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
    onViewDetails,
    isLoading,
    permissions,
    pagination,
    onPageChange,
    onPerPageChange,
  }: PublicationTableProps) => {
    const { remoteLocks } = useWorkspaceLocks();
    const [scrollContainer, setScrollContainer] = useState<
      HTMLElement | undefined
    >(undefined);
    const [smoothLoading, setSmoothLoading] = useState(isLoading);

    useEffect(() => {
      if (isLoading) {
        setSmoothLoading(true);
      } else {
        const timer = setTimeout(() => {
          setSmoothLoading(false);
        }, 300);
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
        onViewDetails,
        remoteLocks,
        permissions: permissions || [],
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
        permissions,
      ],
    );

    return (
      <TableContainer
        title={t("publications.title") || "Publicaciones"}
        subtitle={
          t("publications.subtitle") ||
          "Gestiona tu contenido en redes sociales"
        }
      >
        <div className="transition-opacity duration-300">
          <div className="hidden lg:block">
            <div className="grid grid-cols-1 grid-rows-1">
              <div
                className={`col-start-1 row-start-1 transition-all duration-500 ${smoothLoading ? "invisible opacity-0" : "visible opacity-100"}`}
              >
                {items.length === 0 ? (
                  <table className="w-full text-left border-collapse z-0">
                    <thead className="bg-gray-50/50 border-gray-100 dark:bg-neutral-900/50 dark:border-neutral-800 sticky top-0 z-10">
                      <tr className="text-xs uppercase tracking-wider border-b bg-gray-50/80 dark:bg-neutral-900/80 text-gray-500 dark:text-gray-400">
                        <TableHeader mode="publications" t={t} />
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          colSpan={100}
                          className="p-12 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
                            <Folder className="w-12 h-12 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                              {t("publications.table.emptyState.title")}
                            </h3>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <TableVirtuoso
                    data={items}
                    context={context}
                    useWindowScroll
                    className="w-full"
                    components={{
                      Table: (props) => (
                        <table
                          {...props}
                          className="w-full text-left border-collapse z-0"
                        />
                      ),
                      TableHead: forwardRef((props, ref) => (
                        <thead
                          {...props}
                          ref={ref}
                          className="bg-gray-50/50 border-gray-100 dark:bg-neutral-900/50 dark:border-neutral-800 sticky top-0 z-10"
                        />
                      )),
                      TableRow: (props) => (
                        <tr
                          {...props}
                          className="border-b border-gray-50 dark:border-neutral-800 hover:bg-gray-50/30 dark:hover:bg-neutral-800/30"
                        />
                      ),
                    }}
                    fixedHeaderContent={() => (
                      <tr className="text-xs uppercase tracking-wider border-b bg-gray-50/80 dark:bg-neutral-900/80 text-gray-500 dark:text-gray-400">
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
                        onViewDetails={ctx.onViewDetails}
                        remoteLock={ctx.remoteLocks[item.id]}
                        permissions={ctx.permissions}
                      />
                    )}
                  />
                )}
              </div>

              {smoothLoading && (
                <div className="col-start-1 row-start-1 bg-white/50 dark:bg-neutral-900/50 animate-out fade-out duration-500 fill-mode-forwards z-20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider border-b text-gray-500 dark:text-gray-400">
                        <TableHeader mode="publications" t={t} />
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(items.length || 8)].map((_, i) => (
                        <PublicationRowSkeleton key={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden">
            {!smoothLoading && items.length === 0 ? (
              <div className="p-8 text-center text-gray-500 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 animate-in fade-in duration-500">
                <Folder className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t("publications.table.emptyState.title")}
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 grid-rows-1">
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
                    onViewDetails={onViewDetails}
                    remoteLocks={remoteLocks}
                    permissions={permissions}
                  />
                </div>

                {smoothLoading && (
                  <div className="col-start-1 row-start-1 bg-white dark:bg-neutral-900 animate-out fade-out duration-500 fill-mode-forwards z-20">
                    <PublicationMobileRowSkeleton />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {pagination && pagination.total > 0 && (
          <AdvancedPagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            total={pagination.total}
            perPage={pagination.per_page || 12}
            onPageChange={onPageChange || (() => {})}
            onPerPageChange={onPerPageChange || (() => {})}
            t={t}
            isLoading={isLoading}
          />
        )}
      </TableContainer>
    );
  },
);

export default PublicationTable;

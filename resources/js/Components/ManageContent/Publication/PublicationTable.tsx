import React, { memo, useState } from "react";
import PublicationDesktopRow from "@/Components/ManageContent/Publication/PublicationDesktopRow";
import PublicationMobileGrid from "@/Components/ManageContent/Publication/PublicationMobileGrid";
import PublicationMobileRow from "@/Components/ManageContent/Publication/PublicationMobileRow";
import { TableHeader } from "@/Components/ManageContent/Publication/TableHeader";
import Loader from "@/Components/common/Loader";
import { Publication } from "@/types/Publication";
import { Grid3x3, List } from "lucide-react";

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
  const [mobileViewMode, setMobileViewMode] = useState<"table" | "grid">(
    "table"
  );

  const getStatusColor = (status?: string) => {
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
  };

  const renderDesktopTable = () => (
    <div className="hidden lg:block overflow-x-auto relative">
      <div className="min-w-full inline-block align-middle">
        <table className="w-full text-left border-collapse z-0">
          <thead className="bg-gray-50/90 border-gray-100 dark:bg-neutral-800/90 dark:border-neutral-700">
            <tr className="text-xs uppercase tracking-wider border-b bg-gray-50 border-gray-100 dark:bg-neutral-800/50 dark:border-neutral-700">
              <TableHeader mode="publications" t={t} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-700/50">
            {items.length > 0 ? (
              items.map((item) => (
                <PublicationDesktopRow
                  key={item.id}
                  item={item}
                  t={t}
                  connectedAccounts={connectedAccounts}
                  getStatusColor={getStatusColor}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPublish={onPublish}
                  onEditRequest={onEditRequest}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {t("publications.table.emptyState.title")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[200px]">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg transition-all duration-300">
          <div className="flex flex-col items-center space-y-3">
            <Loader />
            <span className="text-sm text-gray-500 font-medium animate-pulse">
              {t("publications.table.loading")}
            </span>
          </div>
        </div>
      )}

      <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
        {renderDesktopTable()}

        <div className="lg:hidden">
          {items.length > 0 ? (
            <PublicationMobileGrid
              items={items}
              t={t}
              connectedAccounts={connectedAccounts}
              getStatusColor={getStatusColor}
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish}
              onEditRequest={onEditRequest}
            />
          ) : (
            <div className="p-8 text-center text-gray-500 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
              {t("publications.table.emptyState.title")}
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {t("publications.table.emptyState.description")}
              </p>
            </div>
          )}
        </div>

        {!isLoading && items.length === 0 && (
          <div className="hidden lg:block p-8 text-center text-gray-500 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
            {t("publications.table.emptyState.title")}
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {t("publications.table.emptyState.description")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PublicationTable;

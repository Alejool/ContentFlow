import PublicationDesktopRow from "@/Components/ManageContent/Publication/PublicationDesktopRow";
import PublicationMobileGrid from "@/Components/ManageContent/Publication/PublicationMobileGrid";
import PublicationMobileRow from "@/Components/ManageContent/Publication/PublicationMobileRow";
import { TableHeader } from "@/Components/ManageContent/Publication/TableHeader";
import Loader from "@/Components/common/Loader";
import { Publication } from "@/types/Publication";
import { Grid3x3, List } from "lucide-react";
import { useState } from "react";

interface PublicationTableProps {
  items: Publication[];
  theme: string;
  t: (key: string) => string;
  connectedAccounts: any[];
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  isLoading?: boolean;
}

export default function PublicationTable({
  items,
  theme,
  t,
  connectedAccounts,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
  isLoading,
}: PublicationTableProps) {
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
    <div className="hidden lg:block overflow-x-auto">
      <div className="min-w-full inline-block align-middle">
        <table className="w-full text-left border-collapse z-0">
          <thead
            className={`${
              theme === "dark"
                ? "bg-neutral-800/90 border-neutral-700"
                : "bg-gray-50/90 border-gray-100"
            }`}
          >
            <tr
              className={`text-xs uppercase tracking-wider border-b ${
                theme === "dark"
                  ? "bg-neutral-800/50 border-neutral-700"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <TableHeader mode="publications" t={t} />
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              theme === "dark" ? "divide-neutral-700/50" : "divide-gray-100"
            }`}
          >
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center space-y-4 text-gray-500"
                >
                  <div className="flex justify-center">
                    <Loader />
                  </div>
                  <span className="text-sm pt-4">
                    {t("publications.table.loading")}
                  </span>
                </td>
              </tr>
            ) : items.length > 0 ? (
              items.map((item) => (
                <PublicationDesktopRow
                  key={item.id}
                  item={item}
                  t={t}
                  theme={theme}
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
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
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
    <div>
      {renderDesktopTable()}

      <div className="lg:hidden">
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setMobileViewMode("table")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  mobileViewMode === "table"
                    ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                title={t("common.listView")}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileViewMode("grid")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  mobileViewMode === "grid"
                    ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                title={t("common.gridView")}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center space-y-4 text-gray-500">
            <div className="flex justify-center">
              <Loader />
            </div>
            <span className="text-sm">{t("publications.table.loading")}</span>
          </div>
        ) : items.length > 0 ? (
          mobileViewMode === "table" ? (
            <PublicationMobileRow
              items={items}
              theme={theme}
              t={t}
              connectedAccounts={connectedAccounts}
              getStatusColor={getStatusColor}
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish}
              onEditRequest={onEditRequest}
            />
          ) : (
            <PublicationMobileGrid
              items={items}
              theme={theme}
              t={t}
              connectedAccounts={connectedAccounts}
              getStatusColor={getStatusColor}
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish}
              onEditRequest={onEditRequest}
            />
          )
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
  );
}

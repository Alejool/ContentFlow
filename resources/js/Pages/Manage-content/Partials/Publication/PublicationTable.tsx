import { Publication } from "@/types/Publication";
import PublicationRow from "@Pages/Manage-content/Partials/Campaign/PublicationRow";
import { TableHeader } from "@Pages/Manage-content/Partials/Campaign/TableHeader";

interface PublicationTableProps {
  items: Publication[];
  theme: string;
  t: (key: string) => string;
  connectedAccounts: any[];
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
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
}: PublicationTableProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="overflow-x-auto">
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
          {items.length > 0 ? (
            items.map((item) => (
              <PublicationRow
                key={item.id}
                item={item}
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
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                No publications found. Start creating content!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

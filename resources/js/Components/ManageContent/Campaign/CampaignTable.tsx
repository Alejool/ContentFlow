import { Fragment } from "react";
import { Campaign } from "@/types/Campaign";
import CampaignRow from "@/Components/ManageContent/Campaign/CampaignRow";
import CampaignPublications from "@/Components/ManageContent/Campaign/CampaignPublications";
import { TableHeader } from "@/Components/ManageContent/Publication/TableHeader";

interface CampaignTableProps {
  items: Campaign[];
  theme: string;
  t: (key: string) => string;
  expandedCampaigns: number[];
  toggleExpand: (id: number) => void;
  onEdit: (item: Campaign) => void;
  onDelete: (id: number) => void;
  onEditRequest?: (item: Campaign) => void;
  onViewDetails: (item: Campaign) => void;
}

export default function CampaignTable({
  items,
  theme,
  t,
  expandedCampaigns,
  toggleExpand,
  onEdit,
  onDelete,
  onEditRequest,
  onViewDetails,
}: CampaignTableProps) {
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
            <TableHeader mode="campaigns" t={t} />
          </tr>
        </thead>
        <tbody
          className={`divide-y ${
            theme === "dark" ? "divide-neutral-700/50" : "divide-gray-100"
          }`}
        >
          {items.length > 0 ? (
            items.map((item) => (
              <Fragment key={item.id}>
                <CampaignRow
                  item={item}
                  theme={theme}
                  expandedCampaigns={expandedCampaigns}
                  toggleExpand={toggleExpand}
                  getStatusColor={getStatusColor}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onEditRequest={onEditRequest}
                  onViewDetails={onViewDetails}
                />

                {expandedCampaigns.includes(item.id) && (
                  <CampaignPublications
                    campaign={item}
                    theme={theme}
                    getStatusColor={getStatusColor}
                  />
                )}
              </Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                No campaigns found. Create a group to organize your content.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import { Fragment } from "react";
import { Campaign } from "@/types/Campaign";
import CampaignRow from "@/Components/ManageContent/Campaign/CampaignRow";
import CampaignPublications from "@/Components/ManageContent/Campaign/CampaignPublications";
import CampaignMobileTable from "@/Components/ManageContent/Campaign/CampaignMobileTable";
import { TableHeader } from "@/Components/ManageContent/Publication/TableHeader";
import Loader from "@/Components/common/Loader";

interface CampaignTableProps {
  items: Campaign[];
  t: (key: string) => string;
  expandedCampaigns: number[];
  toggleExpand: (id: number) => void;
  onEdit: (item: Campaign) => void;
  onDelete: (id: number) => void;
  onEditRequest?: (item: Campaign) => void;
  onViewDetails: (item: Campaign) => void;
  isLoading?: boolean;
}

export default function CampaignTable({
  items,
  t,
  expandedCampaigns,
  toggleExpand,
  onEdit,
  onDelete,
  onEditRequest,
  onViewDetails,
  isLoading,
}: CampaignTableProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "deleted":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse z-0">
          <thead
            className="bg-gray-50/90 border-gray-100 dark:bg-neutral-800/90 dark:border-neutral-700"
          >
            <tr
              className="text-xs uppercase tracking-wider border-b bg-gray-50 border-gray-100 dark:bg-neutral-800/50 dark:border-neutral-700"
            >
              <TableHeader mode="campaigns" t={t} />
            </tr>
          </thead>
          <tbody
            className="divide-y divide-gray-100 dark:divide-neutral-700/50"
          >
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center space-y-6  text-gray-500"
                >
                  <Loader />
                  <span className="text-sm pt-8">
                    {t("campaigns.table.loading")}
                  </span>
                </td>
              </tr>
            ) : items.length > 0 ? (
              items.map((item) => (
                <Fragment key={item.id}>
                  <CampaignRow
                    item={item}
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
                      getStatusColor={getStatusColor}
                    />
                  )}
                </Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {t("campaigns.table.emptyState.title")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && items.length > 0 && (
        <CampaignMobileTable
          items={items}
          t={t}
          expandedCampaigns={expandedCampaigns}
          toggleExpand={toggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
          onEditRequest={onEditRequest}
          onViewDetails={onViewDetails}
          getStatusColor={getStatusColor}
        />
      )}

      {isLoading && (
        <div className="lg:hidden p-8 text-center space-y-4 text-gray-500">
          <div className="flex justify-center">
            <Loader />
          </div>
          <span className="text-sm">{t("campaigns.table.loading")}</span>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="lg:hidden p-8 text-center text-gray-500 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
          {t("campaigns.table.emptyState.title")}
        </div>
      )}
    </div>
  );
}

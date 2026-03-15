import PublicationThumbnail from "@/Components/Content/Publication/PublicationThumbnail";
import { formatDate } from "@/Utils/i18nHelpers";
import { Campaign } from "@/types/Campaign";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface CampaignPublicationsProps {
  campaign: Campaign;
  getStatusColor: (status?: string) => string;
}

export default function CampaignPublications({
  campaign,
  getStatusColor,
}: CampaignPublicationsProps) {
  const { t, i18n } = useTranslation();
  const publications = campaign.publications || [];

  return (
    <tr>
      <td colSpan={5} className="bg-gray-50/50 px-0 dark:bg-neutral-900/30">
        <div className="px-4 py-4 lg:px-12">
          <div className="mb-3 border-l-2 border-primary-500 pl-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t("campaigns.modal.view.associatedPublications")}
          </div>
          {publications.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {publications.map((pub) => {
                if (!pub) return null;
                return (
                  <div
                    key={pub.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <div className="flex items-center gap-3 p-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 lg:h-10 lg:w-10">
                        <PublicationThumbnail publication={pub} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                          {pub.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(new Date(pub.created_at), "medium")}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex-shrink-0 rounded-full px-2 py-1 text-xs ${getStatusColor(
                        pub.status,
                      )}`}
                    >
                      {pub.status}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm italic text-gray-500">{t("campaigns.noPublications")}</div>
          )}
        </div>
      </td>
    </tr>
  );
}

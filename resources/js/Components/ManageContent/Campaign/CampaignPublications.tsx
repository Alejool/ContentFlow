import PublicationThumbnail from "@/Components/ManageContent/Publication/PublicationThumbnail";
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
      <td
        colSpan={5}
        className="px-0 bg-gray-50/50 dark:bg-neutral-900/30"
      >
        <div className="px-4 lg:px-12 py-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pl-2 border-l-2 border-primary-500">
            {t("campaigns.modal.view.associatedPublications")}
          </div>
          {publications.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {publications.map((pub) => {
                if (!pub) return null;
                return (
                  <div
                    key={pub.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
                  >
                    <div className="flex items-center gap-3 p-2">
                      <div
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded flex-shrink-0 border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 overflow-hidden flex items-center justify-center"
                      >
                        <PublicationThumbnail publication={pub} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium truncate text-gray-800 dark:text-gray-200"
                        >
                          {pub.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Intl.DateTimeFormat(i18n.language || undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(pub.created_at))}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${getStatusColor(
                        pub.status
                      )}`}
                    >
                      {pub.status}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              {t("campaigns.noPublications")}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

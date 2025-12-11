import { Campaign } from "@/types/Campaign";
import { format } from "date-fns";
import PublicationThumbnail from "@Pages/Manage-content/Partials/Publication/PublicationThumbnail";

interface CampaignPublicationsProps {
  campaign: Campaign;
  theme: string;
  getStatusColor: (status?: string) => string;
}

export default function CampaignPublications({
  campaign,
  theme,
  getStatusColor,
}: CampaignPublicationsProps) {
  const publications = campaign.publications || [];

  return (
    <tr>
      <td
        colSpan={5}
        className={`px-0 ${
          theme === "dark" ? "bg-neutral-900/30" : "bg-gray-50/50"
        }`}
      >
        <div className="px-12 py-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pl-2 border-l-2 border-primary-500">
            Associated Publications
          </div>
          {publications.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {publications.map((pub) => (
                <div
                  key={pub.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ml-2 ${
                    theme === "dark"
                      ? "bg-neutral-800 border-neutral-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 p-2">
                    <div
                      className={`w-10 h-10 rounded flex-shrink-0 border overflow-hidden flex items-center justify-center ${
                        theme === "dark"
                          ? "border-neutral-700 bg-neutral-800"
                          : "border-gray-200 bg-gray-100"
                      }`}
                    >
                      <PublicationThumbnail publication={pub} />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          theme === "dark" ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {pub.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(pub.created_at), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                      pub.status
                    )}`}
                  >
                    {pub.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic ml-4">
              No publications attached.
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

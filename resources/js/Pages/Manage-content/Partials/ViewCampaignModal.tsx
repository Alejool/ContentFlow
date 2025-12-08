import CampaignMediaCarousel from "@/Components/Campaigns/CampaignMediaCarousel";
import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Calendar, Hash, Target, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ViewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
}

export default function ViewCampaignModal({
  isOpen,
  onClose,
  campaign,
}: ViewCampaignModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!campaign) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className={`w-full max-w-3xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col
            ${
              theme === "dark"
                ? "bg-neutral-800 border border-neutral-700"
                : "bg-white"
            }
          `}
        >
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-700">
            <DialogTitle
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("campaigns.actions.viewCampaign")}
            </DialogTitle>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-neutral-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {campaign.media_files && campaign.media_files.length > 0 && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-900">
                  <CampaignMediaCarousel mediaFiles={campaign.media_files} />
                </div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <h3
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {campaign.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize whitespace-nowrap self-start
                      ${getStatusColor(campaign.status)}
                    `}
                  >
                    {campaign.status || "Draft"}
                  </span>
                </div>
                <p
                  className={`text-base leading-relaxed ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {campaign.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaign.goal && (
                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target
                        className={`w-4 h-4 ${
                          theme === "dark"
                            ? "text-primary-400"
                            : "text-primary-600"
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {t("campaigns.objective")}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {campaign.goal}
                    </p>
                  </div>
                )}

                {campaign.hashtags && (
                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Hash
                        className={`w-4 h-4 ${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {t("campaigns.hashtags")}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {campaign.hashtags}
                    </p>
                  </div>
                )}

                <div
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar
                      className={`w-4 h-4 ${
                        theme === "dark" ? "text-green-400" : "text-green-600"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {t("campaigns.startDate")}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {formatDate(campaign.start_date)}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar
                      className={`w-4 h-4 ${
                        theme === "dark"
                          ? "text-primary-400"
                          : "text-primary-600"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {t("campaigns.endDate")}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {formatDate(campaign.end_date)}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg md:col-span-2 ${
                    theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar
                      className={`w-4 h-4 ${
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {t("campaigns.scheduledPosts")}
                    </span>
                  </div>

                  {campaign.scheduled_posts &&
                  campaign.scheduled_posts.length > 0 ? (
                    <div
                      className={`space-y-2 mt-2 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {campaign.scheduled_posts.map(
                        (post: any, index: number) => (
                          <div
                            key={post.id || index}
                            className={`flex items-center justify-between p-2 rounded border ${
                              theme === "dark"
                                ? "bg-neutral-800 border-neutral-700"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 da">
                              <span className="capitalize font-medium text-sm">
                                {post?.social_account?.platform ||
                                  t("common.platform")}
                              </span>
                              {post.status && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                                    post.status === "posted"
                                      ? "bg-green-100 text-green-700"
                                      : post.status === "failed"
                                      ? "bg-primary-100 text-primary-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {post.status}
                                </span>
                              )}
                            </div>
                            <div className="text-sm opacity-80">
                              {formatDate(post.scheduled_at)}{" "}
                              {new Date(post.scheduled_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("campaigns.noScheduledPosts")}
                    </p>
                  )}
                </div>

                {campaign.publish_date && (
                  <div
                    className={`p-4 rounded-lg md:col-span-2 ${
                      theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar
                        className={`w-4 h-4 ${
                          theme === "dark"
                            ? "text-purple-400"
                            : "text-purple-600"
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {t("campaigns.publishedOn")}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {formatDate(campaign.publish_date)}
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`p-4 rounded-lg border ${
                  theme === "dark"
                    ? "bg-neutral-900/30 border-neutral-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }
                  >
                    {t("common.created")}: {formatDate(campaign.created_at)}
                  </span>
                  <span
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }
                  >
                    {t("common.lastUpdated")}: {formatDate(campaign.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-neutral-700">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {t("common.close")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

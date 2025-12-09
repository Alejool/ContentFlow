import CampaignMediaCarousel from "@/Components/Campaigns/CampaignMediaCarousel";
import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Calendar, FileText, Hash, Layers, Target, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ViewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | Publication | null;
}

export default function ViewCampaignModal({
  isOpen,
  onClose,
  campaign: item, // rename prop to generic 'item' for internal use
}: ViewCampaignModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!item) return null;

  // Type guards or simple checks
  const isPublication = (i: any): i is Publication => {
    // items with media_files or scheduled_posts are definitely publications (or old campaigns behaving as such)
    return !!i.media_files || !!i.scheduled_posts || i.type === "publication";
  };

  const title = (item as any).title || (item as any).name || "Untitled";
  const desc = item.description || "No description provided.";
  const media = (item as any).media_files || [];
  const publications = (item as any).publications || [];

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
              } flex items-center gap-2`}
            >
              {publications.length > 0 ? (
                <Layers className="w-6 h-6 text-primary-500" />
              ) : (
                <FileText className="w-6 h-6 text-primary-500" />
              )}
              {publications.length > 0
                ? "Campaign Details"
                : "Publication Details"}
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
              {/* Media Carousel (Only for Publications) */}
              {media.length > 0 && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-900">
                  <CampaignMediaCarousel mediaFiles={media} />
                </div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <h3
                    className={`text-2xl font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {title}
                  </h3>
                  {/* Status if available */}
                  {(item as any).status && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize whitespace-nowrap self-start ${getStatusColor(
                        (item as any).status
                      )}`}
                    >
                      {(item as any).status}
                    </span>
                  )}
                </div>
                <p
                  className={`text-base leading-relaxed ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {desc}
                </p>
              </div>

              {/* Publications List (Only for Campaigns) */}
              {publications.length > 0 && (
                <div
                  className={`p-4 rounded-lg border ${
                    theme === "dark"
                      ? "bg-neutral-900/30 border-neutral-700"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Included Publications ({publications.length})
                  </h4>
                  <div className="space-y-2">
                    {publications.map((pub: any) => (
                      <div
                        key={pub.id}
                        className={`flex items-center gap-3 p-2 rounded ${
                          theme === "dark" ? "bg-neutral-800" : "bg-white"
                        } shadow-sm`}
                      >
                        {pub.media_files?.[0] ? (
                          <img
                            src={pub.media_files[0].file_path}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            theme === "dark" ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {pub.title || pub.name || "Untitled"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(item as any).goal && (
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
                      {(item as any).goal}
                    </p>
                  </div>
                )}

                {(item as any).hashtags && (
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
                      {(item as any).hashtags}
                    </p>
                  </div>
                )}

                {(item as any).start_date && (
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
                      {formatDate((item as any).start_date)}
                    </p>
                  </div>
                )}

                {(item as any).end_date && (
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
                      {formatDate((item as any).end_date)}
                    </p>
                  </div>
                )}

                {(item as any).scheduled_posts &&
                  (item as any).scheduled_posts.length > 0 && (
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
                          {t("campaigns.scheduledPosts")}
                        </span>
                      </div>

                      <div
                        className={`space-y-2 mt-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {(item as any).scheduled_posts.map(
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
                    </div>
                  )}

                {(item as any).publish_date && (
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
                      {formatDate((item as any).publish_date)}
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
                    {t("common.created")}:{" "}
                    {formatDate((item as any).created_at)}
                  </span>
                  <span
                    className={
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }
                  >
                    {t("common.lastUpdated")}:{" "}
                    {formatDate((item as any).updated_at)}
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

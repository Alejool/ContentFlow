import CampaignMediaCarousel from "@/Components/Campaigns/CampaignMediaCarousel";
import PlatformPreviewModal from "@/Components/ManageContent/modals/common/PlatformPreviewModal";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Calendar, Eye, FileText, Hash, Layers, Target, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ViewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | Publication | null;
}

export default function ViewCampaignModal({
  isOpen,
  onClose,
  campaign: item,
}: ViewCampaignModalProps) {
  const { t } = useTranslation();

  const [previewPublication, setPreviewPublication] =
    useState<Publication | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  if (!item) return null;

  const isPublication = (i: any): i is Publication => {
    return !!i.media_files || !!i.scheduled_posts || i.type === "publication";
  };

  const title = (item as any).title || (item as any).name || "Untitled";
  const desc = item.description || "No description provided.";
  const media = (item as any).media_files || [];
  const publications = (item as any).publications || [];

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
          className="w-full max-w-3xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700"
        >
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-700">
            <DialogTitle
              className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
            >
              {publications.length > 0 ? (
                <Layers className="w-6 h-6 text-primary-500" />
              ) : (
                <FileText className="w-6 h-6 text-primary-500" />
              )}
              {t("campaigns.modal.showCampaign.title")}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {media.length > 0 && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-900">
                  <CampaignMediaCarousel mediaFiles={media} />
                </div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <h3
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    {title}
                  </h3>
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
                  className="text-base leading-relaxed text-gray-600 dark:text-gray-300"
                >
                  {desc}
                </p>
              </div>

              {publications.length > 0 && (
                <div
                  className="p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-neutral-900/30 dark:border-neutral-700"
                >
                  <h3
                    className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <Layers className="w-4 h-4" />
                    {t("campaigns.modal.showCampaign.associatedPublications")} (
                    <span className="font-bold">{publications.length}</span>)
                  </h3>
                  <div className="space-y-2">
                    {publications.map((pub: any) => {
                      if (!pub) return null;
                      return (
                        <div
                          key={pub.id}
                          className="flex items-center gap-3 p-2 rounded bg-white dark:bg-neutral-800 shadow-sm"
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
                            className="text-sm font-medium text-gray-700 dark:text-gray-200"
                          >
                            {pub.title || pub.name || "Untitled"}
                          </span>

                          {pub.status === "published" && (
                            <div className="ml-auto flex gap-1">
                              {/* If published, we might have multiple platforms. For simplicity in this list, we let the user pick in the modal */}
                              <button
                                onClick={() => {
                                  if (!pub) return;
                                  setPreviewPublication(pub);
                                  // Default to the first published platform found in logs
                                  const logs = pub.social_post_logs || [];
                                  const firstLog = logs.find(
                                    (l: any) =>
                                      l.status === "published" ||
                                      l.status === "success"
                                  );
                                  setActivePlatform(
                                    firstLog?.platform || "youtube"
                                  );
                                }}
                                className="p-1.5 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(item as any).goal && (
                  <div
                    className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target
                        className="w-4 h-4 text-primary-600 dark:text-primary-400"
                      />
                      <span
                        className="text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        {t("campaigns.modal.showCampaign.goal")}
                      </span>
                    </div>
                    <p
                      className="text-sm text-gray-900 dark:text-white"
                    >
                      {(item as any).goal}
                    </p>
                  </div>
                )}

                {(item as any).hashtags && (
                  <div
                    className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Hash
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      />
                      <span
                        className="text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        {t("campaigns.modal.showCampaign.hashtags")}
                      </span>
                    </div>
                    <p
                      className="text-sm text-gray-900 dark:text-white"
                    >
                      {(item as any).hashtags}
                    </p>
                  </div>
                )}

                {(item as any).start_date && (
                  <div
                    className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar
                        className="w-4 h-4 text-green-600 dark:text-green-400"
                      />
                      <span
                        className="text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        {t("campaigns.modal.showCampaign.startDate")}
                      </span>
                    </div>
                    <p
                      className="text-sm text-gray-900 dark:text-white"
                    >
                      {formatDate((item as any).start_date)}
                    </p>
                  </div>
                )}

                {(item as any).end_date && (
                  <div
                    className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar
                        className="w-4 h-4 text-primary-600 dark:text-primary-400"
                      />
                      <span
                        className="text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        {t("campaigns.modal.showCampaign.endDate")}
                      </span>
                    </div>
                    <p
                      className="text-sm text-gray-900 dark:text-white"
                    >
                      {formatDate((item as any).end_date)}
                    </p>
                  </div>
                )}

                {(item as any).scheduled_posts &&
                  (item as any).scheduled_posts.length > 0 && (
                    <div
                      className="p-4 rounded-lg md:col-span-2 bg-gray-50 dark:bg-neutral-900/50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar
                          className="w-4 h-4 text-purple-600 dark:text-purple-400"
                        />
                        <span
                          className="text-sm font-semibold text-gray-500 dark:text-gray-400"
                        >
                          {t("campaigns.scheduledPosts")}
                        </span>
                      </div>

                      <div
                        className="space-y-2 mt-2 text-gray-900 dark:text-white"
                      >
                        {(item as any).scheduled_posts.map(
                          (post: any, index: number) => (
                            <div
                              key={post.id || index}
                              className="flex items-center justify-between p-2 rounded border bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                            >
                              <div className="flex items-center gap-2 da">
                                <span className="capitalize font-medium text-sm">
                                  {post?.social_account?.platform ||
                                    t("common.platform")}
                                </span>
                                {post.status && (
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded capitalize ${post.status === "posted"
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
                    className="p-4 rounded-lg md:col-span-2 bg-gray-50 dark:bg-neutral-900/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar
                        className="w-4 h-4 text-purple-600 dark:text-purple-400"
                      />
                      <span
                        className="text-sm font-semibold text-gray-500 dark:text-gray-400"
                      >
                        {t("campaigns.modal.showCampaign.publishedOn")}
                      </span>
                    </div>
                    <p
                      className="text-sm text-gray-900 dark:text-white"
                    >
                      {formatDate((item as any).publish_date)}
                    </p>
                  </div>
                )}
              </div>

              <div
                className="p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-neutral-900/30 dark:border-neutral-700"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span
                    className="text-gray-500 dark:text-gray-400"
                  >
                    {t("campaigns.modal.showCampaign.created")}:{" "}
                    {formatDate((item as any).created_at)}
                  </span>
                  <span
                    className="text-gray-500 dark:text-gray-400"
                  >
                    {t("campaigns.modal.showCampaign.lastUpdated")}:{" "}
                    {formatDate((item as any).updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-neutral-700">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-white"
            >
              {t("common.close")}
            </button>
          </div>
        </DialogPanel>
      </div>

      <PlatformPreviewModal
        isOpen={!!previewPublication && !!activePlatform}
        onClose={() => {
          setPreviewPublication(null);
          setActivePlatform(null);
        }}
        platform={activePlatform || ""}
        publication={previewPublication}
        theme={theme}
      />
    </Dialog>
  );
}

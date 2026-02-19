import CampaignMediaCarousel from "@/Components/Campaigns/CampaignMediaCarousel";
import ReelsCarousel from "@/Components/ManageContent/ReelsCarousel";
import ActivityList from "@/Components/Content/ActivityList";
import ApprovalHistory from "@/Components/Content/ApprovalHistory";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { usePage } from "@inertiajs/react";
import {
  Calendar,
  Edit,
  FileText,
  Hash,
  Layers,
  Target,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ViewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | Publication | null;
  onEdit?: (item: Campaign | Publication) => void;
}

export default function ViewCampaignModal({
  isOpen,
  onClose,
  campaign: item,
  onEdit,
}: ViewCampaignModalProps) {
  const { t } = useTranslation();
  const { auth } = usePage<any>().props;
  const [activeTab, setActiveTab] = useState("overview");
  const [hashtagsExpanded, setHashtagsExpanded] = useState(false);
  const canEdit =
    auth.current_workspace?.permissions?.includes("content");

  if (!item) return null;

  const isPublication = (i: any): i is Publication => {
    return !!i.title && !i.name;
  };

  const isActuallyPublication = isPublication(item);

  const title = (item as any).title || (item as any).name || "Untitled";
  const desc = item.description || "No description provided.";
  const media = (item as any).media_files || [];
  const publications = (item as any).publications || [];

  // Separate reels from regular media
  const reels = media.filter((m: any) => m.metadata?.original_media_id);
  const regularMedia = media.filter((m: any) => !m.metadata?.original_media_id);

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
        <DialogPanel className="w-full max-w-3xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700">
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-700">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {isActuallyPublication ? (
                <FileText className="w-6 h-6 text-primary-500" />
              ) : (
                <Layers className="w-6 h-6 text-primary-500" />
              )}
              {isActuallyPublication
                ? t("publications.modal.show.title")
                : t("campaigns.modal.view.title")}
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
              {regularMedia.length > 0 && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-900">
                  <CampaignMediaCarousel mediaFiles={regularMedia} />
                </div>
              )}

              {/* Reels Section */}
              {reels.length > 0 && (
                <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50/50 dark:bg-purple-900/10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t('reels.section.title')} ({reels.length})
                    </h3>
                  </div>
                  <ReelsCarousel reels={reels} />
                </div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                  {(item as any).status && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize whitespace-nowrap self-start ${getStatusColor(
                        (item as any).status,
                      )}`}
                    >
                      {(item as any).status}
                    </span>
                  )}
                </div>
                <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                  {desc}
                </p>
              </div>

              {publications.length > 0 && (
                <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-neutral-900/30 dark:border-neutral-700">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Layers className="w-4 h-4" />
                    {t("campaigns.modal.view.associatedPublications")} (
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
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {pub.title || pub.name || "Untitled"}
                          </span>

                          {pub.status === "published" && (
                            <div className="ml-auto flex gap-1"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {(item as any).user && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                  <div className="flex-shrink-0">
                    {(item as any).user.photo_url ? (
                      <img
                        src={(item as any).user.photo_url}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-700 shadow-sm"
                        alt=""
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {(item as any).user.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("common.creator")}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs Navigation for Publications */}
              {isActuallyPublication && (
                <div className="mt-8 border-b border-gray-200 dark:border-neutral-700 mb-6">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {["overview", "activity", "approvals"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                          ${
                            activeTab === tab
                              ? "border-primary-500 text-primary-600 dark:text-primary-400"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                          }
                        `}
                      >
                        {t(`common.tabs.${tab}`, tab)}
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              <div className="mt-6">
                {/* Overview Content (Grid + Footer) */}
                {(!isActuallyPublication || activeTab === "overview") && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(item as any).goal && (
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t("campaigns.modal.view.goal")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {(item as any).goal}
                          </p>
                        </div>
                      )}

                      {(item as any).hashtags && (
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t("campaigns.modal.view.hashtags")}
                            </span>
                          </div>
                          <div
                            className={`text-sm text-gray-900 dark:text-white ${
                              !hashtagsExpanded ? "line-clamp-2" : ""
                            } break-words cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors`}
                            onClick={() => setHashtagsExpanded(!hashtagsExpanded)}
                            title={hashtagsExpanded ? "Click para contraer" : "Click para expandir"}
                          >
                            {(item as any).hashtags}
                          </div>
                          {(item as any).hashtags.length > 100 && (
                            <button
                              onClick={() => setHashtagsExpanded(!hashtagsExpanded)}
                              className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-2"
                            >
                              {hashtagsExpanded ? "Ver menos" : "Ver más"}
                            </button>
                          )}
                        </div>
                      )}

                      {(item as any).start_date && (
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t("campaigns.modal.view.startDate")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate((item as any).start_date)}
                          </p>
                        </div>
                      )}

                      {(item as any).end_date && (
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t("campaigns.modal.view.endDate")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate((item as any).end_date)}
                          </p>
                        </div>
                      )}

                      {(item as any).scheduled_posts &&
                        (item as any).scheduled_posts.length > 0 && (
                          <div className="p-4 rounded-lg md:col-span-2 bg-gray-50 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                {t("publications.scheduledPosts")}
                              </span>
                            </div>

                            <div className="space-y-2 mt-2 text-gray-900 dark:text-white">
                              {(item as any).scheduled_posts.map(
                                (post: any, index: number) => (
                                  <div
                                    key={post.id || index}
                                    className="flex items-center justify-between p-2 rounded border bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="capitalize font-medium text-sm">
                                        {post?.social_account?.platform ||
                                          t("common.platformConnect")}
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
                                      {new Date(
                                        post.scheduled_at,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {(item as any).publish_date && (
                        <div className="p-4 rounded-lg md:col-span-2 bg-gray-50 dark:bg-neutral-900/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              {t("campaigns.modal.view.publishedOn")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate((item as any).publish_date)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 p-4 rounded-lg border bg-gray-50 border-gray-200 dark:bg-neutral-900/30 dark:border-neutral-700">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {t("campaigns.modal.view.created")}:{" "}
                          {formatDate((item as any).created_at)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {t("campaigns.modal.view.lastUpdated")}:{" "}
                          {formatDate((item as any).updated_at)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && isActuallyPublication && (
                  <div className="max-h-96 overflow-y-auto pr-2">
                    <ActivityList activities={(item as any).activities || []} />
                  </div>
                )}

                {/* Approvals Tab */}
                {activeTab === "approvals" && isActuallyPublication && (
                  <div className="max-h-96 overflow-y-auto pr-2">
                    <ApprovalHistory
                      logs={(item as any).approval_logs || []}
                      publicationId={item.id}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-neutral-700">
            {onEdit && canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="px-6 py-2.5 rounded-lg font-bold transition-all bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95"
              >
                <Edit className="w-4 h-4" />
                {t("common.editInPanel")}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-white"
            >
              {t("common.close")}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

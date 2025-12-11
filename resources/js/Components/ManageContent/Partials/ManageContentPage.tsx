import AddCampaignModal from "@/Components/ManageContent/Partials/AddCampaignModal";
import AddPublicationModal from "@/Components/ManageContent/Partials/AddPublicationModal";
import CampaignList from "@/Components/ManageContent/Partials/CampaignList";
import EditCampaignModal from "@/Components/ManageContent/Partials/EditCampaignModal";
import EditPublicationModal from "@/Components/ManageContent/Partials/EditPublicationModal";
import LogsList from "@/Components/ManageContent/Partials/LogsList";
import PublishCampaignModal from "@/Components/ManageContent/Partials/PublishCampaignModal";
import PublishPublicationModal from "@/Components/ManageContent/Partials/PublishPublicationModal";
import SocialMediaAccounts from "@/Components/ManageContent/Partials/SocialMediaAccounts";
import ViewCampaignModal from "@/Components/ManageContent/Partials/ViewCampaignModal";
import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { useConfirm } from "@/Hooks/useConfirm";
import { useSocialMediaAuth } from "@/Hooks/useSocialMediaAuth";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { FileText, Folder, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function ManageContentPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { confirm, ConfirmDialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<
    "publications" | "campaigns" | "logs"
  >("publications");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);

  // Unified state for selected item (Publication or Campaign)
  const [selectedItem, setSelectedItem] = useState<
    Campaign | Publication | null
  >(null);
  const [filters, setFilters] = useState<any>({});

  const {
    campaigns,
    pagination,
    isLoading,
    fetchCampaigns,
    addCampaign,
    deleteCampaign,
    updateCampaign,
  } = useCampaignManagement(
    activeTab === "publications" ? "publications" : "campaigns"
  );

  const tabs = [
    {
      id: "publications",
      icon: FileText,
      label: t("manageContent.publications"),
    },
    {
      id: "campaigns",
      icon: Target,
      label: t("manageContent.campaigns"),
    },
    {
      id: "logs",
      icon: FileText,
      label: t("manageContent.logs"),
    },
  ];

  useEffect(() => {
    fetchCampaigns(filters);
  }, [filters, activeTab]);

  const handlePageChange = (page: number) => {
    fetchCampaigns(filters, page);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const openEditModal = (item: Campaign | Publication) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const openPublishModal = (item: any) => {
    setSelectedItem(item);
    setIsPublishModalOpen(true);
  };

  const openViewDetailsModal = (item: any) => {
    setSelectedItem(item);
    setIsViewDetailsModalOpen(true);
  };

  const handleDeleteCampaign = async (id: number) => {
    const confirmed = await confirm({
      title: t("campaigns.messages.confirmDelete.title"),
      message: t("campaigns.messages.confirmDelete.text"),
      confirmText: t("campaigns.messages.confirmDelete.confirmButton"),
      cancelText: t("campaigns.messages.confirmDelete.cancelButton"),
      type: "danger",
    });

    if (confirmed) {
      await deleteCampaign(id);
    }
  };

  // Fetch connected accounts for verification
  const {
    accounts: connectedAccounts = [],
    isLoading: isLoadingAccounts,
    fetchAccounts,
  } = useSocialMediaAuth();

  useEffect(() => {
    // Ensure we have the latest connected accounts status
    if (fetchAccounts) fetchAccounts();
  }, []);

  const handleEditRequest = async (item: Publication | any) => {
    // If it's not published, just open edit modal
    if (item.status !== "published") {
      openEditModal(item);
      return;
    }

    // Check availability of the linked account
    let isLinkedAccountConnected = false;
    let linkedAccountName = "Unknown";

    // Find the scheduled post (published one) or fallback to any associated post
    const postLogs = item.social_post_logs || [];
    const scheduledPosts = item.scheduled_posts || [];

    // Prioritize finding a published log/record
    let publishedPost = postLogs.find(
      (l: any) => l.status === "published" || l.status === "success"
    );

    if (!publishedPost) {
      publishedPost = scheduledPosts.find(
        (p: any) => p.status === "posted" || p.status === "published"
      );
    }

    if (!publishedPost && (postLogs.length > 0 || scheduledPosts.length > 0)) {
      publishedPost = postLogs[0] || scheduledPosts[0];
    }

    if (
      publishedPost &&
      publishedPost.social_account_id &&
      publishedPost.status !== "deleted"
    ) {
      const accountId = publishedPost.social_account_id;
      const foundAccount = connectedAccounts.find(
        (acc: any) => acc.id === accountId
      );

      if (foundAccount) {
        isLinkedAccountConnected = true;
        linkedAccountName = foundAccount.name || foundAccount.platform;
      } else {
        // Try to find name from historical data if available
        linkedAccountName =
          publishedPost.social_account?.account_name ||
          publishedPost.account_name ||
          "Unknown Account";
      }
    } else {
      // Fallback if no specific scheduled post found but status is published (legacy or other)
      // Assume connected if we can't prove otherwise? No, safer to warn.
      // Actually, if we can't find the record, we can't Unpublish via API anyway.
      isLinkedAccountConnected = false;
    }

    if (!isLinkedAccountConnected) {
      // NEW FLOW: Account missing/different
      const confirmed = await confirm({
        title:
          t("publications.modal.edit.accountMissingTitle") ||
          "Account Disconnected",
        message:
          t("publications.modal.edit.accountMissingText", {
            account: linkedAccountName,
          }) ||
          `This publication was posted on an account (${linkedAccountName}) that is no longer connected. Editing it will create a new version for your current account(s). Proceed?`,
        confirmText: t("common.continue") || "Continue & Edit",
        cancelText: t("common.cancel"),
        type: "warning",
      });

      if (confirmed) {
        // Open edit modal directly without unpublishing
        // Clear association to force "fresh start" behavior
        openEditModal({
          ...item,
          status: "draft",
          social_account_id: null,
          scheduled_posts: [], // Remove history of scheduling from the new draft version
        });
      }
      return;
    }

    // STANDARD FLOW: Account connected
    const confirmed = await confirm({
      title: "Unpublish & Edit",
      message:
        "This publication is currently live. To edit it, we must first delete it from all social platforms (YouTube, etc). This cannot be undone. Continue?",
      confirmText: "Unpublish & Edit",
      cancelText: "Cancel",
      type: "warning",
    });

    if (confirmed) {
      const toastId = toast.loading("Unpublishing...");
      try {
        const response = await axios.post(`/publications/${item.id}/unpublish`);
        if (response.data.success) {
          toast.success("Unpublished successfully", { id: toastId });
          await fetchCampaigns(filters);
          openEditModal({ ...item, status: "draft" });
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to unpublish", {
          id: toastId,
        });
        console.error(error);
      }
    }
  };

  const handleAddCampaign = async (success: boolean) => {
    if (success) {
      setIsModalOpen(false);
      await fetchCampaigns(filters);
    }
  };

  const handleUpdate = async (success: boolean) => {
    if (success) {
      // Modal usually closes itself via onClose, but we trigger refresh
      await fetchCampaigns(filters);
    }
  };

  const bgGradient =
    theme === "dark"
      ? "bg-gradient-to-br from-neutral-900 to-neutral-800"
      : "bg-gradient-to-br from-beige-50 to-white";

  const iconGradient =
    theme === "dark"
      ? "from-primary-500 to-primary-700"
      : "from-primary-600 to-primary-800";

  const titleGradient =
    theme === "dark"
      ? "from-gray-200 to-gray-400"
      : "from-gray-800 to-gray-600";

  const subtitleColor = theme === "dark" ? "text-gray-400" : "text-gray-600";

  const tabBg = theme === "dark" ? "" : "bg-white/60";

  return (
    <AuthenticatedLayout>
      <Head title={t("manageContent.title")} />
      <div className={`min-h-screen transition-colors duration-300`}>
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-12 text-center">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${iconGradient} rounded-lg mb-6`}
            >
              <Folder className="w-8 h-8 text-white" />
            </div>
            <h1
              className={`text-4xl font-bold bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent mb-4`}
            >
              ✨ {t("manageContent.title")}
            </h1>

            <p className={`text-lg ${subtitleColor} max-w-2xl mx-auto`}>
              {t("manageContent.subtitle")}
            </p>
          </div>

          <div className="space-y-8">
            <SocialMediaAccounts
              connectedAccounts={connectedAccounts}
              isLoadingProp={isLoadingAccounts}
              onForceRefresh={fetchAccounts}
            />

            {/* Tabs */}
            <div className={`${tabBg} rounded-xl shadow-lg `}>
              <div className="">
                <div className="flex items-center justify-center gap-0.5 p-1 rounded-xl max-w-md mx-auto pt-6">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setActiveTab(
                            tab.id as "publications" | "campaigns" | "logs"
                          )
                        }
                        className={`group relative flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                          isActive
                            ? "bg-white dark:bg-gray-900 shadow-sm text-primary-600 dark:text-primary-400"
                            : "text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300"
                        }`}
                      >
                        {/* Línea inferior activa */}
                        {isActive && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full"></div>
                        )}

                        <tab.icon
                          className={`w-4 h-4 transition-colors duration-200 ${
                            isActive
                              ? "text-primary-500"
                              : "group-hover:text-primary-400"
                          }`}
                        />

                        <span className="hidden sm:inline text-sm font-medium">
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="">
                {activeTab === "logs" ? (
                  <LogsList />
                ) : (
                  <CampaignList
                    items={campaigns}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    mode={activeTab as "campaigns" | "publications"}
                    onEdit={openEditModal}
                    onDelete={handleDeleteCampaign}
                    onAdd={() => setIsModalOpen(true)}
                    onPublish={openPublishModal}
                    onViewDetails={openViewDetailsModal}
                    isLoading={isLoading}
                    onFilterChange={handleFilterChange}
                    onRefresh={fetchCampaigns}
                    onEditRequest={handleEditRequest}
                    connectedAccounts={connectedAccounts}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        activeTab === "publications" ? (
          <AddPublicationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleAddCampaign}
          />
        ) : (
          <AddCampaignModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleAddCampaign}
          />
        ),
        document.body
      )}

      {createPortal(
        activeTab === "publications" ? (
          <EditPublicationModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
            publication={selectedItem as Publication}
            onSubmit={handleUpdate}
          />
        ) : (
          <EditCampaignModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
            campaign={selectedItem as Campaign}
            onSubmit={handleUpdate}
          />
        ),
        document.body
      )}

      {createPortal(
        activeTab === "publications" ? (
          <PublishPublicationModal
            isOpen={isPublishModalOpen}
            onClose={() => {
              setIsPublishModalOpen(false);
              setSelectedItem(null);
            }}
            publication={selectedItem as Publication}
            onSuccess={() => fetchCampaigns(filters)}
          />
        ) : (
          <PublishCampaignModal
            isOpen={isPublishModalOpen}
            onClose={() => {
              setIsPublishModalOpen(false);
              setSelectedItem(null);
            }}
            campaign={selectedItem as Campaign}
          />
        ),
        document.body
      )}

      {createPortal(
        <ViewCampaignModal
          isOpen={isViewDetailsModalOpen}
          onClose={() => {
            setIsViewDetailsModalOpen(false);
            setSelectedItem(null);
          }}
          campaign={selectedItem as any}
        />,
        document.body
      )}

      <ConfirmDialog />
    </AuthenticatedLayout>
  );
}

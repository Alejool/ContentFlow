import LogsList from "@/Components/ManageContent/Logs/LogsList";
import CampaignList from "@/Components/ManageContent/Partials/CampaignList";
import AddCampaignModal from "@/Components/ManageContent/modals/AddCampaignModal";
import AddPublicationModal from "@/Components/ManageContent/modals/AddPublicationModal";
import EditCampaignModal from "@/Components/ManageContent/modals/EditCampaignModal";
import EditPublicationModal from "@/Components/ManageContent/modals/EditPublicationModal";
import PublishCampaignModal from "@/Components/ManageContent/modals/PublishCampaignModal";
import PublishPublicationModal from "@/Components/ManageContent/modals/PublishPublicationModal";
import ViewCampaignModal from "@/Components/ManageContent/modals/ViewCampaignModal";
import SocialMediaAccounts from "@/Components/ManageContent/socialAccount/SocialMediaAccounts";
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

import { usePublicationStore } from "@/stores/publicationStore";

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

  // Stores
  const publicationStore = usePublicationStore();
  const campaignManagement = useCampaignManagement("campaigns");

  const {
    campaigns,
    pagination: campaignPagination,
    isLoading: isCampaignLoading,
    fetchCampaigns,
    deleteCampaign,
    updateCampaign,
  } = campaignManagement;

  // Derived state based on active tab
  const items =
    activeTab === "publications" ? publicationStore.publications : campaigns;
  const pagination =
    activeTab === "publications"
      ? publicationStore.pagination
      : campaignPagination;
  const isLoading =
    activeTab === "publications"
      ? publicationStore.isLoading
      : isCampaignLoading;

  useEffect(() => {
    if (activeTab === "publications") {
      publicationStore.fetchPublications(filters);
    } else if (activeTab === "campaigns") {
      fetchCampaigns(filters);
    }
  }, [filters, activeTab]);

  const handlePageChange = (page: number) => {
    if (activeTab === "publications") {
      publicationStore.fetchPublications(filters, page);
    } else {
      fetchCampaigns(filters, page);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

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

  // Delete handling logic is now consolidated in handleDeleteItem below
  const { fetchAccounts, accounts: connectedAccounts } = useSocialMediaAuth();

  // Delete handling
  const handleDeleteItem = async (id: number) => {
    const isPublication = activeTab === "publications";
    const itemType = isPublication ? "publication" : "campaign";

    // We can add specific messages for publication vs campaign deletion if needed
    const confirmed = await confirm({
      title: t(`${itemType}s.messages.confirmDelete.title`) || "Confirm Delete",
      message:
        t(`${itemType}s.messages.confirmDelete.text`) ||
        "Are you sure you want to delete this item?",
      confirmText:
        t(`${itemType}s.messages.confirmDelete.confirmButton`) || "Delete",
      cancelText: t(`common.cancel`) || "Cancel",
      type: "danger",
    });

    if (confirmed) {
      if (isPublication) {
        try {
          await axios.delete(`/publications/${id}`);
          publicationStore.removePublication(id); // Update store after successful API call
          toast.success(t("publications.messages.deleteSuccess"));
        } catch (e) {
          toast.error(t("publications.messages.deleteError"));
        }
      } else {
        await deleteCampaign(id);
      }
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleRefreshAccounts = async () => {
    await fetchAccounts();
  };

  // ... rest of component logic (handleEditRequest, etc) needs to use 'items' now instead of campaigns/publications directly if possible, or just pass correct one.

  const handleEditRequest = async (item: Publication | any) => {
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
            <SocialMediaAccounts />

            {/* Tabs */}
            <div className={` rounded-lg `}>
              <div className="flex items-center justify-center gap-0.5 p-1 rounded-lg max-w-md mx-auto pt-6">
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

              {/* Content */}
              <div className="">
                {activeTab === "logs" ? (
                  <LogsList />
                ) : (
                  <CampaignList
                    key={`campaigns-${connectedAccounts.length}`}
                    items={items} // Use unified items
                    pagination={pagination} // Use unified pagination
                    onPageChange={handlePageChange}
                    mode={activeTab as "campaigns" | "publications"}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem} // Use new unified delete handler
                    onAdd={() => setIsModalOpen(true)}
                    onPublish={openPublishModal}
                    onViewDetails={openViewDetailsModal}
                    isLoading={isLoading} // Use unified loading state
                    onFilterChange={handleFilterChange}
                    onRefresh={() =>
                      activeTab === "publications"
                        ? publicationStore.fetchPublications(filters)
                        : fetchCampaigns(filters)
                    }
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

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

import { useCampaignStore } from "@/stores/campaignStore";
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

  const [selectedItem, setSelectedItem] = useState<
    Campaign | Publication | null
  >(null);
  const [filters, setFilters] = useState<any>({});

  const [logs, setLogs] = useState<any[]>([]);
  const [logsPagination, setLogsPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const publicationStore = usePublicationStore();
  const campaignStore = useCampaignStore();

  const getItems = () => {
    switch (activeTab) {
      case "publications":
        return publicationStore.publications;
      case "campaigns":
        return campaignStore.campaigns;
      case "logs":
        return logs;
      default:
        return [];
    }
  };

  const getPagination = () => {
    switch (activeTab) {
      case "publications":
        return publicationStore.pagination;
      case "campaigns":
        return campaignStore.pagination;
      case "logs":
        return logsPagination;
      default:
        return { current_page: 1, last_page: 1, total: 0, per_page: 10 };
    }
  };

  const getIsLoading = () => {
    switch (activeTab) {
      case "publications":
        return publicationStore.isLoading;
      case "campaigns":
        return campaignStore.isLoading;
      case "logs":
        return isLogsLoading;
      default:
        return false;
    }
  };

  const fetchData = async (page = 1) => {
    switch (activeTab) {
      case "publications":
        await publicationStore.fetchPublications(filters, page);
        break;
      case "campaigns":
        await campaignStore.fetchCampaigns(filters, page);
        break;
      case "logs":
        setIsLogsLoading(true);
        try {
          const response = await axios.get("/logs", {
            params: { page, ...filters },
          });
          if (response.data.success) {
            setLogs(response.data.logs.data);
            setLogsPagination({
              current_page: response.data.logs.current_page,
              last_page: response.data.logs.last_page,
              total: response.data.logs.total,
              per_page: response.data.logs.per_page,
            });
          }
        } catch (error) {
          console.error("Failed to fetch logs:", error);
          toast.error(t("logs.error_fetching"));
        } finally {
          setIsLogsLoading(false);
        }
        break;
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, activeTab, !isEditModalOpen, !isPublishModalOpen]);

  const handlePageChange = (page: number) => {
    fetchData(page);
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
          publicationStore.removePublication(id);
          toast.success(t("publications.messages.deleteSuccess"));
        } catch (e) {
          toast.error(t("publications.messages.deleteError"));
        }
      } else {
        try {
          await axios.delete(`/campaigns/${id}`);
          campaignStore.removeCampaign(id);
          toast.success(t("campaigns.messages.deleteSuccess"));
        } catch (e) {
          toast.error(t("campaigns.messages.deleteError"));
        }
      }
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleRefreshAccounts = async () => {
    await fetchAccounts();
  };

  const handleEditRequest = async (item: Publication | any) => {
    if (item.status !== "published") {
      openEditModal(item);
      return;
    }

    let isLinkedAccountConnected = false;
    let linkedAccountName = "Unknown";

    const postLogs = item.social_post_logs || [];
    const scheduledPosts = item.scheduled_posts || [];

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
        linkedAccountName =
          publishedPost.social_account?.account_name ||
          publishedPost.account_name ||
          "Unknown Account";
      }
    } else {
      isLinkedAccountConnected = false;
    }

    if (!isLinkedAccountConnected) {
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
        openEditModal({
          ...item,
          status: "draft",
          social_account_id: null,
          scheduled_posts: [],
        });
      }
      return;
    }

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
          await fetchData(getPagination().current_page);
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
      await fetchData();
    }
  };

  const handleUpdate = async (success: boolean) => {
    if (success) {
      await fetchData(getPagination().current_page);
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
      <div className={`min-h-screen transition-colors duration-300 mt-12`}>
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-12 text-center">
            <h1
              className={`text-4xl font-bold bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent mb-4 flex items-center gap-2 justify-center`}
            >
              <Folder className="w-8 h-8  text-primary-600 mr-2" />
              {t("manageContent.title")}
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
                  <LogsList
                    logs={getItems() as any}
                    isLoading={getIsLoading()}
                    pagination={getPagination()}
                    onPageChange={handlePageChange}
                    onRefresh={() => fetchData(getPagination().current_page)}
                  />
                ) : (
                  <CampaignList
                    key={`campaigns-${connectedAccounts.length}`}
                    items={getItems() as any}
                    pagination={getPagination()}
                    onPageChange={handlePageChange}
                    mode={activeTab as "campaigns" | "publications"}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onAdd={() => setIsModalOpen(true)}
                    onPublish={openPublishModal}
                    onViewDetails={openViewDetailsModal}
                    isLoading={getIsLoading()}
                    onFilterChange={handleFilterChange}
                    onRefresh={() => fetchData(getPagination().current_page)}
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
            onSuccess={() => fetchData(getPagination().current_page)}
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

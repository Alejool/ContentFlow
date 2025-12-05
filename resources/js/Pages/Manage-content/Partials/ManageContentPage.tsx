import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { useConfirm } from "@/Hooks/useConfirm";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AddCampaignModal from "@/Pages/Manage-content/Partials/AddCampaignModal";
import CampaignList from "@/Pages/Manage-content/Partials/CampaignList";
import EditCampaignModal from "@/Pages/Manage-content/Partials/EditCampaignModal";
import PublishCampaignModal from "@/Pages/Manage-content/Partials/PublishCampaignModal";
import SocialMediaAccounts from "@/Pages/Manage-content/Partials/SocialMediaAccounts";
import ViewCampaignModal from "@/Pages/Manage-content/Partials/ViewCampaignModal";
import { Campaign } from "@/types/Campaign";
import { Head } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export default function ManageContentPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [filters, setFilters] = useState<any>({});

  const { campaigns, isLoading, fetchCampaigns, addCampaign, deleteCampaign } =
    useCampaignManagement();

  useEffect(() => {
    fetchCampaigns(filters);
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const openEditModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const openPublishModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsPublishModalOpen(true);
  };

  const openViewDetailsModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsViewDetailsModalOpen(true);
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    const confirmed = await confirm({
      title: t("campaigns.messages.confirmDelete.title"),
      message: t("campaigns.messages.confirmDelete.text"),
      confirmText: t("campaigns.messages.confirmDelete.confirmButton"),
      cancelText: t("campaigns.messages.confirmDelete.cancelButton"),
      type: "danger",
    });

    if (confirmed) {
      await deleteCampaign(campaignId);
    }
  };

  const handleAddCampaign = async (data: Campaign) => {
    const success = await addCampaign(data);
    if (success) {
      setIsModalOpen(false);
      await fetchCampaigns(filters);
    }
  };

  const bgGradient =
    theme === "dark"
      ? "bg-gradient-to-br from-neutral-900 to-neutral-800"
      : "bg-gradient-to-br from-beige-50 to-white";

  const iconGradient =
    theme === "dark"
      ? "from-orange-500 to-orange-700"
      : "from-orange-600 to-orange-800";

  const titleGradient =
    theme === "dark"
      ? "from-gray-200 to-gray-400"
      : "from-gray-800 to-gray-600";

  const subtitleColor = theme === "dark" ? "text-gray-400" : "text-gray-600";

  return (
    <AuthenticatedLayout>
      <Head title={t("manageContent.title")} />
      <div className={`min-h-screen transition-colors duration-300`}>
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-12 text-center">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${iconGradient} rounded-lg mb-6`}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
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
            <CampaignList
              campaigns={campaigns}
              onEdit={openEditModal}
              onDelete={handleDeleteCampaign}
              onAdd={() => setIsModalOpen(true)}
              onPublish={openPublishModal}
              onViewDetails={openViewDetailsModal}
              isLoading={isLoading}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {createPortal(
        <AddCampaignModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddCampaign}
        />,
        document.body
      )}

      {createPortal(
        <EditCampaignModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
        />,
        document.body
      )}

      {createPortal(
        <PublishCampaignModal
          isOpen={isPublishModalOpen}
          onClose={() => {
            setIsPublishModalOpen(false);
            setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
        />,
        document.body
      )}

      {createPortal(
        <ViewCampaignModal
          isOpen={isViewDetailsModalOpen}
          onClose={() => {
            setIsViewDetailsModalOpen(false);
            setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
        />,
        document.body
      )}

      <ConfirmDialog />
    </AuthenticatedLayout>
  );
}

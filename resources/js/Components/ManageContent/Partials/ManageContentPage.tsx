import LogsList from "@/Components/ManageContent/Logs/LogsList";
import CampaignList from "@/Components/ManageContent/Partials/CampaignList";
import AddCampaignModal from "@/Components/ManageContent/modals/AddCampaignModal";
import AddPublicationModal from "@/Components/ManageContent/modals/AddPublicationModal";
import EditCampaignModal from "@/Components/ManageContent/modals/EditCampaignModal";
import EditPublicationModal from "@/Components/ManageContent/modals/EditPublicationModal";
import PublishPublicationModal from "@/Components/ManageContent/modals/PublishPublicationModal";
import ViewCampaignModal from "@/Components/ManageContent/modals/ViewCampaignModal";
import SocialMediaAccounts from "@/Components/ManageContent/socialAccount/SocialMediaAccounts";
import { usePublishPublication } from "@/Hooks/publication/usePublishPublication";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { Head } from "@inertiajs/react";
import { FileText, Folder, Target } from "lucide-react";
import { createPortal } from "react-dom";

import { usePublications } from "@/Hooks/publication/usePublications";

export default function ManageContentPage() {
  const {
    t,
    activeTab,
    setActiveTab,
    filters,
    handleFilterChange,
    selectedItem,
    setSelectedItem,
    items,
    pagination,
    isLoading,
    handlePageChange,
    handleRefresh,
    isAddModalOpen,
    isEditModalOpen,
    isPublishModalOpen,
    isViewDetailsModalOpen,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openPublishModal,
    closePublishModal,
    openViewDetailsModal,
    closeViewDetailsModal,
    handleDeleteItem,
    handleEditRequest,
    connectedAccounts,
  } = usePublications();

  const { theme } = useTheme();
  const { fetchPublishedPlatforms } = usePublishPublication();

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

  const titleGradient =
    theme === "dark"
      ? "from-gray-200 to-gray-400"
      : "from-gray-800 to-gray-600";

  const subtitleColor = theme === "dark" ? "text-gray-400" : "text-gray-600";

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

            <div className={` rounded-lg `}>
              <div className="flex items-center justify-center gap-0.5 p-1 rounded-lg max-w-md mx-auto pt-6">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`group relative flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        isActive
                          ? "bg-white dark:bg-gray-900 shadow-sm text-primary-600 dark:text-primary-400"
                          : "text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300"
                      }`}
                    >
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

              <div className="block">
                {activeTab === "logs" ? (
                  <LogsList
                    logs={items as any}
                    isLoading={isLoading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onRefresh={handleRefresh}
                    onFilterChange={handleFilterChange}
                  />
                ) : (
                  <CampaignList
                    key={`campaigns-${connectedAccounts.length}`}
                    items={items as any}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    mode={activeTab as "campaigns" | "publications"}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onAdd={openAddModal}
                    onPublish={openPublishModal}
                    onViewDetails={openViewDetailsModal}
                    isLoading={isLoading}
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
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
            isOpen={isAddModalOpen}
            onClose={closeAddModal}
            onSubmit={handleRefresh}
          />
        ) : (
          <AddCampaignModal
            isOpen={isAddModalOpen}
            onClose={closeAddModal}
            onSubmit={handleRefresh}
          />
        ),
        document.body
      )}

      {createPortal(
        activeTab === "publications" ? (
          <EditPublicationModal
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            publication={selectedItem as Publication}
            onSubmit={handleRefresh}
          />
        ) : (
          <EditCampaignModal
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            campaign={selectedItem as Campaign}
            onSubmit={handleRefresh}
          />
        ),
        document.body
      )}

      {createPortal(
        activeTab === "publications" && (
          <PublishPublicationModal
            isOpen={isPublishModalOpen}
            onClose={(id?: number) => {
              const idToRefresh = id || selectedItem?.id;
              closePublishModal();
              if (idToRefresh) {
                fetchPublishedPlatforms(idToRefresh);
              }
            }}
            publication={selectedItem as Publication}
            onSuccess={handleRefresh}
          />
        ),
        document.body
      )}

      {createPortal(
        <ViewCampaignModal
          isOpen={isViewDetailsModalOpen}
          onClose={closeViewDetailsModal}
          campaign={selectedItem as any}
        />,
        document.body
      )}
    </AuthenticatedLayout>
  );
}

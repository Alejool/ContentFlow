import LogsList from "@/Components/ManageContent/Logs/LogsList";
import CampaignList from "@/Components/ManageContent/Partials/CampaignList";
import ModalManager from "@/Components/ManageContent/ModalManager";
import SocialMediaAccounts from "@/Components/ManageContent/socialAccount/SocialMediaAccounts";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { FileText, Folder, Target } from "lucide-react";

import { usePublications } from "@/Hooks/publication/usePublications";
import WorkspaceInfoBadge from "@/Components/Workspace/WorkspaceInfoBadge";
import EditorialCalendar from "@/Components/ManageContent/Partials/EditorialCalendar";
import { Calendar as CalendarLucide } from "lucide-react";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { useShallow } from "zustand/react/shallow";

export default function ManageContentPage() {
  const {
    t,
    filters,
    handleFilterChange,
    items,
    pagination,
    isLoading,
    handlePageChange,
    handleRefresh,
    handleDeleteItem,
    handleEditRequest,
    connectedAccounts,
    publications,
    campaigns,
    logs,
    isPubLoading,
    isCampLoading,
    isLogsLoading,
    pubPagination,
    campPagination,
    logPagination,
  } = usePublications();

  // Optimized subscription: ONLY subscribe to activeTab and Actions.
  // We explicitly DO NOT subscribe to isModalOpen or selectedItem.
  // This prevents the heavy list from re-rendering when modals open/close.
  const {
    activeTab,
    setActiveTab,
    openAddModal,
    openEditModal,
    openPublishModal,
    openViewDetailsModal,
  } = useManageContentUIStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      openAddModal: s.openAddModal,
      openEditModal: s.openEditModal,
      openPublishModal: s.openPublishModal,
      openViewDetailsModal: s.openViewDetailsModal,
    }))
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
    {
      id: "calendar",
      icon: CalendarLucide,
      label: "Calendar",
    },
  ];



  return (
    <AuthenticatedLayout>
      <Head title={t("manageContent.title")} />
      <div className={`min-h-screen transition-colors duration-300 mt-12`}>
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h1
                className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent flex items-center gap-2"
              >
                <Folder className="w-8 h-8  text-primary-600 mr-2" />
                {t("manageContent.title")}
              </h1>
              <WorkspaceInfoBadge variant="full" />
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
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
                      className={`group relative flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isActive
                        ? "bg-white dark:bg-gray-900 shadow-sm text-primary-600 dark:text-primary-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300"
                        }`}
                    >
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full"></div>
                      )}

                      <tab.icon
                        className={`w-4 h-4 transition-colors duration-200 ${isActive
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
                {/* Persistent Logs Tab */}
                <div className={activeTab === "logs" ? "block" : "hidden"}>
                  <LogsList
                    logs={logs as any}
                    isLoading={isLogsLoading}
                    pagination={logPagination}
                    onPageChange={handlePageChange}
                    onRefresh={handleRefresh}
                    onFilterChange={handleFilterChange}
                  />
                </div>

                {/* Persistent Calendar Tab */}
                <div className={activeTab === "calendar" ? "block" : "hidden"}>
                  <EditorialCalendar />
                </div>

                {/* Persistent Campaigns Tab */}
                <div className={activeTab === "campaigns" ? "block" : "hidden"}>
                  <CampaignList
                    key={`campaigns-list-${connectedAccounts.length}`}
                    items={campaigns as any}
                    pagination={campPagination}
                    onPageChange={handlePageChange}
                    mode="campaigns"
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onAdd={openAddModal}
                    onPublish={openPublishModal}
                    onViewDetails={openViewDetailsModal}
                    isLoading={isCampLoading}
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
                    onEditRequest={handleEditRequest}
                    connectedAccounts={connectedAccounts}
                  />
                </div>

                {/* Persistent Publications Tab */}
                <div className={activeTab === "publications" ? "block" : "hidden"}>
                  <CampaignList
                    key={`publications-list-${connectedAccounts.length}`}
                    items={publications as any}
                    pagination={pubPagination}
                    onPageChange={handlePageChange}
                    mode="publications"
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onAdd={openAddModal}
                    onPublish={openPublishModal}
                    onViewDetails={openViewDetailsModal}
                    isLoading={isPubLoading}
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
                    onEditRequest={handleEditRequest}
                    connectedAccounts={connectedAccounts}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Manager handles all modal rendering independently */}
      <ModalManager onRefresh={handleRefresh} />
    </AuthenticatedLayout>
  );
}

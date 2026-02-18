import LogsList from "@/Components/Content/Logs/LogsList";
import ModalManager from "@/Components/Content/ModalManager";
import ModalFooter from "@/Components/Content/modals/common/ModalFooter";
import ModalHeader from "@/Components/Content/modals/common/ModalHeader";
import SocialMediaAccounts from "@/Components/Content/socialAccount/SocialMediaAccounts";
import Modal from "@/Components/common/ui/Modal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { Head, usePage } from "@inertiajs/react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  FileText,
  Folder,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "react-hot-toast";

import ApprovalHistory from "@/Components/ManageContent/ApprovalHistory";
import ApprovalList from "@/Components/ManageContent/ApprovalList";
import ApprovalStats from "@/Components/ManageContent/ApprovalStats";
import ContentList from "@/Components/ManageContent/ContentList";
import ModernCalendar from "@/Components/ManageContent/Partials/ModernCalendar";
import Button from "@/Components/common/Modern/Button";
import Dropdown from "@/Components/common/ui/Dropdown";

import {
  ContentTab,
  usePublications,
} from "@/Hooks/publication/usePublications";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { useShallow } from "zustand/react/shallow";

export default function ContentPage() {
  const { auth } = usePage<any>().props;
  const permissions = auth.current_workspace?.permissions || [];

  const {
    t,
    handleFilterChange,
    handleSingleFilterChange,
    handlePageChange,
    handlePerPageChange,
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
    filters,
  } = usePublications();

  // Fetch publication details if ID in URL
  const fetchPublicationById = usePublicationStore(
    (s) => s.fetchPublicationById,
  );
  const deletePublicationAction = usePublicationStore(
    (s) => s.deletePublication,
  );
  const deleteCampaignAction = useCampaignStore((s) => s.deleteCampaign);

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
    })),
  );

  const [isTabPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(true);
  const [search, setSearch] = useState("");

  // Sync search with filters (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilterChange({ ...filters, search: search || undefined });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  const handleTabChange = useCallback(
    (tab: ContentTab) => {
      startTransition(() => {
        setActiveTab(tab);
        setSearch(""); // Clear search when changing tabs
        handleFilterChange({});
      });
    },
    [setActiveTab, handleFilterChange],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as ContentTab;
    
    // Only set tab from URL if explicitly provided, otherwise use stored tab
    if (
      tab &&
      ["publications", "campaigns", "calendar", "logs", "approvals"].includes(
        tab,
      )
    ) {
      setActiveTab(tab);
    }

    if (params.get("action") === "create") {
      openAddModal();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("action");
      window.history.replaceState({}, "", newUrl.toString());
    }

    const id = params.get("id");
    if (id) {
      const pubId = parseInt(id);
      if (!isNaN(pubId)) {
        const fetchAndShow = async () => {
          const pub = await fetchPublicationById(pubId);
          startTransition(() => {
            if (pub) {
              openViewDetailsModal(pub);
            }
          });
        };
        fetchAndShow();
      }
    }
  }, [
    window.location.search,
    fetchPublicationById,
    openViewDetailsModal,
    openAddModal,
    setActiveTab,
  ]);

  const [approvalTab, setApprovalTab] = useState("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id: number | null;
  }>({ isOpen: false, id: null });

  const handleRefreshWrapped = useCallback(() => {
    handleRefresh();
    setRefreshTrigger((prev) => prev + 1);
  }, [handleRefresh]);

  const handleDeleteItemClick = (id: number) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.id) return;

    if (activeTab === "campaigns") {
      const success = await deleteCampaignAction(deleteConfirmation.id);

      setDeleteConfirmation({ isOpen: false, id: null });
      if (success) {
        toast.success(
          t("common.deleteSuccess") || "Campaign deleted successfully",
        );
        handleRefreshWrapped();
      } else {
        toast.error(t("common.deleteError") || "Failed to delete campaign");
      }
      return;
    }

    // For publications, use store action
    const success = await deletePublicationAction(deleteConfirmation.id);
    setDeleteConfirmation({ isOpen: false, id: null });
    if (success) {
      toast.success(
        t("common.deleteSuccess") || "Elemento eliminado correctamente",
      );
    } else {
      toast.error(t("common.deleteError") || "Error al eliminar el elemento");
    }
  };

  const [expandedCampaigns, setExpandedCampaigns] = useState<number[]>([]);
  const toggleExpand = useCallback((id: number) => {
    setExpandedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
    );
  }, []);

  const handleEventClick = useCallback(
    async (id: any) => {
      if (typeof id === "number") {
        const existingPub = publications.find((p) => p.id === id);
        if (existingPub) {
          openEditModal(existingPub);
        } else {
          const pub = await fetchPublicationById(id);
          if (pub) {
            openEditModal(pub);
          }
        }
      }
    },
    [publications, openEditModal, fetchPublicationById],
  );

  return (
    <AuthenticatedLayout>
      <Head title={t("manageContent.title")} />

      <div className="w-full max-w-full overflow-x-hidden min-w-0 bg-gray-50/30 dark:bg-neutral-900/10 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 min-w-0">
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white truncate tracking-tight">
                {t("manageContent.title")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-2 text-xs sm:text-base lg:text-lg truncate">
                {t("manageContent.subtitle")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {permissions.includes("content") && (
                <Dropdown>
                  <Dropdown.Trigger>
                    <Button
                      variant="primary"
                      size="lg"
                      icon={Plus}
                      className="gap-2"
                    >
                      {t("manageContent.createNew")}
                    </Button>
                  </Dropdown.Trigger>
                  <Dropdown.Content
                    align="left"
                    className="lg:!left-auto lg:!right-0 lg:!origin-top-right"
                    width="auto"
                    contentClasses="py-2 bg-white dark:bg-neutral-800 shadow-lg rounded-lg border border-gray-100 dark:border-neutral-700 min-w-[220px]"
                  >
                    <Button
                      onClick={() => openAddModal("publication")}
                      variant="ghost"
                      buttonStyle="ghost"
                      size="lg"
                      icon={FileText}
                      iconPosition="left"
                      fullWidth
                      className="justify-start hover:bg-gray-50 dark:hover:bg-neutral-700/50 rounded-lg mx-2 text-gray-700 dark:text-gray-200"
                    >
                      {t("manageContent.tabs.publications")}
                    </Button>
                    <Button
                      onClick={() => openAddModal("campaign")}
                      variant="ghost"
                      buttonStyle="ghost"
                      size="lg"
                      icon={Target}
                      iconPosition="left"
                      fullWidth
                      className="justify-start hover:bg-gray-50 dark:hover:bg-neutral-700/50 rounded-lg mx-2 text-gray-700 dark:text-gray-200"
                    >
                      {t("manageContent.tabs.campaigns")}
                    </Button>
                  </Dropdown.Content>
                </Dropdown>
              )}
            </div>
          </div>

          <div className="mb-8">
            <SocialMediaAccounts />
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center p-1 rounded-lg bg-gray-100 dark:bg-neutral-800/50 gap-1 overflow-x-auto max-w-full">
              <Button
                onClick={() => handleTabChange("publications")}
                variant="ghost"
                buttonStyle="ghost"
                size="sm"
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "publications"
                    ? "bg-white dark:bg-neutral-800 text-primary-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                }`}
                icon={Folder}
                iconPosition="left"
              >
                <span>{t("content.tabs.publications")}</span>
              </Button>
              <Button
                onClick={() => handleTabChange("campaigns")}
                variant="ghost"
                buttonStyle="ghost"
                size="sm"
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "campaigns"
                    ? "bg-white dark:bg-neutral-800 text-primary-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                }`}
                icon={Target}
                iconPosition="left"
              >
                <span>{t("content.tabs.campaigns")}</span>
              </Button>
              <Button
                onClick={() => handleTabChange("calendar")}
                variant="ghost"
                buttonStyle="ghost"
                size="sm"
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "calendar"
                    ? "bg-white dark:bg-neutral-800 text-primary-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                }`}
                icon={CalendarIcon}
                iconPosition="left"
              >
                <span>{t("content.tabs.calendar")}</span>
              </Button>
              <Button
                onClick={() => handleTabChange("logs")}
                variant="ghost"
                buttonStyle="ghost"
                size="sm"
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "logs"
                    ? "bg-white dark:bg-neutral-800 text-primary-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                }`}
                icon={FileText}
                iconPosition="left"
              >
                <span>{t("content.tabs.logs")}</span>
              </Button>
              {permissions.includes("approve") && (
                <Button
                  onClick={() => handleTabChange("approvals")}
                  variant="ghost"
                  buttonStyle="ghost"
                  size="sm"
                  className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap relative ${
                    activeTab === "approvals"
                      ? "bg-white dark:bg-neutral-800 text-primary-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                  }`}
                  icon={CheckCircle}
                  iconPosition="left"
                >
                  <span>{t("content.tabs.approvals")}</span>
                  {publications.filter((p) => p.status === "pending_review")
                    .length > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        activeTab === "approvals"
                          ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {
                        publications.filter(
                          (p) => p.status === "pending_review",
                        ).length
                      }
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="min-h-[500px]">
            {activeTab === "calendar" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ModernCalendar onEventClick={handleEventClick} />
              </div>
            )}

            {activeTab === "approvals" && (
              <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                <ApprovalStats refreshTrigger={refreshTrigger} />

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                  <div className="border-b border-gray-200 dark:border-neutral-700 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50/50 dark:bg-neutral-800/50">
                    <div className="flex bg-gray-200/50 dark:bg-neutral-700/50 p-1 rounded-lg w-fit">
                      <Button
                        onClick={() => setApprovalTab("pending")}
                        variant="ghost"
                        buttonStyle="ghost"
                        size="sm"
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                          approvalTab === "pending"
                            ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {t("approvals.tabs.pending")}
                      </Button>
                      <Button
                        onClick={() => setApprovalTab("history")}
                        variant="ghost"
                        buttonStyle="ghost"
                        size="sm"
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                          approvalTab === "history"
                            ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {t("approvals.tabs.history")}
                      </Button>
                    </div>
                  </div>

                  <div className="p-0">
                    {approvalTab === "pending" ? (
                      <ApprovalList
                        publications={publications.filter(
                          (p) => p.status === "pending_review",
                        )}
                        isLoading={isPubLoading}
                        onRefresh={handleRefreshWrapped}
                        onViewDetail={openViewDetailsModal}
                      />
                    ) : (
                      <ApprovalHistory onRefresh={handleRefreshWrapped} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "logs" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <LogsList
                  logs={logs as any}
                  isLoading={isLogsLoading}
                  pagination={logPagination}
                  onPageChange={handlePageChange}
                  onPerPageChange={handlePerPageChange}
                  onRefresh={handleRefresh}
                  onFilterChange={handleSingleFilterChange}
                  filters={filters}
                  search={search}
                  onSearchChange={setSearch}
                />
              </div>
            )}

            {(activeTab === "publications" || activeTab === "campaigns") && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ContentList
                  title={
                    activeTab === "publications"
                      ? t("content.tabs.publications")
                      : t("content.tabs.campaigns")
                  }
                  onRefresh={handleRefreshWrapped}
                  items={
                    activeTab === "publications" ? publications : campaigns
                  }
                  isLoading={
                    activeTab === "publications" ? isPubLoading : isCampLoading
                  }
                  mode={
                    activeTab === "publications" ? "publications" : "campaigns"
                  }
                  pagination={
                    activeTab === "publications"
                      ? pubPagination
                      : campPagination
                  }
                  onPageChange={handlePageChange}
                  onEdit={(item) =>
                    useManageContentUIStore.getState().openEditModal(item)
                  }
                  onDelete={handleDeleteItemClick}
                  onViewDetails={openViewDetailsModal}
                  onPublish={(item) =>
                    useManageContentUIStore.getState().openPublishModal(item)
                  }
                  onEditRequest={handleEditRequest}
                  connectedAccounts={connectedAccounts}
                  expandedCampaigns={expandedCampaigns}
                  toggleExpand={toggleExpand}
                  permissions={permissions}
                  onPerPageChange={handlePerPageChange}
                  showFilters={showFilters}
                  onToggleFilters={setShowFilters}
                  filters={filters}
                  onFilterChange={handleSingleFilterChange}
                  search={search}
                  onSearchChange={setSearch}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalManager onRefresh={handleRefreshWrapped} />

      <Modal
        show={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, id: null })}
        maxWidth="md"
      >
        <ModalHeader
          t={t}
          onClose={() => setDeleteConfirmation({ isOpen: false, id: null })}
          title="common.deleteConfirmTitle"
          icon={Trash2}
          iconColor="text-red-500"
          size="md"
        />

        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("common.deleteConfirm") ||
              "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."}
          </p>
        </div>

        <ModalFooter
          onClose={() => setDeleteConfirmation({ isOpen: false, id: null })}
          onPrimarySubmit={confirmDelete}
          submitText={t("common.delete") || "Eliminar"}
          cancelText={t("common.cancel") || "Cancelar"}
          submitVariant="danger"
          submitIcon={<Trash2 className="w-4 h-4" />}
          cancelStyle="outline"
        />
      </Modal>
    </AuthenticatedLayout>
  );
}

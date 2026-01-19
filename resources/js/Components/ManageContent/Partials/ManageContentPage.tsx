import LogsList from "@/Components/ManageContent/Logs/LogsList";
import ModalManager from "@/Components/ManageContent/ModalManager";
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import SocialMediaAccounts from "@/Components/ManageContent/socialAccount/SocialMediaAccounts";
import Modal from "@/Components/common/ui/Modal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePublicationStore } from "@/stores/publicationStore";
import { Head, router, usePage } from "@inertiajs/react";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  Edit3,
  FileText,
  Folder,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import ApprovalHistory from "@/Components/ManageContent/ApprovalHistory";
import ApprovalList from "@/Components/ManageContent/ApprovalList";
import ApprovalStats from "@/Components/ManageContent/ApprovalStats";
import ContentList from "@/Components/ManageContent/ContentList";
import ModernCalendar from "@/Components/ManageContent/Partials/ModernCalendar";
import {
  ManageContentTab,
  usePublications,
} from "@/Hooks/publication/usePublications";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { useShallow } from "zustand/react/shallow";

export default function ManageContentPage() {
  const { auth } = usePage<any>().props;
  const permissions = auth.current_workspace?.permissions || [];

  const {
    t,
    handleFilterChange,
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

  const fetchPublicationById = usePublicationStore(
    (s) => s.fetchPublicationById,
  );

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

  const handleTabChange = useCallback(
    (tab: ManageContentTab) => {
      startTransition(() => {
        setActiveTab(tab);
        // Clear filters when switching tabs to avoid cross-tab filter pollution
        handleFilterChange({});
        // Also reset status tab for publications if needed
        if (tab === "publications") setStatusTab("all");
      });
    },
    [setActiveTab, handleFilterChange],
  );

  // Sync state with URL changes (This is still useful for deep linking)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as ManageContentTab;
    if (
      tab &&
      ["publications", "campaigns", "calendar", "logs", "approvals"].includes(
        tab,
      )
    ) {
      setActiveTab(tab);
    }
    // ... rest of effect ...

    // Handle actions (e.g. open create modal from command palette)
    if (params.get("action") === "create") {
      openAddModal();
      // Optional: Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("action");
      window.history.replaceState({}, "", newUrl.toString());
    }

    // Handle Deep Linking by ID (e.g. from approval links)
    const id = params.get("id");
    if (id) {
      const pubId = parseInt(id);
      if (!isNaN(pubId)) {
        startTransition(async () => {
          const pub = await fetchPublicationById(pubId);
          if (pub) {
            openViewDetailsModal(pub);
            // Optional: Clean up ID from URL to avoid re-opening on manual refresh if desired
            // const newUrl = new URL(window.location.href);
            // newUrl.searchParams.delete('id');
            // window.history.replaceState({}, '', newUrl.toString());
          }
        });
      }
    }
  }, [
    window.location.search,
    fetchPublicationById,
    openViewDetailsModal,
    openAddModal,
    setActiveTab,
  ]);

  const [statusTab, setStatusTab] = useState("all");
  const [approvalTab, setApprovalTab] = useState("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Delete Confirmation State
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

  const confirmDelete = () => {
    if (!deleteConfirmation.id) return;

    // Determine the correct route based on activeTab
    const routeName =
      activeTab === "campaigns" ? "campaigns.destroy" : "publications.destroy";

    router.delete(route(routeName, deleteConfirmation.id), {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteConfirmation({ isOpen: false, id: null });
        handleRefreshWrapped();
      },
      onFinish: () => {
        setDeleteConfirmation({ isOpen: false, id: null });
        // Ensure manual refresh if standard inertia reload doesn't catch it
        handleRefreshWrapped();
      },
    });
  };

  const statusTabs = useMemo(
    () => [
      { id: "all", label: t("manageContent.status.all"), icon: Folder },
      { id: "draft", label: t("manageContent.status.draft"), icon: Edit3 },
      {
        id: "scheduled",
        label: t("manageContent.status.scheduled"),
        icon: CalendarIcon,
      },
      {
        id: "published",
        label: t("manageContent.status.published"),
        icon: CheckCircle,
      },
    ],
    [],
  );

  const [isTabPending, startTransition] = useTransition();

  const handleStatusTabChange = useCallback(
    (status: string) => {
      startTransition(() => {
        setStatusTab(status);
        handleFilterChange({ ...filters, status });
      });
    },
    [filters, handleFilterChange],
  );

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

      <div className="w-full max-w-full overflow-x-hidden min-w-0">
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

            {permissions.includes("manage-content") ? (
              <button
                onClick={() => openAddModal()}
                className="w-full sm:w-auto group relative inline-flex h-11 sm:h-12 items-center justify-center overflow-hidden rounded-2xl sm:rounded-full bg-primary-600 px-6 sm:px-8 font-bold text-white transition-all duration-300 hover:bg-primary-700 hover:scale-[1.02] active:scale-95 hover:shadow-lg focus:outline-none ring-offset-2 ring-primary-500/20 shadow-xl shadow-primary-500/10"
              >
                <Plus className="mr-2 h-5 w-5" />
                <span className="relative font-bold">
                  {t("manageContent.createNew")}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg animate-in fade-in slide-in-from-right-4">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Tu rol solo permite ver el contenido
                </span>
              </div>
            )}
          </div>

          <div className="mb-8">
            <SocialMediaAccounts />
          </div>
          <div className="mb-8">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 gap-1 overflow-x-auto max-w-full scrollbar-hide">
              <button
                onClick={() => handleTabChange("publications")}
                className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "publications"
                    ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm shadow-gray-200/50 dark:shadow-none ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <Folder
                  className={`w-4 h-4 ${activeTab === "publications" ? "text-primary-500" : "opacity-70"}`}
                />
                <span>{t("manageContent.tabs.publications")}</span>
              </button>
              <button
                onClick={() => handleTabChange("campaigns")}
                className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "campaigns"
                    ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm shadow-gray-200/50 dark:shadow-none ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <Target
                  className={`w-4 h-4 ${activeTab === "campaigns" ? "text-primary-500" : "opacity-70"}`}
                />
                <span>{t("manageContent.tabs.campaigns")}</span>
              </button>
              <button
                onClick={() => handleTabChange("calendar")}
                className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "calendar"
                    ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm shadow-gray-200/50 dark:shadow-none ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <CalendarIcon
                  className={`w-4 h-4 ${activeTab === "calendar" ? "text-primary-500" : "opacity-70"}`}
                />
                <span>{t("manageContent.tabs.calendar")}</span>
              </button>
              <button
                onClick={() => handleTabChange("logs")}
                className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "logs"
                    ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm shadow-gray-200/50 dark:shadow-none ring-1 ring-black/5 dark:ring-white/10"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <FileText
                  className={`w-4 h-4 ${activeTab === "logs" ? "text-primary-500" : "opacity-70"}`}
                />
                <span>{t("manageContent.tabs.logs")}</span>
              </button>
              {permissions.includes("approve") && (
                <button
                  onClick={() => handleTabChange("approvals")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                    activeTab === "approvals"
                      ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm shadow-gray-200/50 dark:shadow-none ring-1 ring-black/5 dark:ring-white/10"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <CheckCircle
                    className={`w-4 h-4 ${activeTab === "approvals" ? "text-primary-500" : "opacity-70"}`}
                  />
                  <span>{t("manageContent.tabs.approvals")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="min-h-[500px]">
            {/* Calendar View */}
            {activeTab === "calendar" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ModernCalendar onEventClick={handleEventClick} />
              </div>
            )}

            {/* Approvals View */}
            {activeTab === "approvals" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ApprovalStats refreshTrigger={refreshTrigger} />

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
                  {/* Tabs */}
                  <div className="border-b border-gray-200 dark:border-neutral-700">
                    <div className="flex">
                      <button
                        onClick={() => setApprovalTab("pending")}
                        className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
                          approvalTab === "pending"
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {t("approvals.tabs.pending")}
                      </button>
                      <button
                        onClick={() => setApprovalTab("history")}
                        className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${
                          approvalTab === "history"
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {t("approvals.tabs.history")}
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
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

            {/* Logs View */}
            {activeTab === "logs" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <LogsList
                  logs={logs as any}
                  isLoading={isLogsLoading}
                  pagination={logPagination}
                  onPageChange={handlePageChange}
                  onPerPageChange={handlePerPageChange}
                  onRefresh={handleRefresh}
                  onFilterChange={handleFilterChange}
                />
              </div>
            )}

            {/* Publications & Campaigns Views (With Status Tabs) */}
            {(activeTab === "publications" || activeTab === "campaigns") && (
              <div className="animate-in fade-in zoom-in duration-300">
                {activeTab === "publications" && (
                  <div className="flex items-center gap-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 w-full sm:w-fit overflow-x-auto scrollbar-subtle">
                    {statusTabs.map(
                      (tab: { id: string; label: string; icon: any }) => (
                        <button
                          key={tab.id}
                          onClick={() => handleStatusTabChange(tab.id)}
                          className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                    ${
                                      statusTab === tab.id
                                        ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-sm ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                    }
                                `}
                        >
                          <tab.icon
                            className={`w-4 h-4 ${statusTab === tab.id ? "text-primary-500" : "opacity-70"}`}
                          />
                          {tab.label}
                        </button>
                      ),
                    )}
                  </div>
                )}

                {/* Content List Component */}
                <ContentList
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
                  onEdit={openEditModal}
                  onDelete={handleDeleteItemClick}
                  onViewDetails={openViewDetailsModal}
                  onPublish={openPublishModal}
                  onEditRequest={handleEditRequest}
                  connectedAccounts={connectedAccounts}
                  expandedCampaigns={expandedCampaigns}
                  toggleExpand={toggleExpand}
                  permissions={permissions}
                  onPerPageChange={handlePerPageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalManager onRefresh={handleRefreshWrapped} />

      {/* Delete Confirmation Modal */}
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

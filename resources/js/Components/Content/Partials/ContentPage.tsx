import ExcelImporter from "@/Components/Content/ExcelImporter";
import LogsList from "@/Components/Content/Logs/LogsList";
import ModalManager from "@/Components/Content/ModalManager";
import ModalFooter from "@/Components/Content/modals/common/ModalFooter";
import ModalHeader from "@/Components/Content/modals/common/ModalHeader";
import SocialMediaAccounts from "@/Components/Content/socialAccount/SocialMediaAccounts";
import Dropdown from "@/Components/common/ui/Dropdown";
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
  Shield,
  Target,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";

import ApprovalHistory from "@/Components/Content/ApprovalHistory";
import ApprovalList from "@/Components/Content/ApprovalList";
import ApprovalStats from "@/Components/Content/ApprovalStats";
import ContentList from "@/Components/Content/ContentList";
import ModernCalendar from "@/Components/Content/Partials/ModernCalendar";
import Button from "@/Components/common/Modern/Button";
import TabNavigation from "@/Components/common/TabNavigation";

import { useCanApprove } from "@/Hooks/approval/useCanApprove";
import {
  ContentTab,
  usePublications,
} from "@/Hooks/publication/usePublications";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { useShallow } from "zustand/react/shallow";

export default function ManageContentPage() {
  const { auth } = usePage<any>().props;
  const permissions = auth.current_workspace?.permissions || [];
  const planId =
    auth.current_workspace?.subscription?.plan?.toLowerCase() ||
    auth.current_workspace?.plan?.toLowerCase() ||
    "demo";

  // Check if user can approve content (admin permission OR workflow assignment)
  const { canApprove, reason: approvalReason } = useCanApprove(auth.current_workspace?.id);

  const {
    t,
    handleFilterChange,
    handleSingleFilterChange,
    handleResetFilters,
    handlePageChange,
    handlePerPageChange,
    handleRefresh,
    handleDeleteItem,
    handleDuplicateItem,
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
  const deletePublicationAction = usePublicationStore(
    (s) => s.deletePublication,
  );
  const deleteCampaignAction = useCampaignStore((s) => s.deleteCampaign);

  const {
    activeTab,
    setActiveTab,
    tabOrder,
    setTabOrder,
    showFilters,
    setShowFilters,
    openAddModal,
    openEditModal,
    openPublishModal,
    openViewDetailsModal,
  } = useManageContentUIStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      tabOrder: s.tabOrder,
      setTabOrder: s.setTabOrder,
      showFilters: s.showFilters,
      setShowFilters: s.setShowFilters,
      openAddModal: s.openAddModal,
      openEditModal: s.openEditModal,
      openPublishModal: s.openPublishModal,
      openViewDetailsModal: s.openViewDetailsModal,
    })),
  );

  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(() => {
    const saved = localStorage.getItem(`contentPage_search_${activeTab}`);
    return saved || "";
  });

  useEffect(() => {
    localStorage.setItem(`contentPage_search_${activeTab}`, search);
    const timer = setTimeout(() => {
      handleFilterChange({ ...filters, search: search || undefined });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeTab]);

  const handleTabChange = useCallback(
    (tab: ContentTab) => {
      startTransition(() => {
        setActiveTab(tab);
        const savedSearch = localStorage.getItem(`contentPage_search_${tab}`);
        setSearch(savedSearch || "");
        const savedFilters = localStorage.getItem(`contentPage_filters_${tab}`);
        if (savedFilters) {
          handleFilterChange(JSON.parse(savedFilters));
        } else {
          handleFilterChange({});
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setActiveTab],
  );

  // Wrapper para TabNavigation que acepta string y lo convierte a ContentTab
  const handleTabChangeWrapper = useCallback(
    (tab: string) => {
      handleTabChange(tab as ContentTab);
    },
    [handleTabChange],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as ContentTab;
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

  // Listen for real-time publication status updates
  useEffect(() => {
    if (!auth.user?.id || !window.Echo) {
      return;
    }

    const channel = window.Echo.private(`users.${auth.user.id}`);

    const handleStatusUpdate = () => {
      // Refresh the current list when any publication status changes
      handleRefresh();
    };

    channel.listen(".PublicationStatusUpdated", handleStatusUpdate);

    return () => {
      channel.stopListening(".PublicationStatusUpdated", handleStatusUpdate);
    };
  }, [auth.user?.id, handleRefresh]);

  // Refresh data when workspace changes
  useEffect(() => {
    const workspaceId = auth?.user?.current_workspace_id;
    if (workspaceId) {
      handleRefresh();
    }
  }, [auth?.user?.current_workspace_id]);

  const [approvalTab, setApprovalTab] = useState("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id: number | null;
  }>({ isOpen: false, id: null });

  const [excelImporter, setExcelImporter] = useState<{
    isOpen: boolean;
    type: 'publications' | 'campaigns';
  }>({ isOpen: false, type: 'publications' });

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

  const pendingApprovals = useMemo(
    () => publications.filter((p) => p.status === "pending_review").length,
    [publications]
  );

  const tabsConfig = useMemo(
    () => [
      {
        id: "publications",
        label: t("manageContent.tabs.publications"),
        icon: Folder,
      },
      {
        id: "campaigns",
        label: t("manageContent.tabs.campaigns"),
        icon: Target,
      },
      {
        id: "calendar",
        label: t("manageContent.tabs.calendar"),
        icon: CalendarIcon,
      },
      {
        id: "logs",
        label: t("manageContent.tabs.logs"),
        icon: FileText,
      },
      {
        id: "approvals",
        label: t("manageContent.tabs.approvals"),
        icon: CheckCircle,
        badge: pendingApprovals,
        hidden: !canApprove, // Show if user can approve (admin OR workflow assignment)
      },
    ],
    [t, pendingApprovals, canApprove]
  );

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4  min-w-0">
          <div className="min-w-0 flex-1">
              <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900 dark:text-white truncate tracking-tight">
                {t("manageContent.title")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs sm:text-base lg:text-lg truncate">
                {t("manageContent.subtitle")}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              {permissions.includes("manage-content") && (
                <>
                  {/* <Dropdown>
                    <Dropdown.Trigger>
                      <Button
                        id="import-excel"
                        variant="ghost"
                        buttonStyle="outline"
                        size="md"
                        icon={FileSpreadsheet}
                        className="gap-2 uppercase tracking-wider font-bold text-xs"
                      >
                        {t("manageContent.importExcel") || "IMPORTAR EXCEL"}
                      </Button>
                    </Dropdown.Trigger>
                    <Dropdown.Content
                      align="right"
                      width="auto"
                      contentClasses="py-1 bg-white/95 dark:bg-neutral-800 shadow-xl rounded-lg min-w-[220px]"
                    >
                      <div className="p-1">
                        <Button
                          onClick={() => setExcelImporter({ isOpen: true, type: 'publications' })}
                          variant="ghost"
                          buttonStyle="outline"
                          size="md"
                          icon={FileText}
                          fullWidth
                          className="border-none"
                        >
                          {t("manageContent.tabs.publications").toUpperCase()}
                        </Button>
                        <div className="border-t border-gray-100 dark:border-neutral-700/50" />
                        <Button
                          onClick={() => setExcelImporter({ isOpen: true, type: 'campaigns' })}
                          variant="ghost"
                          buttonStyle="outline"
                          size="md"
                          icon={Target}
                          fullWidth
                          className="border-none"
                        >
                          {t("manageContent.tabs.campaigns").toUpperCase()}
                        </Button>
                      </div>
                    </Dropdown.Content>
                  </Dropdown> */}

                  <Dropdown>
                    <Dropdown.Trigger>
                      <Button
                        id="create-publication"
                        variant="primary"
                        size="md"
                        icon={Plus}
                        className="gap-2 uppercase tracking-wider font-bold text-xs backdrop-3xl"
                      >
                        {t("manageContent.createNew").toUpperCase()}
                      </Button>
                    </Dropdown.Trigger>
                    <Dropdown.Content
                      align="right"
                      width="auto"
                      contentClasses="py-1 bg-white/95 dark:bg-neutral-800 shadow-xl rounded-lg min-w-[220px]"
                    >
                      <div className="p-1">
                        <Button
                          onClick={() => openAddModal("publication")}
                          variant="ghost"
                          buttonStyle="outline"
                          size="md"
                          icon={FileText}
                          fullWidth
                          className="border-none"
                        >
                          {t("manageContent.tabs.publications").toUpperCase()}
                        </Button>
                        <div className="border-t border-gray-100 dark:border-neutral-700/50" />
                        <Button
                          onClick={() => openAddModal("campaign")}
                          variant="ghost"
                          buttonStyle="outline"
                          size="md"
                          icon={Target}
                          fullWidth
                          className="border-none"
                        >
                          {t("manageContent.tabs.campaigns").toUpperCase()}
                        </Button>
                      </div>
                    </Dropdown.Content>
                  </Dropdown>
                </>
              )}
            </div>
        </div>
      }>
      <Head title={t("manageContent.title")} />

      <div className="w-full max-w-full overflow-x-hidden min-w-0 bg-gray-50/30 dark:bg-neutral-900/10 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8 min-w-0">

          <div className="mb-8">
            <SocialMediaAccounts />
          </div>

          <div className="mb-8">
            <TabNavigation
              tabs={tabsConfig}
              activeTab={activeTab}
              onTabChange={handleTabChangeWrapper}
              tabOrder={tabOrder}
              onTabOrderChange={setTabOrder}
              variant="draggable"
            />
          </div>

          <div className="min-h-[500px]">
            {activeTab === "calendar" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ModernCalendar onEventClick={handleEventClick} />
              </div>
            )}

            {activeTab === "approvals" && (
              <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                {planId !== "enterprise" && (
                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-full shrink-0">
                        <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary-900 dark:text-primary-300">
                          {t("approvals.locked.title") ||
                            "Flujos de aprobación multi-nivel"}
                        </p>
                        <p className="text-xs text-primary-700 dark:text-primary-400 mt-1 leading-relaxed max-w-2xl">
                          {t("approvals.locked.description") ||
                            "Tu plan actual permite aprobaciones de un nivel. Mejora tu plan para crear flujos de aprobación avanzados y multi-nivel con responsables jerárquicos."}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      buttonStyle="solid"
                      onClick={() => (window.location.href = route("pricing"))}
                      className="shrink-0 whitespace-nowrap shadow-md shadow-primary-500/20"
                    >
                      {t("common.upgradePlan") || "Mejorar Plan"}
                    </Button>
                  </div>
                )}
                <ApprovalStats refreshTrigger={refreshTrigger} />

                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                  <div className="border-b border-gray-200 dark:border-neutral-700 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50/50 dark:bg-neutral-800/50">
                    <div className="flex bg-gray-200/50 dark:bg-neutral-700/50 p-1 rounded-lg w-fit">
                      <Button
                        onClick={() => setApprovalTab("pending")}
                        variant="ghost"
                        buttonStyle="solid"
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all border-0 shadow-none hover:bg-transparent ${
                          approvalTab === "pending"
                            ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {t("approvals.tabs.pending").toUpperCase()}
                      </Button>
                      <Button
                        onClick={() => setApprovalTab("history")}
                        variant="ghost"
                        buttonStyle="solid"
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all border-0 shadow-none hover:bg-transparent ${
                          approvalTab === "history"
                            ? "bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {t("approvals.tabs.history").toUpperCase()}
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
                  showFilters={showFilters[activeTab] ?? false}
                  onToggleFilters={(show) => setShowFilters(activeTab, show)}
                />
              </div>
            )}

            {(activeTab === "publications" || activeTab === "campaigns") && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ContentList
                  title={
                    activeTab === "publications"
                      ? t("manageContent.tabs.publications")
                      : t("manageContent.tabs.campaigns")
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
                  onDuplicate={handleDuplicateItem}
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
                  showFilters={showFilters[activeTab] ?? true}
                  onToggleFilters={(show) => setShowFilters(activeTab, show)}
                  filters={filters}
                  onFilterChange={handleSingleFilterChange}
                  onResetFilters={handleResetFilters}
                  search={search}
                  onSearchChange={setSearch}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalManager onRefresh={handleRefreshWrapped} />

      <ExcelImporter
        type={excelImporter.type}
        isOpen={excelImporter.isOpen}
        onClose={() => setExcelImporter({ ...excelImporter, isOpen: false })}
        onSuccess={handleRefreshWrapped}
        t={t}
      />

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
          submitText={t("common.delete").toUpperCase() || "ELIMINAR"}
          cancelText={t("common.cancel").toUpperCase() || "CANCELAR"}
          submitVariant="danger"
          submitIcon={<Trash2 className="w-4 h-4" />}
          cancelStyle="outline"
        />
      </Modal>
    </AuthenticatedLayout>
  );
}

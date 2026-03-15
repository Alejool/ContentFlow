import ExcelImporter from "@/Components/Content/ExcelImporter";
import LogsList from "@/Components/Content/Logs/LogsList";
import ModalManager from "@/Components/Content/ModalManager";
import ModalFooter from "@/Components/Content/modals/common/ModalFooter";
import ModalHeader from "@/Components/Content/modals/common/ModalHeader";
import SocialMediaAccounts from "@/Components/Content/socialAccount/SocialMediaAccounts";
import Modal from "@/Components/common/ui/Modal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Head, usePage } from "@inertiajs/react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  FileText,
  Folder,
  History as HistoryIcon,
  Plus,
  Shield,
  Target,
  Trash2,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";

import ApprovalHistory from "@/Components/Content/ApprovalHistory";
import ApprovalList from "@/Components/Content/ApprovalList";
import ApprovalStats from "@/Components/Content/ApprovalStats";
import ContentList from "@/Components/Content/ContentList";
import ModernCalendar from "@/Components/Content/Partials/ModernCalendar";
import Button from "@/Components/common/Modern/Button";
import TabNavigation from "@/Components/common/TabNavigation";

import { useCanApprove } from "@/Hooks/approval/useCanApprove";
import { usePendingApprovals } from "@/Hooks/approval/usePendingApprovals";
import { ContentTab, usePublications } from "@/Hooks/publication/usePublications";
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

  const fetchPublicationById = usePublicationStore((s) => s.fetchPublicationById);
  const deletePublicationAction = usePublicationStore((s) => s.deletePublication);
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
      handleSingleFilterChange("search", search || undefined);
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
    if (tab && ["publications", "campaigns", "calendar", "logs", "approvals"].includes(tab)) {
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

    // CRITICAL: Listen on workspace channel for approval level advancement
    // This is a SPECIFIC event for when a publication moves to the next approval level
    const workspaceChannel = window.Echo.private(`workspace.${auth.user.current_workspace_id}`);

    const handleApprovalLevelAdvanced = (event: any) => {
      console.log("[ContentPage] Approval level advanced:", event);
      console.log(
        `  Publication ${event.publication_id} moved from level ${event.from_level.number} to ${event.to_level.number}`,
      );

      // Refresh to show updated publications
      // - Users in the OLD level will see it disappear
      // - Users in the NEW level will see it appear
      handleRefresh();
    };

    workspaceChannel.listen(".approval.level.advanced", handleApprovalLevelAdvanced);

    return () => {
      channel.stopListening(".PublicationStatusUpdated", handleStatusUpdate);
      workspaceChannel.stopListening(".approval.level.advanced", handleApprovalLevelAdvanced);
    };
  }, [auth.user?.id, auth.user?.current_workspace_id, handleRefresh]);

  // Refresh data when workspace changes
  useEffect(() => {
    const workspaceId = auth?.user?.current_workspace_id;
    if (workspaceId) {
      handleRefresh();
    }
  }, [auth?.user?.current_workspace_id]);

  // CRITICAL: Refresh approvals when switching to approvals tab
  useEffect(() => {
    if (activeTab === "approvals") {
      console.log("[ContentPage] Switched to approvals tab, refreshing...");
      setRefreshTrigger((prev) => prev + 1);
    }
  }, [activeTab]);

  // Listen for publication submitted for approval event
  useEffect(() => {
    const handleSubmittedForApproval = (event: CustomEvent) => {
      console.log("[ContentPage] Publication submitted for approval:", event.detail);
      // Refresh the publications list to reflect the new status
      handleRefresh();
      // CRITICAL: Also refresh approvals list to show the new pending request
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener(
      "publication-submitted-for-approval",
      handleSubmittedForApproval as EventListener,
    );

    return () => {
      window.removeEventListener(
        "publication-submitted-for-approval",
        handleSubmittedForApproval as EventListener,
      );
    };
  }, [handleRefresh]);

  const [approvalTab, setApprovalTab] = useState("pending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    requests: pendingApprovalRequests,
    isLoading: isApprovalsLoading,
    refresh: refreshApprovals,
  } = usePendingApprovals(refreshTrigger);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id: number | null;
  }>({ isOpen: false, id: null });

  const [excelImporter, setExcelImporter] = useState<{
    isOpen: boolean;
    type: "publications" | "campaigns";
  }>({ isOpen: false, type: "publications" });

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
        toast.success(t("common.deleteSuccess") || "Campaign deleted successfully");
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
      toast.success(t("common.deleteSuccess") || "Elemento eliminado correctamente");
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

  const pendingApprovals = pendingApprovalRequests.length;

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
        enabled: canApprove,
      },
    ],
    [t, pendingApprovals, canApprove],
  );

  return (
    <AuthenticatedLayout
      header={
        <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-gray-900 dark:text-white lg:text-2xl">
              {t("manageContent.title")}
            </h1>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400 sm:text-base lg:text-lg">
              {t("manageContent.subtitle")}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            {permissions.includes("manage-content") && (
              <>
                <Menu as="div" className="relative">
                  <MenuButton as={Fragment}>
                    <Button
                      id="create-publication"
                      variant="primary"
                      size="md"
                      icon={Plus}
                      className="gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                      {t("manageContent.createNew").toUpperCase()}
                    </Button>
                  </MenuButton>
                  <MenuItems
                    transition
                    className="ring-black/8 absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-lg bg-white shadow-2xl ring-1 transition focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in dark:bg-neutral-900 dark:ring-white/10"
                  >
                    <div className="px-4 pb-2 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500">
                        {t("manageContent.createNew")}
                      </p>
                    </div>

                    <div className="space-y-0.5 px-2 pb-2">
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={() => openAddModal("publication")}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                              focus
                                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-neutral-800"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                focus
                                  ? "bg-primary-100 dark:bg-primary-900/50"
                                  : "bg-gray-100 dark:bg-neutral-800"
                              }`}
                            >
                              <FileText className="h-4 w-4" />
                            </span>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate">
                                {t("manageContent.tabs.publications")}
                              </span>
                              <span className="truncate text-[11px] font-normal text-gray-400 dark:text-neutral-500">
                                {t("manageContent.createPublication")}
                              </span>
                            </div>
                          </button>
                        )}
                      </MenuItem>

                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={() => openAddModal("campaign")}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                              focus
                                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-neutral-800"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                focus
                                  ? "bg-primary-100 dark:bg-primary-900/50"
                                  : "bg-gray-100 dark:bg-neutral-800"
                              }`}
                            >
                              <Target className="h-4 w-4" />
                            </span>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate">{t("manageContent.tabs.campaigns")}</span>
                              <span className="truncate text-[11px] font-normal text-gray-400 dark:text-neutral-500">
                                {t("manageContent.createCampaign")}
                              </span>
                            </div>
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </>
            )}
          </div>
        </div>
      }
    >
      <Head title={t("manageContent.title")} />

      <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-gray-50/30 dark:bg-neutral-900/10">
        <div className="mx-auto min-w-0 max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
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
              <div className="animate-in fade-in zoom-in space-y-6 duration-300">
                {planId !== "enterprise" && (
                  <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-primary-200 bg-primary-50 p-4 shadow-sm dark:border-primary-800 dark:bg-primary-900/20 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 rounded-full bg-primary-100 p-2 dark:bg-primary-900/40">
                        <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary-900 dark:text-primary-300">
                          {t("approvals.locked.title") || "Flujos de aprobación multi-nivel"}
                        </p>
                        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-primary-700 dark:text-primary-400">
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

                {/* Approval Tabs */}
                <div className="mb-6">
                  <TabNavigation
                    tabs={[
                      {
                        id: "pending",
                        label: t("approvals.tabs.pending"),
                        icon: Clock,
                        badge: pendingApprovals > 0 ? pendingApprovals : undefined,
                      },
                      {
                        id: "history",
                        label: t("approvals.tabs.history"),
                        icon: HistoryIcon,
                      },
                    ]}
                    activeTab={approvalTab}
                    onTabChange={setApprovalTab}
                    variant="horizontal"
                  />
                </div>

                {/* Approval Content */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                  <div className="p-0">
                    {approvalTab === "pending" ? (
                      <ApprovalList
                        requests={pendingApprovalRequests}
                        isLoading={isApprovalsLoading}
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
                  items={activeTab === "publications" ? publications : campaigns}
                  isLoading={activeTab === "publications" ? isPubLoading : isCampLoading}
                  mode={activeTab === "publications" ? "publications" : "campaigns"}
                  pagination={activeTab === "publications" ? pubPagination : campPagination}
                  onPageChange={handlePageChange}
                  onEdit={(item) => useManageContentUIStore.getState().openEditModal(item)}
                  onDelete={handleDeleteItemClick}
                  onDuplicate={handleDuplicateItem}
                  onViewDetails={openViewDetailsModal}
                  onPublish={(item) => useManageContentUIStore.getState().openPublishModal(item)}
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
          submitIcon={<Trash2 className="h-4 w-4" />}
          cancelStyle="outline"
        />
      </Modal>
    </AuthenticatedLayout>
  );
}

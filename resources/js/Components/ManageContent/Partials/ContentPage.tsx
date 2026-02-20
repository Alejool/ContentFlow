import LogsList from "@/Components/ManageContent/Logs/LogsList";
import ModalManager from "@/Components/ManageContent/ModalManager";
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import SocialMediaAccounts from "@/Components/ManageContent/socialAccount/SocialMediaAccounts";
import Dropdown from "@/Components/common/ui/Dropdown";
import Modal from "@/Components/common/ui/Modal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Head, usePage } from "@inertiajs/react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  FileText,
  Folder,
  GripHorizontal,
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

import {
  ContentTab,
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
      openAddModal: s.openAddModal,
      openEditModal: s.openEditModal,
      openPublishModal: s.openPublishModal,
      openViewDetailsModal: s.openViewDetailsModal,
    })),
  );

  const [isTabPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(true);
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
    [setActiveTab, handleFilterChange],
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

    const handleStatusUpdate = (event: any) => {
      // Refresh the current list when any publication status changes
      handleRefresh();
    };

    channel.listen(".PublicationStatusUpdated", handleStatusUpdate);

    return () => {
      channel.stopListening(".PublicationStatusUpdated", handleStatusUpdate);
    };
  }, [auth.user?.id, handleRefresh]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tabOrder.indexOf(active.id as string);
      const newIndex = tabOrder.indexOf(over.id as string);
      setTabOrder(arrayMove(tabOrder, oldIndex, newIndex));
    }
  };

  const getTabIcon = (id: string, active: boolean) => {
    const className = `w-4 h-4 ${active ? "text-white" : "opacity-70"}`;
    switch (id) {
      case "publications":
        return <Folder className={className} />;
      case "campaigns":
        return <Target className={className} />;
      case "calendar":
        return <CalendarIcon className={className} />;
      case "logs":
        return <FileText className={className} />;
      case "approvals":
        return <CheckCircle className={className} />;
      default:
        return null;
    }
  };

  const SortableTab = ({ id, label, hasBadge, badgeCount }: any) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : "auto",
      opacity: isDragging ? 0.5 : 1,
    };

    const isActive = activeTab === id;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-1 group/tab"
      >
        <Button
          onClick={() => handleTabChange(id)}
          variant={isActive ? "primary" : "ghost"}
          buttonStyle={isActive ? "solid" : "ghost"}
          size="lg"
          {...attributes}
          {...listeners}
          className={`flex items-center justify-center p-0 rounded-lg text-sm font-bold transition-all duration-200 select-none border-0 ${
            isActive
              ? "bg-primary-600 text-white shadow-md shadow-primary-500/20 ring-1 ring-primary-500/50"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <GripHorizontal
              className={`w-3 h-3 opacity-0 group-hover/tab:opacity-40 transition-opacity cursor-grab active:cursor-grabbing mr-[-4px] ${isActive ? "text-white" : ""}`}
            />
            {getTabIcon(id, isActive)}
            <span>{label}</span>
            {hasBadge && badgeCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                {badgeCount}
              </span>
            )}
          </div>
        </Button>
      </div>
    );
  };

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
              {permissions.includes("manage-content") && (
                <Dropdown>
                  <Dropdown.Trigger>
                    <Button
                      id="create-publication"
                      variant="primary"
                      size="lg"
                      icon={Plus}
                      className="gap-2 uppercase tracking-wider font-bold text-xs"
                    >
                      {t("manageContent.createNew").toUpperCase()}
                    </Button>
                  </Dropdown.Trigger>
                  <Dropdown.Content
                    align="right"
                    width="auto"
                    contentClasses="py-1 bg-white dark:bg-neutral-800 shadow-xl rounded-lg min-w-[220px]"
                  >
                    <div className="p-1">
                      <Button
                        onClick={() => openAddModal("publication")}
                        variant="ghost"
                        buttonStyle="ghost"
                        size="lg"
                        icon={FileText}
                        iconPosition="left"
                        fullWidth
                        className="justify-start px-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-700/50 rounded-lg border-0 transition-all duration-200 uppercase tracking-wider font-bold text-xs"
                      >
                        {t("manageContent.tabs.publications").toUpperCase()}
                      </Button>
                      <div className="mx-2 my-1 border-t border-gray-100 dark:border-neutral-700/50" />
                      <Button
                        onClick={() => openAddModal("campaign")}
                        variant="ghost"
                        buttonStyle="ghost"
                        size="lg"
                        icon={Target}
                        iconPosition="left"
                        fullWidth
                        className="justify-start px-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-700/50 rounded-lg border-0 transition-all duration-200 uppercase tracking-wider font-bold text-xs"
                      >
                        {t("manageContent.tabs.campaigns").toUpperCase()}
                      </Button>
                    </div>
                  </Dropdown.Content>
                </Dropdown>
              )}
            </div>
          </div>

          <div className="mb-8">
            <SocialMediaAccounts />
          </div>

          <div className="mb-8">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="inline-flex items-center p-2 rounded-lg bg-white dark:bg-neutral-800 backdrop-blur-sm gap-1 overflow-x-auto max-w-full shadow-sm">
                <SortableContext
                  items={tabOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {tabOrder.map((id) => {
                    if (id === "approvals" && !permissions.includes("approve"))
                      return null;

                    const label = t(`manageContent.tabs.${id}`);
                    const hasBadge = id === "approvals";
                    const badgeCount =
                      id === "approvals"
                        ? publications.filter(
                            (p) => p.status === "pending_review",
                          ).length
                        : 0;

                    return (
                      <SortableTab
                        key={id}
                        id={id}
                        label={label}
                        hasBadge={hasBadge}
                        badgeCount={badgeCount}
                      />
                    );
                  })}
                </SortableContext>
              </div>
            </DndContext>
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
                  onResetFilters={handleResetFilters}
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
                  showFilters={showFilters}
                  onToggleFilters={setShowFilters}
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

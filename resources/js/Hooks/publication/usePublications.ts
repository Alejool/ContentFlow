import { useRealtime } from "@/Hooks/publication/useRealtime";
import { useConfirm } from "@/Hooks/useConfirm";
import { useSocialMediaAuth } from "@/Hooks/useSocialMediaAuth";
import { ToastService } from "@/Services/ToastService";
import { useCampaignStore } from "@/stores/campaignStore";
import { useLogStore } from "@/stores/logStore";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { PageProps } from "@/types";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";

export type ContentTab =
  | "publications"
  | "campaigns"
  | "logs"
  | "calendar"
  | "approvals";

export const usePublications = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { props } = usePage<PageProps>();
  const user = props.auth.user;

  const {
    publications,
    pubPagination,
    isPubLoading,
    fetchPublications,
    deletePublicationAction,
    duplicatePublicationAction,
  } = usePublicationStore(
    useShallow((s) => ({
      publications: s.publications,
      pubPagination: s.pagination,
      isPubLoading: s.isLoading,
      fetchPublications: s.fetchPublications,
      deletePublicationAction: s.deletePublication,
      duplicatePublicationAction: s.duplicatePublication,
    })),
  );

  const {
    campaigns,
    campPagination,
    isCampLoading,
    fetchCampaigns,
    deleteCampaignAction,
    duplicateCampaignAction,
  } = useCampaignStore(
    useShallow((s) => ({
      campaigns: s.campaigns,
      campPagination: s.pagination,
      isCampLoading: s.isLoading,
      fetchCampaigns: s.fetchCampaigns,
      deleteCampaignAction: s.deleteCampaign,
      duplicateCampaignAction: s.duplicateCampaign,
    })),
  );

  const { logs, logPagination, isLogsLoading, fetchLogs } = useLogStore(
    useShallow((s) => ({
      logs: s.logs,
      logPagination: s.pagination,
      isLogsLoading: s.isLoading,
      fetchLogs: s.fetchLogs,
    })),
  );

  const { fetchAccounts, accounts: connectedAccounts } = useSocialMediaAuth();

  // Realtime updates
  useRealtime(user?.id);

  // Shared UI store for modals and tabs with shallow comparison to prevent unnecessary re-renders
  const {
    activeTab,
    setActiveTab,
    selectedItem,
    setSelectedItem,
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
  } = useManageContentUIStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      selectedItem: s.selectedItem,
      setSelectedItem: s.setSelectedItem,
      isAddModalOpen: s.isAddModalOpen,
      isEditModalOpen: s.isEditModalOpen,
      isPublishModalOpen: s.isPublishModalOpen,
      isViewDetailsModalOpen: s.isViewDetailsModalOpen,
      openAddModal: s.openAddModal,
      closeAddModal: s.closeAddModal,
      openEditModal: s.openEditModal,
      closeEditModal: s.closeEditModal,
      openPublishModal: s.openPublishModal,
      closePublishModal: s.closePublishModal,
      openViewDetailsModal: s.openViewDetailsModal,
      closeViewDetailsModal: s.closeViewDetailsModal,
    })),
  );

  const [filters, setFilters] = useState<any>(() => {
    const saved = localStorage.getItem(`contentPage_filters_${activeTab}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use a ref to prevent loops from effect triggers
  const lastFetchRef = useRef<string>("");

  const fetchData = useCallback(
    async (page = 1) => {
      const fetchKey = `${activeTab}-${JSON.stringify(filters)}-${page}`;
      // Prevent duplicate fetches in the same render cycle or loop
      if (
        lastFetchRef.current === fetchKey &&
        (isPubLoading || isCampLoading || isLogsLoading)
      ) {
        return;
      }
      lastFetchRef.current = fetchKey;

      switch (activeTab) {
        case "publications":
          await fetchPublications({ ...filters, per_page: itemsPerPage }, page);
          break;
        case "campaigns":
          await fetchCampaigns({ ...filters, per_page: itemsPerPage }, page);
          break;
        case "logs":
          await fetchLogs({ ...filters, per_page: itemsPerPage }, page);
          break;
        case "approvals":
          await fetchPublications({ ...filters, per_page: itemsPerPage }, page);
          break;
      }
    },
    [
      activeTab,
      filters,
      itemsPerPage,
      fetchPublications,
      fetchCampaigns,
      fetchLogs,
      isPubLoading,
      isCampLoading,
      isLogsLoading,
    ],
  );

  const handlePerPageChange = useCallback((val: number) => {
    setItemsPerPage(val);
    // Scroll to top to prevent blank spaces in virtualized table
    window.scrollTo({ top: 0, behavior: "smooth" });
    // fetchData will be called by useEffect when itemsPerPage changes
  }, []);

  useEffect(() => {
    fetchData(1); // Always reset to page 1 when filters or perPage change
  }, [
    activeTab,
    filters,
    itemsPerPage,
    (props.auth.user as any)?.current_workspace_id,
  ]); // Run when tab, filters, perPage or workspace change

  useEffect(() => {
    fetchAccounts();
  }, []); // Only fetch accounts once on mount

  const items = (() => {
    switch (activeTab) {
      case "publications":
        return publications;
      case "campaigns":
        return campaigns;
      case "logs":
        return logs;
      default:
        return [];
    }
  })();

  const pagination = (() => {
    switch (activeTab) {
      case "publications":
        return pubPagination;
      case "campaigns":
        return campPagination;
      case "logs":
        return logPagination;
      default:
        return { current_page: 1, last_page: 1, total: 0, per_page: 10 };
    }
  })();

  const isLoading = isPubLoading || isCampLoading || isLogsLoading;

  const handlePageChange = useCallback(
    (page: number) => {
      fetchData(page);
    },
    [fetchData],
  );

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    localStorage.setItem(
      `contentPage_filters_${activeTab}`,
      JSON.stringify(newFilters),
    );
  }, [activeTab]);

  const handleSingleFilterChange = useCallback(
    (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value };
      // Si el valor es undefined o null, remover la key
      // Pero si es un array vacío, mantenerlo (significa "sin filtro de plataforma")
      if (value === undefined || value === null) {
        delete newFilters[key];
      }
      setFilters(newFilters);
      localStorage.setItem(
        `contentPage_filters_${activeTab}`,
        JSON.stringify(newFilters),
      );
    },
    [filters, activeTab],
  );

  const handleResetFilters = useCallback(() => {
    setFilters({});
    localStorage.removeItem(`contentPage_filters_${activeTab}`);
  }, [activeTab]);

  const handleRefresh = useCallback(async () => {
    await fetchData(pagination.current_page);
    // If there is a selected item, refresh it from the new publications list
    if (selectedItem && activeTab === "approvals") {
      const updated = usePublicationStore
        .getState()
        .publications.find((p) => p.id === selectedItem.id);
      if (updated) {
        setSelectedItem(updated);
      }
    }
  }, [
    fetchData,
    pagination.current_page,
    selectedItem,
    activeTab,
    setSelectedItem,
  ]);

  const handleDeleteItem = useCallback(
    async (id: number) => {
      const isCampaign = activeTab === "campaigns";
      const confirmed = await confirm({
        title: isCampaign ? "Campaign" : "Publication",
        message: isCampaign
          ? "Are you sure you want to delete this campaign? All associated publications will be unlinked"
          : "Are you sure you want to delete this publication?",
        confirmText: "Delete",
        type: "danger",
      });

      if (confirmed) {
        let success = false;
        if (isCampaign) {
          success = await deleteCampaignAction(id);
        } else {
          success = await deletePublicationAction(id);
        }

        if (success) {
          fetchData(pagination.current_page);
        }
      }
    },
    [
      activeTab,
      confirm,
      deleteCampaignAction,
      deletePublicationAction,
      fetchData,
      pagination.current_page,
    ],
  );

  const handleDuplicateItem = useCallback(
    async (id: number) => {
      const isCampaign = activeTab === "campaigns";
      let success = false;
      if (isCampaign) {
        success = await duplicateCampaignAction(id);
      } else {
        success = await duplicatePublicationAction(id);
      }

      if (success) {
        ToastService.success(
          t(
            isCampaign
              ? "campaigns.messages.duplicateSuccess"
              : "publications.messages.duplicateSuccess",
          ),
        );
        fetchData(pagination.current_page);
      } else {
        ToastService.error(
          t(
            isCampaign
              ? "campaigns.messages.error"
              : "publications.messages.error",
          ),
        );
      }
    },
    [
      activeTab,
      duplicateCampaignAction,
      duplicatePublicationAction,
      fetchData,
      pagination.current_page,
    ],
  );

  const handleEditRequest = useCallback(
    (item: Publication) => {
      openEditModal(item);
    },
    [openEditModal],
  );

  const stableOpenAddModal = useCallback(() => openAddModal(), [openAddModal]);
  const stableCloseAddModal = useCallback(
    () => closeAddModal(),
    [closeAddModal],
  );
  const stableOpenEditModal = useCallback(
    (item: any) => openEditModal(item),
    [openEditModal],
  );
  const stableCloseEditModal = useCallback(
    () => closeEditModal(),
    [closeEditModal],
  );
  const stableOpenPublishModal = useCallback(
    (item: any) => openPublishModal(item),
    [openPublishModal],
  );
  const stableClosePublishModal = useCallback(
    () => closePublishModal(),
    [closePublishModal],
  );
  const stableOpenViewDetailsModal = useCallback(
    (item: any) => openViewDetailsModal(item),
    [openViewDetailsModal],
  );
  const stableCloseViewDetailsModal = useCallback(
    () => closeViewDetailsModal(),
    [closeViewDetailsModal],
  );

  return useMemo(
    () => ({
      t,
      activeTab,
      setActiveTab,
      filters,
      handleFilterChange,
      handleSingleFilterChange,
      handleResetFilters,
      selectedItem,
      setSelectedItem,
      items,
      pagination,
      isLoading,
      handlePageChange,
      handlePerPageChange,
      handleRefresh,
      isAddModalOpen,
      isEditModalOpen,
      isPublishModalOpen,
      isViewDetailsModalOpen,
      openAddModal: stableOpenAddModal,
      closeAddModal: stableCloseAddModal,
      openEditModal: stableOpenEditModal,
      closeEditModal: stableCloseEditModal,
      openPublishModal: stableOpenPublishModal,
      closePublishModal: stableClosePublishModal,
      openViewDetailsModal: stableOpenViewDetailsModal,
      closeViewDetailsModal: stableCloseViewDetailsModal,
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
    }),
    [
      t,
      activeTab,
      setActiveTab,
      filters,
      handleFilterChange,
      handleSingleFilterChange,
      handleResetFilters,
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
    ],
  );
};

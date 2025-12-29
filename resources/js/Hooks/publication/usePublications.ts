import { useRealtime } from "@/Hooks/publication/useRealtime";
import { useConfirm } from "@/Hooks/useConfirm";
import { useSocialMediaAuth } from "@/Hooks/useSocialMediaAuth";
import { useCampaignStore } from "@/stores/campaignStore";
import { useLogStore } from "@/stores/logStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { PageProps } from "@/types";
import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";

export type ManageContentTab = "publications" | "campaigns" | "logs" | "calendar";

export const usePublications = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { props } = usePage<PageProps>();
  const user = props.auth.user;

  // Store data with useShallow to prevent unnecessary re-renders
  const {
    publications,
    pubPagination,
    isPubLoading,
    fetchPublications,
    deletePublicationAction,
  } = usePublicationStore(
    useShallow((s) => ({
      publications: s.publications,
      pubPagination: s.pagination,
      isPubLoading: s.isLoading,
      fetchPublications: s.fetchPublications,
      deletePublicationAction: s.deletePublication,
    }))
  );

  const {
    campaigns,
    campPagination,
    isCampLoading,
    fetchCampaigns,
    deleteCampaignAction,
  } = useCampaignStore(
    useShallow((s) => ({
      campaigns: s.campaigns,
      campPagination: s.pagination,
      isCampLoading: s.isLoading,
      fetchCampaigns: s.fetchCampaigns,
      deleteCampaignAction: s.deleteCampaign,
    }))
  );

  const { logs, logPagination, isLogsLoading, fetchLogs } = useLogStore(
    useShallow((s) => ({
      logs: s.logs,
      logPagination: s.pagination,
      isLogsLoading: s.isLoading,
      fetchLogs: s.fetchLogs,
    }))
  );

  const { fetchAccounts, accounts: connectedAccounts } = useSocialMediaAuth();

  // Realtime updates
  useRealtime(user?.id);

  // Shared UI store for modals and tabs
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
  } = useManageContentUIStore();

  const [filters, setFilters] = useState<any>({});

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
          await fetchPublications(filters, page);
          break;
        case "campaigns":
          await fetchCampaigns(filters, page);
          break;
        case "logs":
          await fetchLogs(filters, page);
          break;
      }
    },
    [
      activeTab,
      filters,
      fetchPublications,
      fetchCampaigns,
      fetchLogs,
      isPubLoading,
      isCampLoading,
      isLogsLoading,
    ]
  );

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]); // Only run when tab or filters change

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

  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    fetchData(pagination.current_page);
  };

  const handleDeleteItem = async (id: number) => {
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
  };

  const handleEditRequest = (item: Publication) => {
    openEditModal(item);
  };

  return {
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
  };
};

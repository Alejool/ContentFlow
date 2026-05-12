import {
  useCampaignsList,
  useDeleteCampaign,
  useDuplicateCampaign,
} from '@/Hooks/Campaign/useCampaigns';
import {
  useDeletePublication,
  useDuplicatePublication,
  usePublicationsList,
} from '@/Hooks/Publications/usePublicationsList';
import { useRealtime } from '@/Hooks/Publications/useRealtime';
import { useConfirm } from '@/Hooks/common/useConfirm';
import { useLogs } from '@/Hooks/Admin/useLogs';
import { useSocialMediaAuth } from '@/Hooks/ConfigSocialMedia/useSocialMediaAuth';
import { queryKeys } from '@/lib/queryKeys';
import { ToastService } from '@/Services/ToastService';
import { useContentPaginationStore } from '@/stores/contentPaginationStore';
import { useManageContentUIStore } from '@/stores/manageContentUIStore';
import { usePublicationStore } from '@/stores/publicationStore';
import type { PageProps } from '@/types';
import type { Publication } from '@/types/Publication';
import { usePage } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

export type ContentTab = 'publications' | 'campaigns' | 'logs' | 'calendar' | 'approvals';

export const usePublications = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { props } = usePage<PageProps>();
  const user = props.auth.user;
  const queryClient = useQueryClient();

  // Page and itemsPerPage live in a global store so that create/update
  // mutations can call resetToFirstPage() and surface the updated item
  // immediately at the top of the list regardless of which page the user
  // was previously viewing.
  const { page, itemsPerPage, setPage, setItemsPerPage } = useContentPaginationStore(
    useShallow((s) => ({
      page: s.page,
      itemsPerPage: s.itemsPerPage,
      setPage: s.setPage,
      setItemsPerPage: s.setItemsPerPage,
    })),
  );

  const [activeTabState, setActiveTabState] = useState<ContentTab>('publications');
  const [filters, setFilters] = useState<any>(() => {
    const saved = localStorage.getItem(`contentPage_filters_${activeTabState}`);
    return saved ? JSON.parse(saved) : {};
  });

  // TanStack Query hooks — only fetch when the relevant tab is active
  const pubQuery = usePublicationsList(
    { ...filters, per_page: itemsPerPage },
    page,
    activeTabState === 'approvals',
  );
  const campQuery = useCampaignsList({ ...filters, per_page: itemsPerPage }, page);
  const logsQuery = useLogs({ ...filters, per_page: itemsPerPage }, page);

  // Mutations
  const deletePub = useDeletePublication();
  const duplicatePub = useDuplicatePublication();
  const deleteCamp = useDeleteCampaign();
  const duplicateCamp = useDuplicateCampaign();

  const { accounts: connectedAccounts } = useSocialMediaAuth();

  // Realtime updates
  useRealtime(user?.id);

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

  // Derived data per tab
  const publications = pubQuery.data?.data ?? [];
  const campaigns = campQuery.data?.data ?? [];
  const logs = logsQuery.data?.data ?? [];

  const pubPagination = pubQuery.data
    ? {
        current_page: pubQuery.data.current_page,
        last_page: pubQuery.data.last_page,
        total: pubQuery.data.total,
        per_page: pubQuery.data.per_page,
      }
    : { current_page: 1, last_page: 1, total: 0, per_page: itemsPerPage };

  const campPagination = campQuery.data
    ? {
        current_page: campQuery.data.current_page,
        last_page: campQuery.data.last_page,
        total: campQuery.data.total,
        per_page: campQuery.data.per_page,
      }
    : { current_page: 1, last_page: 1, total: 0, per_page: itemsPerPage };

  const logPagination = logsQuery.data
    ? {
        current_page: logsQuery.data.current_page,
        last_page: logsQuery.data.last_page,
        total: logsQuery.data.total,
        per_page: logsQuery.data.per_page,
      }
    : { current_page: 1, last_page: 1, total: 0, per_page: itemsPerPage };

  const items =
    activeTab === 'publications' || activeTab === 'approvals'
      ? publications
      : activeTab === 'campaigns'
        ? campaigns
        : logs;

  const pagination =
    activeTab === 'publications' || activeTab === 'approvals'
      ? pubPagination
      : activeTab === 'campaigns'
        ? campPagination
        : logPagination;

  const isPubLoading = pubQuery.isLoading || pubQuery.isFetching;
  const isCampLoading = campQuery.isLoading || campQuery.isFetching;
  const isLogsLoading = logsQuery.isLoading || logsQuery.isFetching;

  const isLoading =
    activeTab === 'publications' || activeTab === 'approvals'
      ? isPubLoading
      : activeTab === 'campaigns'
        ? isCampLoading
        : isLogsLoading;

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage],
  );

  const handlePerPageChange = useCallback(
    (val: number) => {
      setItemsPerPage(val);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setItemsPerPage],
  );

  const handleFilterChange = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
      setPage(1);
      localStorage.setItem(`contentPage_filters_${activeTab}`, JSON.stringify(newFilters));
    },
    [activeTab, setPage],
  );

  const handleSingleFilterChange = useCallback(
    (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value };
      if (value === undefined || value === null) delete newFilters[key];
      setFilters(newFilters);
      setPage(1);
      localStorage.setItem(`contentPage_filters_${activeTab}`, JSON.stringify(newFilters));
    },
    [filters, activeTab, setPage],
  );

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
    localStorage.removeItem(`contentPage_filters_${activeTab}`);
  }, [activeTab, setPage]);

  const handleRefresh = useCallback(() => {
    if (activeTab === 'publications' || activeTab === 'approvals') {
      usePublicationStore.getState().clearPageData();
      // Invalidate list caches completely so the refetch
      // shows fresh server-ordered data without losing local filters immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.publications.lists() });
      pubQuery.refetch();
    } else if (activeTab === 'campaigns') {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lists() });
      campQuery.refetch();
    } else {
      logsQuery.refetch();
    }
  }, [activeTab, pubQuery, campQuery, logsQuery, queryClient]);

  const handleDeleteItem = useCallback(
    async (id: number) => {
      const isCampaign = activeTab === 'campaigns';
      const confirmed = await confirm({
        title: isCampaign ? 'Campaign' : 'Publication',
        message: isCampaign
          ? 'Are you sure you want to delete this campaign? All associated publications will be unlinked'
          : 'Are you sure you want to delete this publication?',
        confirmText: 'Delete',
        type: 'danger',
      });

      if (confirmed) {
        if (isCampaign) {
          await deleteCamp.mutateAsync(id);
        } else {
          await deletePub.mutateAsync(id);
        }
      }
    },
    [activeTab, confirm, deleteCamp, deletePub],
  );

  const handleDuplicateItem = useCallback(
    async (id: number) => {
      const isCampaign = activeTab === 'campaigns';
      try {
        if (isCampaign) {
          await duplicateCamp.mutateAsync(id);
        } else {
          await duplicatePub.mutateAsync(id);
        }
        ToastService.success(
          t(
            isCampaign
              ? 'campaigns.messages.duplicateSuccess'
              : 'publications.messages.duplicateSuccess',
          ),
        );
      } catch {
        ToastService.error(
          t(isCampaign ? 'campaigns.messages.error' : 'publications.messages.error'),
        );
      }
    },
    [activeTab, duplicateCamp, duplicatePub, t],
  );

  const handleEditRequest = useCallback(
    (item: Publication) => openEditModal(item),
    [openEditModal],
  );

  const stableOpenAddModal = useCallback(() => openAddModal(), [openAddModal]);
  const stableCloseAddModal = useCallback(() => closeAddModal(), [closeAddModal]);
  const stableOpenEditModal = useCallback((item: any) => openEditModal(item), [openEditModal]);
  const stableCloseEditModal = useCallback(() => closeEditModal(), [closeEditModal]);
  const stableOpenPublishModal = useCallback(
    (item: any) => openPublishModal(item),
    [openPublishModal],
  );
  const stableClosePublishModal = useCallback(() => closePublishModal(), [closePublishModal]);
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
      handlePerPageChange,
      handleRefresh,
      isAddModalOpen,
      isEditModalOpen,
      isPublishModalOpen,
      isViewDetailsModalOpen,
      stableOpenAddModal,
      stableCloseAddModal,
      stableOpenEditModal,
      stableCloseEditModal,
      stableOpenPublishModal,
      stableClosePublishModal,
      stableOpenViewDetailsModal,
      stableCloseViewDetailsModal,
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

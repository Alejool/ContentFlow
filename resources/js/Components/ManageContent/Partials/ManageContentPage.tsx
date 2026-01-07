import React, { useState, useCallback, useMemo, useEffect, useTransition } from "react";
import { usePage, Head } from "@inertiajs/react";
import LogsList from "@/Components/ManageContent/Logs/LogsList";
import ModalManager from "@/Components/ManageContent/ModalManager";
import { usePublicationStore } from "@/stores/publicationStore";
import SocialMediaAccounts from "@/Components/ManageContent/socialAccount/SocialMediaAccounts";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Copy, Plus, Folder, Filter, Calendar as CalendarIcon, FileClock, CheckCircle, Edit3, Target, FileText } from "lucide-react";

import { usePublications, ManageContentTab } from "@/Hooks/publication/usePublications";
import WorkspaceInfoBadge from "@/Components/Workspace/WorkspaceInfoBadge";
import ModernCalendar from "@/Components/ManageContent/Partials/ModernCalendar";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { useShallow } from "zustand/react/shallow";
import ContentList from "@/Components/ManageContent/ContentList";
import ApprovalList from "@/Components/ManageContent/ApprovalList";

export default function ManageContentPage() {
  const { auth } = usePage<any>().props;
  const permissions = auth.current_workspace?.permissions || [];

  const {
    t,
    handleFilterChange,
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
    filters,
  } = usePublications();

  const fetchPublicationById = usePublicationStore(s => s.fetchPublicationById);

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

  const handleTabChange = useCallback((tab: ManageContentTab) => {
    startTransition(() => {
      setActiveTab(tab);
      // Clear filters when switching tabs to avoid cross-tab filter pollution
      handleFilterChange({});
      // Also reset status tab for publications if needed
      if (tab === 'publications') setStatusTab('all');
    });
  }, [setActiveTab, handleFilterChange]);

  // Sync state with URL changes (This is still useful for deep linking)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as ManageContentTab;
    if (tab && ['publications', 'campaigns', 'calendar', 'logs', 'approvals'].includes(tab)) {
      setActiveTab(tab);
    }
    // ... rest of effect ...

    // Handle actions (e.g. open create modal from command palette)
    if (params.get('action') === 'create') {
      openAddModal();
      // Optional: Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('action');
      window.history.replaceState({}, '', newUrl.toString());
    }

    // Handle Deep Linking by ID (e.g. from approval links)
    const id = params.get('id');
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
  }, [window.location.search, fetchPublicationById, openViewDetailsModal, openAddModal, setActiveTab]);

  const [statusTab, setStatusTab] = useState('all');

  const statusTabs = useMemo(() => [
    { id: 'all', label: t('manageContent.status.all'), icon: Folder },
    { id: 'draft', label: t('manageContent.status.draft'), icon: Edit3 },
    { id: 'scheduled', label: t('manageContent.status.scheduled'), icon: CalendarIcon },
    { id: 'published', label: t('manageContent.status.published'), icon: CheckCircle },
  ], []);

  const [isTabPending, startTransition] = useTransition();

  const handleStatusTabChange = useCallback((status: string) => {
    startTransition(() => {
      setStatusTab(status);
      handleFilterChange({ ...filters, status });
    });
  }, [filters, handleFilterChange]);

  const [expandedCampaigns, setExpandedCampaigns] = useState<number[]>([]);
  const toggleExpand = useCallback((id: number) => {
    setExpandedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  }, []);

  const handleEventClick = useCallback(async (id: any) => {
    if (typeof id === 'number') {
      const existingPub = publications.find(p => p.id === id);
      if (existingPub) {
        openEditModal(existingPub);
      } else {
        const pub = await fetchPublicationById(id);
        if (pub) {
          openEditModal(pub);
        }
      }
    }
  }, [publications, openEditModal, fetchPublicationById]);


  return (
    <AuthenticatedLayout>
      <Head title={t("manageContent.title")} />

      <div className="w-full max-w-full overflow-x-hidden min-w-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 min-w-0">
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white truncate tracking-tight">
                {t('manageContent.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-2 text-xs sm:text-base lg:text-lg truncate">
                {t('manageContent.subtitle')}
              </p>
            </div>

            <button
              onClick={() => openAddModal()}
              className="w-full sm:w-auto group relative inline-flex h-11 sm:h-12 items-center justify-center overflow-hidden rounded-2xl sm:rounded-full bg-primary-600 px-6 sm:px-8 font-bold text-white transition-all duration-300 hover:bg-primary-700 hover:scale-[1.02] active:scale-95 hover:shadow-lg focus:outline-none ring-offset-2 ring-primary-500/20 shadow-xl shadow-primary-500/10"
            >
              <Plus className="mr-2 h-5 w-5" />
              <span className="relative">{t('manageContent.createNew')}</span>
            </button>
          </div>

          <div className="mb-8">
            <SocialMediaAccounts />
          </div>
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700 w-full overflow-x-auto scrollbar-subtle snap-x h-fit">
            <div className="flex items-center gap-1 sm:gap-2 min-w-max px-1">
              <button
                onClick={() => handleTabChange('publications')}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${activeTab === 'publications' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Folder className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('manageContent.tabs.publications')}</span>
              </button>
              <button
                onClick={() => handleTabChange('campaigns')}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${activeTab === 'campaigns' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('manageContent.tabs.campaigns')}</span>
              </button>
              <button
                onClick={() => handleTabChange('calendar')}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${activeTab === 'calendar' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('manageContent.tabs.calendar')}</span>
              </button>
              <button
                onClick={() => handleTabChange('logs')}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${activeTab === 'logs' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('manageContent.tabs.logs')}</span>
              </button>
              {permissions.includes('approve') && (
                <button
                  onClick={() => handleTabChange('approvals')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${activeTab === 'approvals' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{t('manageContent.tabs.approvals')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="min-h-[500px]">

            {/* Calendar View */}
            {activeTab === 'calendar' && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ModernCalendar onEventClick={handleEventClick} />
              </div>
            )}

            {/* Approvals View */}
            {activeTab === 'approvals' && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ApprovalList
                  publications={publications.filter(p => p.status === 'pending_review')}
                  isLoading={isPubLoading}
                  onRefresh={handleRefresh}
                  onViewDetail={openViewDetailsModal}
                />
              </div>
            )}

            {/* Logs View */}
            {activeTab === 'logs' && (
              <div className="animate-in fade-in zoom-in duration-300">
                <LogsList
                  logs={logs as any}
                  isLoading={isLogsLoading}
                  pagination={logPagination}
                  onPageChange={handlePageChange}
                  onRefresh={handleRefresh}
                  onFilterChange={handleFilterChange}
                />
              </div>
            )}

            {/* Publications & Campaigns Views (With Status Tabs) */}
            {(activeTab === 'publications' || activeTab === 'campaigns') && (
              <div className="animate-in fade-in zoom-in duration-300">
                {activeTab === 'publications' && (
                  <div className="flex items-center gap-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700 w-full sm:w-fit overflow-x-auto scrollbar-subtle">
                    {statusTabs.map((tab: { id: string, label: string, icon: any }) => (
                      <button
                        key={tab.id}
                        onClick={() => handleStatusTabChange(tab.id)}
                        className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                    ${statusTab === tab.id
                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'}
                                `}
                      >
                        <tab.icon className={`w-4 h-4 ${statusTab === tab.id ? 'text-primary-500' : 'opacity-70'}`} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Content List Component */}
                <ContentList
                  items={activeTab === 'publications' ? publications : campaigns}
                  isLoading={activeTab === 'publications' ? isPubLoading : isCampLoading}
                  mode={activeTab === 'publications' ? 'publications' : 'campaigns'}
                  pagination={activeTab === 'publications' ? pubPagination : campPagination}
                  onPageChange={handlePageChange}
                  onEdit={openEditModal}
                  onDelete={handleDeleteItem}
                  onViewDetails={openViewDetailsModal}
                  onPublish={openPublishModal}
                  onEditRequest={handleEditRequest}
                  connectedAccounts={connectedAccounts}
                  expandedCampaigns={expandedCampaigns}
                  toggleExpand={toggleExpand}
                />
              </div>
            )}

          </div>

        </div>
      </div>

      <ModalManager onRefresh={handleRefresh} />
    </AuthenticatedLayout>
  );
}

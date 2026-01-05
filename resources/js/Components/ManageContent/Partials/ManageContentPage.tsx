
import React, { useState, useCallback, useMemo } from "react";
import LogsList from "@/Components/ManageContent/Logs/LogsList";
import ModalManager from "@/Components/ManageContent/ModalManager";
import { usePublicationStore } from "@/stores/publicationStore";
import SocialMediaAccounts from "@/Components/ManageContent/socialAccount/SocialMediaAccounts";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Copy, Plus, Folder, Filter, Calendar as CalendarIcon, FileClock, CheckCircle, Edit3, Target, FileText } from "lucide-react";

import { usePublications } from "@/Hooks/publication/usePublications";
import WorkspaceInfoBadge from "@/Components/Workspace/WorkspaceInfoBadge";
import ModernCalendar from "@/Components/ManageContent/Partials/ModernCalendar";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { useShallow } from "zustand/react/shallow";
import ContentList from "@/Components/ManageContent/ContentList";

export default function ManageContentPage() {
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
    // We'll filter on the client side for "tabs" or use the hook's filter functionality if available
    // For this refactor, let's assume valid data is passed and we filter visually or triggers API calls via handleFilterChange
  } = usePublications();

  const fetchPublicationById = usePublicationStore(s => s.fetchPublicationById);

  const {
    openAddModal,
    openEditModal,
    openPublishModal,
    openViewDetailsModal,
  } = useManageContentUIStore(
    useShallow((s) => ({
      openAddModal: s.openAddModal,
      openEditModal: s.openEditModal,
      openPublishModal: s.openPublishModal,
      openViewDetailsModal: s.openViewDetailsModal,
    }))
  );

  // New Tab State for "Context" (Publications vs Campaigns vs Calendar vs Logs)
  // We keep the original "activeTab" name from store if possible, or local state.
  // The user wants "Status Tabs" (Draft, Scheduled, Published).
  // So we need TWO levels of navigation:
  // 1. Context: Publications | Campaigns | Calendar
  // 2. Status: All | Drafts | Scheduled | Published (Only for Pubs/Campaigns)

  // Read tab from query param if available
  const queryParams = new URLSearchParams(window.location.search);
  const initialTab = (queryParams.get('tab') as 'publications' | 'campaigns' | 'calendar' | 'logs') || 'publications';

  const [contextTab, setContextTab] = useState<'publications' | 'campaigns' | 'calendar' | 'logs'>(initialTab);

  // Sync state with URL changes (e.g. backward/forward navigation)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as 'publications' | 'campaigns' | 'calendar' | 'logs';
    if (tab && ['publications', 'campaigns', 'calendar', 'logs'].includes(tab)) {
      setContextTab(tab);
    }

    // Handle actions (e.g. open create modal from command palette)
    if (params.get('action') === 'create') {
      openAddModal();
      // Optional: Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('action');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [window.location.search]);

  const [statusTab, setStatusTab] = useState('all');

  const statusTabs = useMemo(() => [
    { id: 'all', label: t('manageContent.status.all'), icon: Folder },
    { id: 'draft', label: t('manageContent.status.draft'), icon: Edit3 },
    { id: 'scheduled', label: t('manageContent.status.scheduled'), icon: CalendarIcon },
    { id: 'published', label: t('manageContent.status.published'), icon: CheckCircle },
  ], []);

  const [isTabPending, startTransition] = React.useTransition();

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
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700 w-full overflow-x-auto scrollbar-none snap-x h-fit">
            <div className="flex items-center gap-1 sm:gap-2 min-w-max px-1">
              <button
                onClick={() => startTransition(() => setContextTab('publications'))}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${contextTab === 'publications' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Folder className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('manageContent.tabs.publications')}</span>
              </button>
              <button
                onClick={() => startTransition(() => setContextTab('campaigns'))}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${contextTab === 'campaigns' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('manageContent.tabs.campaigns')}</span>
              </button>
              <button
                onClick={() => startTransition(() => setContextTab('calendar'))}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${contextTab === 'calendar' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('manageContent.tabs.calendar')}</span>
              </button>
              <button
                onClick={() => startTransition(() => setContextTab('logs'))}
                className={`flex items-center justify-center gap-2 py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 snap-start ${contextTab === 'logs' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('manageContent.tabs.logs')}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="min-h-[500px]">

            {/* Calendar View */}
            {contextTab === 'calendar' && (
              <div className="animate-in fade-in zoom-in duration-300">
                <ModernCalendar onEventClick={handleEventClick} />
              </div>
            )}

            {/* Logs View */}
            {contextTab === 'logs' && (
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
            {(contextTab === 'publications' || contextTab === 'campaigns') && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700 w-full sm:w-fit overflow-x-auto scrollbar-none">
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

                {/* Content List Component */}
                <ContentList
                  items={contextTab === 'publications' ? publications : campaigns}
                  isLoading={contextTab === 'publications' ? isPubLoading : isCampLoading}
                  mode={contextTab === 'publications' ? 'publications' : 'campaigns'}
                  pagination={contextTab === 'publications' ? pubPagination : campPagination}
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

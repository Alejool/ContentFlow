import { useConfirm } from '@/Hooks/useConfirm';
import { usePublicationStatus } from '@/Hooks/usePublicationStatus';
import { useS3Upload } from '@/Hooks/useS3Upload';
import { useUploadWarning } from '@/Hooks/useUploadWarning';
import { useProcessingProgress } from '@/stores/processingProgressStore';
import { useUploadQueue } from '@/stores/uploadQueueStore';
import axios from 'axios';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Cpu,
    FileUp,
    Loader2,
    Minus,
    Radio
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressDisplay } from './Upload/ProgressDisplay';
import { PublicationItem } from './Upload/PublicationItem';

type Tab = 'uploads' | 'processing' | 'publications';

export default function GlobalUploadIndicator() {
  const queue = useUploadQueue((state) => state.queue);
  const removeUpload = useUploadQueue((state) => state.removeUpload);
  const retryUpload = useUploadQueue((state) => state.retryUpload);

  const {
    pauseUpload,
    resumeUpload: resumeUploadWithLogic,
    cancelUpload: cancelUploadWithCleanup,
  } = useS3Upload();

  const processingJobs = useProcessingProgress((state) => state.jobs);
  const cancelJob = useProcessingProgress((state) => state.cancelJob);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('uploads');
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  const { t } = useTranslation();
  const { confirm, ConfirmDialog } = useConfirm();

  const { publications } = usePublicationStatus({ dismissedIds });
  const uploads = Object.values(queue);
  const jobs = Object.values(processingJobs);

  const activeUploads = uploads.filter(
    (u) => u.status === 'uploading' || u.status === 'pending' || u.status === 'paused',
  );
  const errorUploads = uploads.filter((u) => u.status === 'error');
  const activePublications = publications.filter(
    (p) => p.status === 'processing' || p.status === 'publishing',
  );
  const failedPublications = publications.filter((p) => p.status === 'failed');
  const completedPublications = publications.filter((p) => p.status === 'published');
  const activeJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'queued');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  const totalActive = activeUploads.length + activePublications.length + activeJobs.length;
  const hasErrors =
    errorUploads.length > 0 || failedPublications.length > 0 || failedJobs.length > 0;
  const hasCompleted =
    completedPublications.length > 0 ||
    uploads.some((u) => u.status === 'completed') ||
    jobs.some((j) => j.status === 'completed');

  useUploadWarning(activeUploads.length > 0);

  // Auto-select tab with activity
  useEffect(() => {
    if (activeUploads.length > 0) setActiveTab('uploads');
    else if (activeJobs.length > 0) setActiveTab('processing');
    else if (activePublications.length > 0) setActiveTab('publications');
  }, [activeUploads.length, activeJobs.length, activePublications.length]);

  const handleCancelPublication = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: t('publications.modal.cancel_confirmation.title') || 'Cancelar Publicación',
      message: t('publications.modal.cancel_confirmation.message') || '¿Cancelar esta publicación?',
      confirmText: t('publications.modal.cancel_confirmation.confirm') || 'Sí, cancelar',
      cancelText: t('publications.modal.cancel_confirmation.cancel') || 'No, continuar',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try { await axios.post(route('api.v1.publications.cancel', id)); } catch {}
  };

  const handleCancelPlatform = async (publicationId: number, platformId: number, platformName: string) => {
    const isConfirmed = await confirm({
      title: t('publications.modal.cancel_platform.title', { platform: platformName }) || `¿Cancelar ${platformName}?`,
      message: t('publications.modal.cancel_platform.message', { platform: platformName }) || `¿Cancelar la publicación en ${platformName}?`,
      confirmText: t('publications.modal.cancel_platform.confirm') || 'Sí, cancelar',
      cancelText: t('publications.modal.cancel_platform.cancel') || 'No',
      type: 'warning',
    });
    if (!isConfirmed) return;
    try {
      await axios.post(route('api.v1.publications.cancel', publicationId), { platform_ids: [platformId] });
      window.dispatchEvent(new CustomEvent('publication-cancelled', { detail: { publicationId, platformId } }));
    } catch {}
  };

  const handleDismissPublication = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleCancelUpload = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Cancel Upload',
      message: 'Are you sure you want to cancel this upload?',
      confirmText: 'Yes, cancel',
      cancelText: 'No, continue',
      type: 'danger',
    });
    if (!isConfirmed) return;
    await cancelUploadWithCleanup(id);
  };

  const handleCancelJob = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Cancel Processing',
      message: 'Are you sure you want to cancel this processing job?',
      confirmText: 'Yes, cancel',
      cancelText: 'No, continue',
      type: 'danger',
    });
    if (!isConfirmed) return;
    cancelJob(id);
  };

  if (uploads.length === 0 && publications.length === 0 && jobs.length === 0) return null;

  // Status icon
  const statusIcon = totalActive > 0
    ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-400" />
    : hasErrors
      ? <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
      : <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />;

  // Status dot color
  const dotColor = totalActive > 0 ? 'bg-primary-400 animate-pulse' : hasErrors ? 'bg-red-400' : 'bg-green-400';

  // Minimized pill
  if (isMinimized) {
    return (
      <>
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-lg transition-all hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
          title="Expand upload indicator"
        >
          <div className={`h-2 w-2 rounded-full ${dotColor}`} />
          {statusIcon}
          {totalActive > 0 && (
            <span className="text-xs font-bold text-gray-700 dark:text-neutral-200">{totalActive}</span>
          )}
        </button>
        <ConfirmDialog />
      </>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number; activeCount: number }[] = [
    {
      id: 'uploads',
      label: 'Archivos',
      icon: <FileUp className="h-3.5 w-3.5" />,
      count: uploads.length,
      activeCount: activeUploads.length,
    },
    {
      id: 'processing',
      label: 'Procesando',
      icon: <Cpu className="h-3.5 w-3.5" />,
      count: jobs.length,
      activeCount: activeJobs.length,
    },
    {
      id: 'publications',
      label: 'Plataformas',
      icon: <Radio className="h-3.5 w-3.5" />,
      count: publications.length,
      activeCount: activePublications.length,
    },
  ].filter((tab) => tab.count > 0);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[9999] w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">

        {/* Header — same style as DevCacheIndicator */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${dotColor}`} />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {totalActive > 0
                ? `${totalActive} tarea${totalActive > 1 ? 's' : ''} activa${totalActive > 1 ? 's' : ''}`
                : hasErrors
                  ? 'Algo salió mal'
                  : 'Completado'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-neutral-700"
              title={isExpanded ? 'Colapsar' : 'Expandir'}
            >
              {isExpanded
                ? <ChevronDown className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                : <ChevronUp className="h-4 w-4 text-gray-500 dark:text-neutral-400" />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-neutral-700"
              title="Minimizar"
            >
              <Minus className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="flex" style={{ height: '320px' }}>

            {/* Sidebar tabs */}
            <div className="flex w-24 flex-shrink-0 flex-col border-r border-gray-100 bg-gray-50/80 py-2 dark:border-neutral-700 dark:bg-neutral-800/60">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 text-center transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-primary-600 dark:bg-neutral-900 dark:text-primary-400'
                      : 'text-gray-500 hover:bg-white/60 hover:text-gray-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
                  {tab.activeCount > 0 && (
                    <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[9px] font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      {tab.activeCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content panel */}
            <div className="custom-scrollbar flex-1 overflow-y-auto">

              {/* Uploads tab */}
              {activeTab === 'uploads' && (
                <div>
                  <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/90">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                      Archivos
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                      {activeUploads.length} activos
                    </span>
                  </div>
                  {uploads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-neutral-500">
                      <FileUp className="mb-2 h-8 w-8 opacity-30" />
                      <span className="text-xs">Sin archivos</span>
                    </div>
                  ) : (
                    uploads.map((upload) => (
                      <div key={upload.id} className="border-b border-gray-100 p-3 last:border-0 dark:border-neutral-700/60">
                        <p className="mb-1.5 truncate text-xs font-medium text-gray-800 dark:text-neutral-100" title={upload.file.name}>
                          {upload.file.name}
                        </p>
                        <ProgressDisplay
                          percentage={upload.progress}
                          eta={upload.stats?.eta}
                          speed={upload.stats?.speed}
                          status={upload.status}
                          onPause={upload.isPausable && upload.status === 'uploading' ? () => pauseUpload(upload.id) : undefined}
                          onResume={upload.status === 'paused' ? () => resumeUploadWithLogic(upload.id) : undefined}
                          onCancel={upload.status === 'uploading' || upload.status === 'paused' ? () => handleCancelUpload(upload.id) : undefined}
                          onRetry={upload.status === 'error' && upload.canRetry ? () => retryUpload(upload.id) : undefined}
                          isPausable={upload.isPausable}
                          isPaused={upload.status === 'paused'}
                          error={upload.error}
                          retryCount={upload.retryCount}
                          canRetry={upload.canRetry}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Processing tab */}
              {activeTab === 'processing' && (
                <div>
                  <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/90">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                      Procesando
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                      {activeJobs.length} activos
                    </span>
                  </div>
                  {jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-neutral-500">
                      <Cpu className="mb-2 h-8 w-8 opacity-30" />
                      <span className="text-xs">Sin tareas</span>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="border-b border-gray-100 p-3 last:border-0 dark:border-neutral-700/60">
                        <p className="mb-0.5 text-xs font-medium text-gray-800 dark:text-neutral-100">
                          {job.type === 'video_processing' && 'Video Processing'}
                          {job.type === 'reel_generation' && 'Reel Generation'}
                          {job.type === 'thumbnail_generation' && 'Thumbnail Generation'}
                        </p>
                        {job.stats?.currentStep && (
                          <p className="mb-1.5 text-[10px] text-gray-400 dark:text-neutral-500">
                            {job.stats.currentStep} ({job.stats.completedSteps}/{job.stats.totalSteps})
                          </p>
                        )}
                        <ProgressDisplay
                          percentage={job.progress}
                          eta={job.stats?.eta}
                          status={job.status === 'queued' ? 'pending' : job.status === 'processing' ? 'uploading' : job.status}
                          onCancel={job.status === 'processing' || job.status === 'queued' ? () => handleCancelJob(job.id) : undefined}
                          isPausable={false}
                          isPaused={false}
                          error={job.error}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Publications tab */}
              {activeTab === 'publications' && (
                <div>
                  <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/90">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                      Plataformas
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                      {activePublications.length} en curso
                    </span>
                  </div>
                  {publications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-neutral-500">
                      <Radio className="mb-2 h-8 w-8 opacity-30" />
                      <span className="text-xs">Sin publicaciones</span>
                    </div>
                  ) : (
                    publications.map((publication) => (
                      <PublicationItem
                        key={publication.id}
                        publication={publication}
                        onCancel={handleCancelPublication}
                        onDismiss={handleDismissPublication}
                        onCancelPlatform={handleCancelPlatform}
                      />
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      <ConfirmDialog />
    </>
  );
}

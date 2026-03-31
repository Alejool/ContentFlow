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
  Cpu,
  FileUp,
  Loader2,
  Minus,
  Radio,
  Trash2,
  X,
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

  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
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
  const activeJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'queued');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  const totalActive = activeUploads.length + activePublications.length + activeJobs.length;
  const hasErrors =
    errorUploads.length > 0 || failedPublications.length > 0 || failedJobs.length > 0;

  useUploadWarning(activeUploads.length > 0);

  // Re-open if new activity arrives after closing
  useEffect(() => {
    if (totalActive > 0) setIsClosed(false);
  }, [totalActive]);

  // Auto-select tab with activity
  useEffect(() => {
    if (activeUploads.length > 0) setActiveTab('uploads');
    else if (activeJobs.length > 0) setActiveTab('processing');
    else if (activePublications.length > 0) setActiveTab('publications');
  }, [activeUploads.length, activeJobs.length, activePublications.length]);

  const handleCancelPublication = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Cancelar Publicación',
      message: '¿Cancelar esta publicación?',
      confirmText: 'Sí, cancelar',
      cancelText: 'No',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await axios.post(route('api.v1.publications.cancel', id));
    } catch {}
  };

  const handleCancelPlatform = async (
    publicationId: number,
    platformId: number,
    platformName: string,
  ) => {
    const ok = await confirm({
      title: `¿Cancelar ${platformName}?`,
      message: `¿Cancelar la publicación en ${platformName}?`,
      confirmText: 'Sí, cancelar',
      cancelText: 'No',
      type: 'warning',
    });
    if (!ok) return;
    try {
      await axios.post(route('api.v1.publications.cancel', publicationId), {
        platform_ids: [platformId],
      });
      window.dispatchEvent(
        new CustomEvent('publication-cancelled', { detail: { publicationId, platformId } }),
      );
    } catch {}
  };

  const handleDismissPublication = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleRemoveUpload = (id: string) => removeUpload(id);

  const handleCancelUpload = async (id: string) => {
    const ok = await confirm({
      title: 'Cancel Upload',
      message: 'Are you sure you want to cancel this upload?',
      confirmText: 'Yes, cancel',
      cancelText: 'No',
      type: 'danger',
    });
    if (!ok) return;
    await cancelUploadWithCleanup(id);
  };

  const handleCancelJob = async (id: string) => {
    const ok = await confirm({
      title: 'Cancel Processing',
      message: 'Are you sure you want to cancel this job?',
      confirmText: 'Yes, cancel',
      cancelText: 'No',
      type: 'danger',
    });
    if (!ok) return;
    cancelJob(id);
  };

  if (uploads.length === 0 && publications.length === 0 && jobs.length === 0) return null;
  if (isClosed) return <ConfirmDialog />;

  // Colors & icon based on status
  const dotColor = totalActive > 0 ? 'bg-primary-500' : hasErrors ? 'bg-red-500' : 'bg-green-500';
  const circleColor =
    totalActive > 0 ? 'bg-primary-500' : hasErrors ? 'bg-red-500' : 'bg-green-500';
  const statusIcon =
    totalActive > 0 ? (
      <Loader2 className="h-5 w-5 animate-spin text-white" />
    ) : hasErrors ? (
      <AlertTriangle className="h-5 w-5 text-white" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-white" />
    );

  // ── Minimized: just a circle icon, same as DevCacheIndicator ──
  if (isMinimized) {
    return (
      <>
        <div className="relative cursor-pointer self-end" onClick={() => setIsMinimized(false)}>
          <div
            className={`${circleColor} rounded-full p-3 shadow-lg transition-transform hover:scale-110`}
          >
            {statusIcon}
            {totalActive > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-gray-800 shadow">
                {totalActive}
              </span>
            )}
          </div>
        </div>
        <ConfirmDialog />
      </>
    );
  }

  // Tabs config — only show tabs that have items
  const tabs: {
    id: Tab;
    icon: React.ReactNode;
    count: number;
    activeCount: number;
    title: string;
  }[] = [
    {
      id: 'uploads' as const,
      icon: <FileUp className="h-4 w-4" />,
      count: uploads.length,
      activeCount: activeUploads.length,
      title: 'Archivos',
    },
    {
      id: 'processing' as const,
      icon: <Cpu className="h-4 w-4" />,
      count: jobs.length,
      activeCount: activeJobs.length,
      title: 'Procesando',
    },
    {
      id: 'publications' as const,
      icon: <Radio className="h-4 w-4" />,
      count: publications.length,
      activeCount: activePublications.length,
      title: 'Plataformas',
    },
  ].filter((tab) => tab.count > 0);

  return (
    <>
      <div className="w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${dotColor} ${totalActive > 0 ? 'animate-pulse' : ''}`}
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {totalActive > 0
                ? `${totalActive} activo${totalActive > 1 ? 's' : ''}`
                : hasErrors
                  ? 'Error'
                  : 'Completado'}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Minimize to circle */}
            <button
              onClick={() => setIsMinimized(true)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              title="Minimizar"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            {/* Close completely */}
            <button
              onClick={() => setIsClosed(true)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              title="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Icon-only tab bar */}
        {tabs.length > 1 && (
          <div className="flex border-b border-gray-100 dark:border-neutral-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.title}
                className={`relative flex flex-1 items-center justify-center py-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'
                }`}
              >
                {tab.icon}
                {tab.activeCount > 0 && (
                  <span className="absolute right-2 top-1 h-1.5 w-1.5 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="custom-scrollbar max-h-64 overflow-y-auto">
          {/* Uploads */}
          {activeTab === 'uploads' && (
            <>
              {uploads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300 dark:text-neutral-600">
                  <FileUp className="mb-1 h-6 w-6" />
                  <span className="text-xs">Sin archivos</span>
                </div>
              ) : (
                uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-start gap-2 border-b border-gray-100 px-3 py-2 last:border-0 dark:border-neutral-700/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xs font-medium text-gray-800 dark:text-neutral-100"
                        title={upload.file.name}
                      >
                        {upload.file.name}
                      </p>
                      <ProgressDisplay
                        percentage={upload.progress}
                        eta={upload.stats?.eta}
                        speed={upload.stats?.speed}
                        status={upload.status}
                        onPause={
                          upload.isPausable && upload.status === 'uploading'
                            ? () => pauseUpload(upload.id)
                            : undefined
                        }
                        onResume={
                          upload.status === 'paused'
                            ? () => resumeUploadWithLogic(upload.id)
                            : undefined
                        }
                        onCancel={
                          upload.status === 'uploading' || upload.status === 'paused'
                            ? () => handleCancelUpload(upload.id)
                            : undefined
                        }
                        onRetry={
                          upload.status === 'error' && upload.canRetry
                            ? () => retryUpload(upload.id)
                            : undefined
                        }
                        isPausable={upload.isPausable}
                        isPaused={upload.status === 'paused'}
                        error={upload.error}
                        retryCount={upload.retryCount}
                        canRetry={upload.canRetry}
                      />
                    </div>
                    {/* Remove from list */}
                    {(upload.status === 'completed' || upload.status === 'error') && (
                      <button
                        onClick={() => handleRemoveUpload(upload.id)}
                        className="mt-0.5 flex-shrink-0 rounded p-0.5 text-gray-300 hover:bg-gray-100 hover:text-red-400 dark:hover:bg-neutral-700"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* Processing */}
          {activeTab === 'processing' && (
            <>
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300 dark:text-neutral-600">
                  <Cpu className="mb-1 h-6 w-6" />
                  <span className="text-xs">Sin tareas</span>
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="border-b border-gray-100 px-3 py-2 last:border-0 dark:border-neutral-700/60"
                  >
                    <p className="mb-0.5 text-xs font-medium text-gray-800 dark:text-neutral-100">
                      {job.type === 'video_processing' && 'Video Processing'}
                      {job.type === 'reel_generation' && 'Reel Generation'}
                      {job.type === 'thumbnail_generation' && 'Thumbnail Generation'}
                    </p>
                    {job.stats?.currentStep && (
                      <p className="mb-1 text-[10px] text-gray-400 dark:text-neutral-500">
                        {job.stats.currentStep} ({job.stats.completedSteps}/{job.stats.totalSteps})
                      </p>
                    )}
                    <ProgressDisplay
                      percentage={job.progress}
                      eta={job.stats?.eta}
                      status={
                        job.status === 'queued'
                          ? 'pending'
                          : job.status === 'processing'
                            ? 'uploading'
                            : job.status
                      }
                      onCancel={
                        job.status === 'processing' || job.status === 'queued'
                          ? () => handleCancelJob(job.id)
                          : undefined
                      }
                      isPausable={false}
                      isPaused={false}
                      error={job.error}
                    />
                  </div>
                ))
              )}
            </>
          )}

          {/* Publications */}
          {activeTab === 'publications' && (
            <>
              {publications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300 dark:text-neutral-600">
                  <Radio className="mb-1 h-6 w-6" />
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
            </>
          )}
        </div>
      </div>

      <ConfirmDialog />
    </>
  );
}

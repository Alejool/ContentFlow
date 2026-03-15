import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatSpeed, formatTime } from '@/Utils/formatters';

interface UploadItemProps {
  upload: {
    id: string;
    file: { name: string };
    progress: number;
    status: 'uploading' | 'pending' | 'paused' | 'completed' | 'error' | 'cancelled';
    error?: string;
    stats?: { speed?: number; eta?: number };
  };
  onRemove: (id: string) => void;
}

export function UploadItem({ upload, onRemove }: UploadItemProps) {
  const { t } = useTranslation();

  // Ensure progress is a valid number between 0-100
  const progress = Math.min(100, Math.max(0, Math.round(upload.progress || 0)));

  const getProgressColor = () => {
    switch (upload.status) {
      case 'error':
        return 'bg-red-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-gray-400';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-primary';
    }
  };

  const getStatusText = () => {
    if (upload.status === 'uploading' && upload.stats?.eta) {
      return `~${formatTime(upload.stats.eta)} ${t('publications.modal.upload.left', { defaultValue: 'restante' })}`;
    }
    if (upload.status === 'error') return upload.error;
    if (upload.status === 'completed')
      return t('publications.modal.upload.done', { defaultValue: 'Listo' });
    if (upload.status === 'paused')
      return t('publications.modal.upload.paused', { defaultValue: 'Pausado' });
    if (upload.status === 'cancelled')
      return t('publications.modal.upload.cancelled', {
        defaultValue: 'Cancelado',
      });
    return t('publications.modal.upload.pending', {
      defaultValue: 'Pendiente',
    });
  };

  return (
    <div className="group border-b border-gray-100 p-3 last:border-0 dark:border-neutral-700">
      <div className="mb-2 flex items-start justify-between">
        <span
          className="max-w-[200px] truncate text-xs font-medium text-neutral-900 dark:text-neutral-100"
          title={upload.file.name}
        >
          {upload.file.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(upload.id);
          }}
          className="text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-700">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-10 text-right text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
          {progress}%
        </span>
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 dark:text-neutral-400">
        <span>
          {upload.status === 'uploading' && upload.stats?.speed
            ? formatSpeed(upload.stats.speed)
            : ''}
        </span>
        <span>{getStatusText()}</span>
      </div>
    </div>
  );
}

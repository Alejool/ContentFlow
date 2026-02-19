import React, { useState } from 'react';
import Button from '@/Components/common/Modern/Button';
import Label from '@/Components/common/Modern/Label';
import { Sparkles, Loader2, Trash2, Film, Download, ExternalLink, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface MediaFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  status: string;
  metadata?: {
    platform?: string;
    optimized_for?: string;
    original_media_id?: number;
    duration?: number;
  };
}

interface ReelsSectionProps {
  videoFile?: MediaFile;
  publicationId: number;
  allMediaFiles: MediaFile[];
  onReelsDeleted?: () => void;
}

export default function ReelsSection({ 
  videoFile, 
  publicationId, 
  allMediaFiles,
  onReelsDeleted
}: ReelsSectionProps) {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filter reels generated from the current video
  const generatedReels = videoFile 
    ? allMediaFiles.filter(media => 
        media.file_type === 'reel' && 
        media.metadata?.original_media_id === videoFile.id
      )
    : [];

  const getPlatformIcon = (platform?: string) => {
    const icons: Record<string, string> = {
      instagram: '📸',
      tiktok: '🎵',
      youtube_shorts: '▶️',
    };
    return icons[platform || ''] || '🎬';
  };

  const getPlatformColor = (platform?: string) => {
    const colors: Record<string, string> = {
      instagram: 'from-pink-500 to-purple-500',
      tiktok: 'from-black to-cyan-500',
      youtube_shorts: 'from-red-500 to-red-600',
    };
    return colors[platform || ''] || 'from-purple-500 to-purple-600';
  };

  const handleDeleteReel = async (reelId: number) => {
    if (!confirm(t('reels.messages.confirmDelete'))) return;

    setDeletingId(reelId);
    try {
      await axios.delete(`/api/v1/media/${reelId}`);
      toast.success(t('reels.messages.reelDeleted'));
      onReelsDeleted?.();
    } catch (error) {
      toast.error(t('reels.messages.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (reel: MediaFile) => {
    const link = document.createElement('a');
    link.href = reel.file_path;
    link.download = reel.file_name || `reel-${reel.metadata?.platform}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (reel: MediaFile) => {
    window.open(reel.file_path, '_blank');
  };

  const handleGenerate = async () => {
    if (!videoFile) {
      toast.error(t('reels.messages.noVideo'));
      return;
    }

    // Prevent multiple clicks
    if (generating) {
      toast.error('Ya hay una generación en proceso. Por favor espera.');
      return;
    }

    // Check if there are reels currently processing
    const hasProcessingReels = generatedReels.some(reel => reel.status === 'processing');
    if (hasProcessingReels) {
      toast.error('Ya hay un reel generándose. Por favor espera a que termine.');
      return;
    }

    // If reels already exist, ask for confirmation to regenerate
    if (generatedReels.length > 0) {
      const confirmed = confirm('Ya existen reels generados. ¿Deseas generar uno nuevo?');
      if (!confirmed) return;
    }

    setGenerating(true);

    try {
      await axios.post('/api/v1/reels/generate', {
        media_file_id: videoFile.id,
        publication_id: publicationId,
        platforms: ['instagram'], // Single platform by default
        add_subtitles: true,
        language: 'es',
      });

      toast.success('Generando reel optimizado...');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al generar el reel';
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        toast.error( errorMessage);
      } else if (errorMessage.includes('AI service not configured')) {
        toast.error('Servicio de IA no configurado. Contacta al administrador.');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Error generating reel:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReels = async () => {
    if (generatedReels.length === 0) return;

    setDeleting(true);

    try {
      // Delete all reels
      await Promise.all(
        generatedReels.map(reel => 
          axios.delete(`/api/v1/media/${reel.id}`)
        )
      );

      toast.success(t('reels.messages.deleted'));
      onReelsDeleted?.();
    } catch (error) {
      toast.error(t('reels.messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  if (!videoFile) return null;

  // Check if there are reels currently processing
  const hasProcessingReels = generatedReels.some(reel => reel.status === 'processing');
  const isButtonDisabled = generating || hasProcessingReels;

  return (
    <div className="space-y-4">
      <Label
        htmlFor="reels-section"
        icon={Film}
        variant="bold"
        size="lg"
      >
        {t('reels.section.title')}
      </Label>

      {generatedReels.length > 0 ? (
        <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-800">
          {/* Header with actions */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 px-4 py-3 border-b border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('reels.section.generated', { count: generatedReels.length })}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('reels.section.generatedDescription')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeleteReels}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t('common.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('reels.section.deleteAll')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Reels List */}
          <div className="p-4 space-y-3">
            {generatedReels.map((reel) => (
              <div
                key={reel.id}
                className="group relative flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900/50 rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all"
              >
                {/* Video Thumbnail */}
                <div className="relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden bg-black">
                  <video
                    src={reel.file_path}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white" fill="white" />
                  </div>
                  {/* Platform Badge on thumbnail */}
                  <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r ${getPlatformColor(reel.metadata?.platform)}`}>
                    {getPlatformIcon(reel.metadata?.platform)}
                  </div>
                </div>

                {/* Reel Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {reel.metadata?.platform || 'Reel'}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 rounded-full uppercase">
                      Reel
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    {reel.metadata?.duration && (
                      <span className="flex items-center gap-1">
                        <Film className="w-3 h-3" />
                        {Math.floor(reel.metadata.duration)}s
                      </span>
                    )}
                    <span className="capitalize">
                      {reel.status === 'completed' ? '✓ Listo' : reel.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenInNewTab(reel)}
                    className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title={t('common.openInNewTab')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(reel)}
                    className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title={t('common.download')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReel(reel.id)}
                    disabled={deletingId === reel.id}
                    className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title={t('reels.actions.delete')}
                  >
                    {deletingId === reel.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center bg-gray-50 dark:bg-neutral-800/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t('reels.section.empty')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm">
                {t('reels.section.emptyDescription')}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              buttonStyle="solid"
              variant="primary"
              size="sm"
              className="gap-2"
              icon={generating || hasProcessingReels ? Loader2 : Sparkles}
              loading={generating || hasProcessingReels}
            >
              {generating || hasProcessingReels ? 'Generando reel...' : 'Generar Reel con IA'}
            </Button>
            {(generating || hasProcessingReels) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ⏳ Esto puede tomar 2-4 minutos. No cierres esta página.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

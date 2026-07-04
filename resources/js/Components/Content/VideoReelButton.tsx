import Button from '@/Components/common/Modern/Button';
import { useGeneratePresignedUrl } from '@/Hooks/Upload/usePresignedUrl';
import { reelService } from '@/Services/Reels/reelService';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
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

interface VideoReelButtonProps {
  videoFile: MediaFile;
  publicationId: number;
  allMediaFiles?: MediaFile[];
  compact?: boolean;
}

export default function VideoReelButton({
  videoFile,
  publicationId,
  allMediaFiles = [],
  compact = false,
}: VideoReelButtonProps) {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [showReels, setShowReels] = useState(true);
  const generatePresignedUrl = useGeneratePresignedUrl('download');

  // Filter reels generated from this video
  const generatedReels = allMediaFiles.filter(
    (media) => media.metadata?.original_media_id === videoFile.id,
  );

  const handleGenerate = async () => {
    // Check if there are reels currently processing
    const hasProcessingReels = generatedReels.some((reel) => reel.status === 'processing');
    if (hasProcessingReels) {
      toast.error(t('reels.messages.alreadyProcessing'));
      return;
    }

    // If reels already exist, ask for confirmation to regenerate
    if (generatedReels.length > 0) {
      const confirmed = confirm(t('reels.messages.confirmRegenerate'));
      if (!confirmed) return;
    }

    setGenerating(true);

    try {
      await reelService.generate({
        media_file_id: videoFile.id,
        publication_id: publicationId,
        platforms: ['instagram', 'tiktok', 'youtube_shorts'],
        add_subtitles: true,
        language: 'es',
      });

      toast.success(t('reels.messages.generating'));
      setShowReels(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t('reels.messages.error');

      if (errorMessage.includes('AI service not configured')) {
        toast.error(t('reels.messages.noAiConfigured'));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenReel = async (reelId: number) => {
    try {
      const response = await generatePresignedUrl.mutateAsync(reelId);
      const url = response.data?.download_url;
      if (url) {
        window.open(url, '_blank');
      }
    } catch {
      toast.error(t('reels.messages.error'));
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '',
      tiktok: '',
      youtube_shorts: '▶️',
    };
    return icons[platform] || '🎬';
  };

  if (videoFile.file_type !== 'video') return null;

  // Check if there are reels currently processing
  const hasProcessingReels = generatedReels.some((reel) => reel.status === 'processing');
  const isButtonDisabled = generating || hasProcessingReels;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={isButtonDisabled}
        buttonStyle="outline"
        variant="primary"
        size={compact ? 'sm' : 'md'}
        className="w-full gap-2 border-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-50"
        icon={generating || hasProcessingReels ? Loader2 : Sparkles}
        loading={generating || hasProcessingReels}
      >
        {generating || hasProcessingReels
          ? t('reels.button.generating')
          : t('reels.button.generate')}
      </Button>

      {generatedReels.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowReels(!showReels)}
            className="flex w-full items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700"
          >
            {showReels ? '▼' : '▶'}
            <span className="flex-1 text-left">
              {generatedReels.length}{' '}
              {t('reels.list.reelsGenerated', { count: generatedReels.length })}
            </span>
          </button>

          {showReels && (
            <div className="space-y-1.5 border-l-2 border-purple-300 pl-2">
              {generatedReels.map((reel) => (
                <div
                  key={reel.id}
                  className="flex items-center justify-between rounded-md border border-purple-200 bg-purple-50 p-2 text-xs transition-colors hover:bg-purple-100"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-base">
                      {getPlatformIcon(reel.metadata?.platform || '')}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium capitalize text-gray-700">
                        {reel.metadata?.platform || 'Reel'}
                      </span>
                      {reel.metadata?.duration && (
                        <span className="text-2xs text-gray-500">
                          {Math.floor(reel.metadata.duration)}s
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {reel.status === 'completed' && (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        <button
                          onClick={() => handleOpenReel(reel.id)}
                          disabled={generatePresignedUrl.isPending}
                          className="rounded p-1 transition-colors hover:bg-purple-200 disabled:opacity-50"
                          title="Ver reel"
                        >
                          {generatePresignedUrl.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5 text-purple-600" />
                          )}
                        </button>
                      </>
                    )}
                    {reel.status === 'processing' && (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                        <span className="text-2xs font-medium text-blue-600">Procesando</span>
                      </div>
                    )}
                    {reel.status === 'failed' && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-2xs font-medium text-red-600">Error</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

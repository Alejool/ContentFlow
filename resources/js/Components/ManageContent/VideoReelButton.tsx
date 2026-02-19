import React, { useState } from 'react';
import Button from '@/Components/common/Modern/Button';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
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
  compact = false
}: VideoReelButtonProps) {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [showReels, setShowReels] = useState(false);

  // Filter reels generated from this video
  const generatedReels = allMediaFiles.filter(
    media => media.metadata?.original_media_id === videoFile.id
  );

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      await axios.post('/api/v1/reels/generate', {
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

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📸',
      tiktok: '🎵',
      youtube_shorts: '▶️',
    };
    return icons[platform] || '🎬';
  };

  if (videoFile.file_type !== 'video') return null;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={generating}
        buttonStyle="outline"
        variant="primary"
        size={compact ? "sm" : "md"}
        className="w-full gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-purple-700"
        icon={generating ? Loader2 : Sparkles}
        loading={generating}
      >
        {generating ? t('reels.button.generating') : t('reels.button.generate')}
      </Button>

      {generatedReels.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowReels(!showReels)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {showReels ? '▼' : '▶'} {generatedReels.length} {t('reels.list.reelsGenerated', { count: generatedReels.length })}
          </button>

          {showReels && (
            <div className="space-y-1 pl-3 border-l-2 border-purple-200">
              {generatedReels.map((reel) => (
                <div
                  key={reel.id}
                  className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-accent"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span>{getPlatformIcon(reel.metadata?.platform || '')}</span>
                    <span className="truncate">{reel.metadata?.platform}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {reel.status === 'completed' && (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <button
                          onClick={() => {
                            const url = reel.file_path.startsWith('http') 
                              ? reel.file_path 
                              : `/storage/${reel.file_path}`;
                            window.open(url, '_blank');
                          }}
                          className="p-0.5 hover:bg-accent rounded"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    {reel.status === 'processing' && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                    {reel.status === 'failed' && (
                      <AlertCircle className="h-3 w-3 text-red-500" />
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

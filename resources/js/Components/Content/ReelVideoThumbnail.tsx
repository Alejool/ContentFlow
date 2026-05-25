import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFileAccess } from '@/Hooks/Upload/useSignedUrls';

interface ReelVideoThumbnailProps {
  mediaFileId: number;
  className?: string;
}

/**
 * Component para mostrar thumbnail de video usando signed URL
 * En lugar de file_path directo (público), solicita signed URL al backend
 */
export function ReelVideoThumbnail({
  mediaFileId,
  className = 'h-full w-full object-cover',
}: ReelVideoThumbnailProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { getAccessUrl } = useFileAccess();

  useEffect(() => {
    let mounted = true;

    getAccessUrl(mediaFileId)
      .then(({ url }) => {
        if (mounted) {
          setVideoUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [mediaFileId, getAccessUrl]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <span className="text-xs text-gray-400">Unavailable</span>
      </div>
    );
  }

  return <video src={videoUrl} className={className} muted />;
}

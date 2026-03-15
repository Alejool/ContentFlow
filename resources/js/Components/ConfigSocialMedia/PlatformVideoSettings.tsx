import VideoValidationAlert from '@/Components/Content/VideoValidationAlert';
import {
    PLATFORM_REQUIREMENTS,
    validateVideoForPlatform,
    ValidationResult,
} from '@/Utils/videoValidation';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PlatformVideoSettingsProps {
  platform: string;
  currentType: string;
  videoMetadata?: {
    duration: number;
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
  onTypeChange: (type: string) => void;
  children: React.ReactNode;
}

export default function PlatformVideoSettings({
  platform,
  currentType,
  videoMetadata,
  onTypeChange,
  children,
}: PlatformVideoSettingsProps) {
  const { t } = useTranslation();
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  useEffect(() => {
    if (!videoMetadata || !videoMetadata.width || !videoMetadata.height) {
      setValidation(null);
      return;
    }

    const result = validateVideoForPlatform(
      {
        duration: videoMetadata.duration,
        width: videoMetadata.width,
        height: videoMetadata.height,
        aspectRatio: videoMetadata.aspectRatio || videoMetadata.width / videoMetadata.height,
        size: 0,
        format: '',
      },
      platform,
      currentType,
      t,
    );

    setValidation(result);
  }, [videoMetadata, platform, currentType, t]);

  const requirements = PLATFORM_REQUIREMENTS[platform];

  return (
    <div className="space-y-4">
      {/* Información de requisitos */}
      {requirements && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-300">
                {t('videoValidation.requirements')}
              </p>
              <div className="space-y-2 text-xs text-blue-700 dark:text-blue-400">
                {currentType === 'short' && requirements.short && (
                  <div>
                    <p className="font-medium">YouTube Shorts:</p>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>
                        • {t('videoValidation.maxDuration')}: {requirements.short.maxDuration}s
                      </li>
                      <li>• {t('videoValidation.aspectRatio')}: 9:16 (vertical)</li>
                      <li>• {t('videoValidation.minResolution')}: 720x1280</li>
                    </ul>
                  </div>
                )}
                {currentType === 'reel' && requirements.reel && (
                  <div>
                    <p className="font-medium">{requirements.name} Reels:</p>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>
                        • {t('videoValidation.maxDuration')}: {requirements.reel.maxDuration}s
                      </li>
                      <li>• {t('videoValidation.aspectRatio')}: 9:16 (vertical)</li>
                      <li>
                        • {t('videoValidation.minResolution')}:{' '}
                        {requirements.reel.resolution.minWidth}x
                        {requirements.reel.resolution.minHeight}
                      </li>
                    </ul>
                  </div>
                )}
                {currentType === 'video' && requirements.video && (
                  <div>
                    <p className="font-medium">{requirements.name} Video:</p>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>
                        • {t('videoValidation.maxDuration')}:{' '}
                        {Math.floor(requirements.video.maxDuration / 3600)}h
                      </li>
                      <li>• {t('videoValidation.anyAspectRatio')}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validación del video actual */}
      {validation && videoMetadata && (
        <VideoValidationAlert
          validation={validation}
          platform={platform}
          currentType={currentType}
          onTypeChange={onTypeChange}
        />
      )}

      {/* Metadatos del video */}
      {videoMetadata && videoMetadata.width && videoMetadata.height && (
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
          <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('videoValidation.videoInfo')}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                {t('videoValidation.duration')}:
              </span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {videoMetadata.duration}s
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                {t('videoValidation.resolution')}:
              </span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {videoMetadata.width}x{videoMetadata.height}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                {t('videoValidation.aspectRatio')}:
              </span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {videoMetadata.aspectRatio?.toFixed(2)} (
                {videoMetadata.aspectRatio && videoMetadata.aspectRatio < 1
                  ? '9:16'
                  : videoMetadata.aspectRatio && Math.abs(videoMetadata.aspectRatio - 1) < 0.1
                    ? '1:1'
                    : '16:9'}
                )
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                {t('videoValidation.orientation')}:
              </span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {videoMetadata.aspectRatio && videoMetadata.aspectRatio < 1
                  ? t('videoValidation.vertical')
                  : t('videoValidation.horizontal')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Configuración de la plataforma */}
      {children}
    </div>
  );
}

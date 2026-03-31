import Button from '@/Components/common/Modern/Button';
import { REEL_COMPATIBLE_PLATFORMS } from '@/Constants/contentTypes';
import { BarChart3, Clock, FileText, Images, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

export type ContentType = 'post' | 'reel' | 'story' | 'poll' | 'carousel';

interface ContentTypeOption {
  value: ContentType;
  label: string;
  icon: LucideIcon;
  platforms: string[];
}

interface ContentTypeIconSelectorProps {
  selectedType: ContentType;
  selectedPlatforms: string[];
  onChange: (type: ContentType) => void;
  t: (key: string) => string;
  disabled?: boolean;
  mediaFiles?: { mime_type?: string; type?: string }[];
}

// Content type platform support (mirroring backend config/content_types.php)
const contentTypes: ContentTypeOption[] = [
  {
    value: 'post',
    label: 'Post',
    icon: FileText,
    platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
  },
  {
    value: 'reel',
    label: 'Reel/Short',
    icon: Video,
    platforms: [...REEL_COMPATIBLE_PLATFORMS],
  },
  {
    value: 'story',
    label: 'Story',
    icon: Clock,
    platforms: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
  },
  {
    value: 'poll',
    label: 'Poll',
    icon: BarChart3,
    platforms: ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
  },
  {
    value: 'carousel',
    label: 'Carousel',
    icon: Images,
    platforms: ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'pinterest', 'tiktok'],
  },
];

export default function ContentTypeIconSelector({
  selectedType,
  selectedPlatforms,
  onChange,
  t,
  disabled = false,
  mediaFiles,
}: ContentTypeIconSelectorProps) {
  // Filter content types based on selected platforms
  const availableTypes = useMemo(() => {
    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      return contentTypes;
    }

    return contentTypes.filter((type) => {
      return selectedPlatforms.every((platform) => type.platforms.includes(platform.toLowerCase()));
    });
  }, [selectedPlatforms]);

  return (
    <div className="items-centergap-1 flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-neutral-700 dark:bg-neutral-800/50">
      {availableTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.value;
        const isTypeLocked = mediaFiles && mediaFiles.length > 0;
        const isAvailable =
          !disabled &&
          !isTypeLocked &&
          (selectedPlatforms.length === 0 ||
            selectedPlatforms.every((p) => type.platforms.includes(p.toLowerCase())));

        // Determine tooltip message
        let tooltipMessage = type.label;
        if (isTypeLocked && !isSelected) {
          tooltipMessage = `${type.label} - ${t('publications.modal.contentType.locked') || 'Locked after uploading media'}`;
        } else if (!isAvailable && selectedPlatforms.length > 0) {
          const incompatiblePlatforms = selectedPlatforms.filter(
            (p) => !type.platforms.includes(p.toLowerCase()),
          );
          if (incompatiblePlatforms.length > 0) {
            tooltipMessage = `${type.label} - Not supported by ${incompatiblePlatforms.join(', ')}`;
          }
        }

        return (
          <div key={type.value} className="group relative">
            <Button
              type="button"
              onClick={() => isAvailable && onChange(type.value)}
              disabled={!isAvailable}
              buttonStyle="icon"
              size="xl"
              icon={Icon}
              className={`!rounded-lg !p-2 transition-all duration-200 ${isSelected ? '!bg-primary-500 !text-white shadow-sm' : ''} ${!isAvailable ? 'cursor-not-allowed opacity-40' : ''} `}
              title={tooltipMessage}
            >
              <></>
            </Button>

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
              <div className="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-neutral-800">
                {tooltipMessage}
                <div className="absolute left-1/2 top-full -mt-px -translate-x-1/2">
                  <div className="border-4 border-transparent border-t-gray-900 dark:border-t-neutral-800"></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

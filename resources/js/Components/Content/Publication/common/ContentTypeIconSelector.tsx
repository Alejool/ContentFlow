import { CONTENT_TYPE_CONFIG } from '@/Constants/Content/contentTypes';
import type { ContentType } from '@/Constants/Content/contentTypes';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Clock, FileText, Images, Video } from 'lucide-react';
import { useMemo } from 'react';

// Re-export so callers that imported the local type keep working.
export type { ContentType };

interface ContentTypeIconSelectorProps {
  selectedType: ContentType;
  selectedPlatforms: string[];
  onChange: (type: ContentType) => void;
  t: (key: string) => string;
  disabled?: boolean;
  mediaFiles?: { mime_type?: string; type?: string }[] | undefined;
}

// Icon map — keys mirror CONTENT_TYPE_DISPLAY.icon string values.
const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  Video,
  Circle: Clock, // Story uses Clock (time-limited) even though display says "Circle"
  Images,
  BarChart3,
};

// Display labels — defined once here so ContentTypeIconSelector stays self-contained.
const LABELS: Record<ContentType, string> = {
  post: 'Post',
  reel: 'Reel/Short',
  story: 'Story',
  poll: 'Poll',
  carousel: 'Carousel',
};

const ICON_KEYS: Record<ContentType, string> = {
  post: 'FileText',
  reel: 'Video',
  story: 'Circle',
  poll: 'BarChart3',
  carousel: 'Images',
};

// Derived from CONTENT_TYPE_CONFIG — single source of truth.
// Any change to CONTENT_TYPE_CONFIG automatically propagates here.
const CONTENT_TYPES = (Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map((value) => ({
  value,
  label: LABELS[value],
  icon: ICON_MAP[ICON_KEYS[value]] ?? FileText,
  platforms: CONTENT_TYPE_CONFIG[value].platforms as readonly string[],
}));

export default function ContentTypeIconSelector({
  selectedType,
  selectedPlatforms,
  onChange,
  t,
  disabled = false,
  mediaFiles,
}: ContentTypeIconSelectorProps) {
  // Only show types that every selected platform supports.
  const availableTypes = useMemo(() => {
    if (!selectedPlatforms || selectedPlatforms.length === 0) return CONTENT_TYPES;
    return CONTENT_TYPES.filter((type) =>
      selectedPlatforms.every((p) => type.platforms.includes(p.toLowerCase())),
    );
  }, [selectedPlatforms]);

  return (
    <div className="items-centergap-1 flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-neutral-700 dark:bg-theme-bg-secondary">
      {availableTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.value;
        const isTypeLocked = mediaFiles && mediaFiles.length > 0;
        const isAvailable =
          !disabled &&
          !isTypeLocked &&
          (selectedPlatforms.length === 0 ||
            selectedPlatforms.every((p) => type.platforms.includes(p.toLowerCase())));

        let tooltipMessage = type.label;
        if (isTypeLocked && !isSelected) {
          tooltipMessage = `${type.label} - ${t('publications.modal.contentType.locked') || 'Locked after uploading media'}`;
        } else if (!isAvailable && selectedPlatforms.length > 0) {
          const incompatible = selectedPlatforms.filter(
            (p) => !type.platforms.includes(p.toLowerCase()),
          );
          if (incompatible.length > 0) {
            tooltipMessage = `${type.label} - Not supported by ${incompatible.join(', ')}`;
          }
        }

        return (
          <div key={type.value} className="group relative">
            <button
              type="button"
              onClick={() => isAvailable && onChange(type.value)}
              disabled={!isAvailable}
              className={`flex items-center justify-center rounded-lg p-2 transition-all duration-200 ${isSelected ? 'bg-primary-500 text-white shadow-sm' : 'bg-transparent text-black dark:text-white hover:bg-primary-500/15'} ${!isAvailable ? 'cursor-not-allowed opacity-40' : ''}`}
              title={tooltipMessage}
            >
              <Icon className="h-5 w-5" />
            </button>

            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
              <div className="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-theme-bg-secondary">
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

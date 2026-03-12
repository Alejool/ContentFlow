import { 
  FileText, 
  Video, 
  Clock, 
  BarChart3, 
  Images, 
  Radio,
  Check
} from "lucide-react";
import { useMemo } from "react";

export type ContentType = 'post' | 'reel' | 'story' | 'poll' | 'carousel';

interface ContentTypeOption {
  value: ContentType;
  label: string;
  description: string;
  icon: any;
  platforms: string[];
}

interface ContentTypeSelectorProps {
  selectedType: ContentType;
  selectedPlatforms: string[];
  onChange: (type: ContentType) => void;
  t: (key: string) => string;
}

const contentTypes: ContentTypeOption[] = [
  {
    value: 'post',
    label: 'Post',
    description: 'Standard social media post',
    icon: FileText,
    platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'],
  },
  {
    value: 'reel',
    label: 'Reel/Short',
    description: 'Short vertical video',
    icon: Video,
    platforms: ['instagram', 'tiktok', 'youtube'],
  },
  {
    value: 'story',
    label: 'Story',
    description: 'Temporary 24h content',
    icon: Clock,
    platforms: ['instagram', 'facebook'],
  },
  {
    value: 'poll',
    label: 'Poll',
    description: 'Interactive poll/survey',
    icon: BarChart3,
    platforms: ['twitter', 'facebook'],
  },
  {
    value: 'carousel',
    label: 'Carousel',
    description: 'Multiple images/slides',
    icon: Images,
    platforms: ['instagram', 'linkedin', 'pinterest'],
  },
];

export default function ContentTypeSelector({
  selectedType,
  selectedPlatforms,
  onChange,
  t,
}: ContentTypeSelectorProps) {
  
  // Filter content types based on selected platforms
  const availableTypes = useMemo(() => {
    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      return contentTypes;
    }

    return contentTypes.filter(type => {
      // Check if at least one selected platform supports this content type
      return selectedPlatforms.some(platform => 
        type.platforms.includes(platform.toLowerCase())
      );
    });
  }, [selectedPlatforms]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {t("publications.modal.contentType.label") || "Content Type"}
      </label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {availableTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.value;
          const isAvailable = selectedPlatforms.length === 0 || 
            selectedPlatforms.some(p => type.platforms.includes(p.toLowerCase()));

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => isAvailable && onChange(type.value)}
              disabled={!isAvailable}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                }
                ${!isAvailable 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-md'
                }
                group
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isSelected 
                    ? 'bg-primary-100 dark:bg-primary-800/30' 
                    : 'bg-gray-100 dark:bg-neutral-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10'
                  }
                `}>
                  <Icon className={`
                    w-6 h-6 transition-colors
                    ${isSelected 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-600 dark:text-gray-400'
                    }
                  `} />
                </div>
                
                <div>
                  <p className={`
                    text-sm font-bold transition-colors
                    ${isSelected 
                      ? 'text-primary-700 dark:text-primary-300' 
                      : 'text-gray-900 dark:text-white'
                    }
                  `}>
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {type.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedPlatforms.length > 0 && availableTypes.length < contentTypes.length && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          {t("publications.modal.contentType.filteredByPlatforms") || 
            "Some content types are hidden based on selected platforms"}
        </p>
      )}
    </div>
  );
}

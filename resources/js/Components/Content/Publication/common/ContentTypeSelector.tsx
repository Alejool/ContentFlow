import { REEL_COMPATIBLE_PLATFORMS } from '@/Constants/contentTypes';
import {
    BarChart3,
    Check,
    Clock,
    FileText,
    Images,
    Video
} from "lucide-react";
import { useMemo } from "react";

export type ContentType = 'post' | 'reel' | 'story' | 'poll' | 'carousel';

interface ContentTypeOption {
  value: ContentType;
  label: string;
  description: string;
  icon: any;
  platforms: string[];
  mediaRules: {
    minCount?: number;
    maxCount?: number;
    maxImages?: number;
    maxVideos?: number;
    allowMixed?: boolean; // Permite mezclar imágenes y videos
    videoOnly?: boolean;
    imageOnly?: boolean;
  };
}

interface ContentTypeSelectorProps {
  selectedType: ContentType;
  selectedPlatforms: string[];
  onChange: (type: ContentType) => void;
  t: (key: string) => string;
  mediaFiles?: any[];
}

/**
 * REGLAS DE CONTENIDO POR TIPO Y PLATAFORMA
 * 
 * POST (Publicación estándar):
 * - Instagram: 1 imagen, 1 video, o carousel (hasta 10 imágenes/videos mezclados)
 * - Facebook: 1 imagen, 1 video, o múltiples imágenes (álbum)
 * - Twitter/X: Hasta 4 imágenes o 1 video
 * - LinkedIn: 1 imagen, 1 video, o documento
 * - YouTube: 1 video (publicación de comunidad puede tener 1 imagen)
 * - Pinterest: 1 imagen o 1 video
 * 
 * REEL/SHORT (Video vertical corto):
 * - Instagram Reels: Solo 1 video vertical (9:16)
 * - TikTok: Solo 1 video vertical
 * - YouTube Shorts: Solo 1 video vertical
 * 
 * STORY (Contenido temporal 24h):
 * - Instagram Stories: 1 imagen o 1 video por story
 * - Facebook Stories: 1 imagen o 1 video por story
 * 
 * POLL (Encuesta interactiva):
 * - Twitter: Encuesta con texto y hasta 4 opciones
 * - Facebook: Encuesta con texto y opciones
 * - Instagram Stories: Encuesta en story (1 imagen/video de fondo)
 * 
 * CAROUSEL (Múltiples imágenes/slides):
 * - Instagram: 2-10 imágenes y/o videos mezclados
 * - LinkedIn: 2-10 imágenes (documento carousel)
 * - Pinterest: Idea Pins con múltiples imágenes/videos
 */
const contentTypes: ContentTypeOption[] = [
  {
    value: 'post',
    label: 'Post',
    description: 'Imagen, video o álbum',
    icon: FileText,
    platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'],
    mediaRules: {
      maxImages: 10, // Instagram permite hasta 10 en carousel
      maxVideos: 1,
      allowMixed: true, // Permite mezclar en carousel
    }
  },
  {
    value: 'reel',
    label: 'Reel/Short',
    description: 'Solo 1 video vertical',
    icon: Video,
    platforms: [...REEL_COMPATIBLE_PLATFORMS],
    mediaRules: {
      maxVideos: 1,
      videoOnly: true, // Solo permite video
    }
  },
  {
    value: 'story',
    label: 'Story',
    description: '1 imagen o video (24h)',
    icon: Clock,
    platforms: ['instagram', 'facebook'],
    mediaRules: {
      maxImages: 1,
      maxVideos: 1,
      allowMixed: false, // Solo uno u otro
    }
  },
  {
    value: 'poll',
    label: 'Poll',
    description: 'Encuesta interactiva',
    icon: BarChart3,
    platforms: ['twitter'], // Solo Twitter soporta encuestas nativas
    mediaRules: {
      maxImages: 1, // Opcional: imagen de fondo en Instagram story poll
      maxVideos: 0,
    }
  },
  {
    value: 'carousel',
    label: 'Carousel',
    description: '2-10 imágenes/videos',
    icon: Images,
    platforms: ['instagram', 'linkedin', 'pinterest'],
    mediaRules: {
      minCount: 2,
      maxCount: 10,
      maxImages: 10,
      maxVideos: 10,
      allowMixed: true, // Instagram permite mezclar
    }
  },
];

export default function ContentTypeSelector({
  selectedType,
  selectedPlatforms,
  onChange,
  t,
  mediaFiles,
}: ContentTypeSelectorProps) {
  
  // Filter content types based on selected platforms
  const availableTypes = useMemo(() => {
    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      return contentTypes;
    }

    return contentTypes.filter(type => {
      // Check if ALL selected platforms support this content type
      return selectedPlatforms.every(platform => 
        type.platforms.includes(platform.toLowerCase())
      );
    });
  }, [selectedPlatforms]);

  // Get selected type details for info panel
  const selectedTypeDetails = useMemo(() => {
    return contentTypes.find(type => type.value === selectedType);
  }, [selectedType]);

  // Check if type is locked due to media upload
  const isTypeLocked = mediaFiles && mediaFiles.length > 0;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {t("publications.modal.contentType.label") || "Content Type"}
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Columna 1: Selector de tipos */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {availableTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;
              const isAvailable = selectedPlatforms.length === 0 || 
                selectedPlatforms.some(p => type.platforms.includes(p.toLowerCase()));

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => isAvailable && !isTypeLocked && onChange(type.value)}
                  disabled={!isAvailable || isTypeLocked}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all duration-200
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-gray-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }
                    ${!isAvailable || isTypeLocked
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
                        w-5 h-5 transition-colors
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
          
          {isTypeLocked && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <span className="text-amber-600 dark:text-amber-400 text-xs">
                🔒 {t("publications.modal.contentType.locked") || "Content type is locked after uploading media"}
              </span>
            </div>
          )}
        </div>

        {/* Columna 2: Información del tipo seleccionado */}
        {selectedTypeDetails && (
          <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {t("publications.modal.contentType.rules") || "Content Rules"}
            </h4>
            
            <div className="space-y-3 text-sm">
              {/* Reglas de medios */}
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("publications.modal.contentType.mediaAllowed") || "Media Allowed:"}
                </p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  {selectedTypeDetails.mediaRules.videoOnly && (
                    <li>• Solo 1 video</li>
                  )}
                  {selectedTypeDetails.mediaRules.imageOnly && (
                    <li>• Solo imágenes</li>
                  )}
                  {!selectedTypeDetails.mediaRules.videoOnly && !selectedTypeDetails.mediaRules.imageOnly && (
                    <>
                      {selectedTypeDetails.mediaRules.maxImages && selectedTypeDetails.mediaRules.maxImages > 0 && (
                        <li>• Hasta {selectedTypeDetails.mediaRules.maxImages} imagen{selectedTypeDetails.mediaRules.maxImages > 1 ? 'es' : ''}</li>
                      )}
                      {selectedTypeDetails.mediaRules.maxVideos && selectedTypeDetails.mediaRules.maxVideos > 0 && (
                        <li>• Hasta {selectedTypeDetails.mediaRules.maxVideos} video{selectedTypeDetails.mediaRules.maxVideos > 1 ? 's' : ''}</li>
                      )}
                      {selectedTypeDetails.mediaRules.allowMixed && (
                        <li className="text-primary-600 dark:text-primary-400">• Permite mezclar imágenes y videos</li>
                      )}
                    </>
                  )}
                </ul>
              </div>

              {/* Plataformas compatibles */}
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("publications.modal.contentType.platforms") || "Platforms:"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedTypeDetails.platforms.map(platform => (
                    <span 
                      key={platform}
                      className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${selectedPlatforms.includes(platform)
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-gray-400'
                        }
                      `}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notas especiales por tipo */}
              {selectedType === 'reel' && (
                <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    💡 Los Reels/Shorts deben ser videos verticales (9:16) de corta duración
                  </p>
                </div>
              )}
              {selectedType === 'story' && (
                <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    💡 Las Stories desaparecen después de 24 horas
                  </p>
                </div>
              )}
              {selectedType === 'carousel' && (
                <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    💡 Los carousels requieren mínimo 2 elementos
                  </p>
                </div>
              )}
              {selectedType === 'poll' && (
                <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    💡 Las encuestas permiten interacción directa con tu audiencia
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export media rules for use in MediaUploadSection
export function getMediaRulesForContentType(contentType: ContentType) {
  const type = contentTypes.find(t => t.value === contentType);
  return type?.mediaRules || {
    maxImages: 10,
    maxVideos: 1,
    allowMixed: true,
  };
}

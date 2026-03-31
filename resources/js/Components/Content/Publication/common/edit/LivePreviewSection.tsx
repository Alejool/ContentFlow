import { type ContentType } from '@/Components/Content/Publication/common/ContentTypeSelector';
import { FacebookPreview } from '@/Components/Content/Publication/previews/FacebookPreview';
import { InstagramPreview } from '@/Components/Content/Publication/previews/InstagramPreview';
import { LinkedInPreview } from '@/Components/Content/Publication/previews/LinkedInPreview';
import { ThreadsPreview } from '@/Components/Content/Publication/previews/ThreadsPreview';
import { TikTokPreview } from '@/Components/Content/Publication/previews/TikTokPreview';
import { TwitterPreview } from '@/Components/Content/Publication/previews/TwitterPreview';
import { YouTubePreview } from '@/Components/Content/Publication/previews/YouTubePreview';
import { REEL_COMPATIBLE_PLATFORMS } from '@/Constants/contentTypes';
import { SOCIAL_PLATFORMS } from '@/Constants/socialPlatformsConfig';
import { AtSign, Facebook, Instagram, Linkedin, Music2, Twitter, Youtube } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const EmbeddedPost = ({ platform, url }: { platform: string; url: string }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando publicación...</p>
      </div>
    );
  }

  switch (platform) {
    case 'twitter':
      const tweetId = url.split('/status/')[1]?.split('?')[0];
      return (
        <iframe
          src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light`}
          className="h-[600px] w-full max-w-[550px] border-0"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      );

    case 'instagram':
      const igUrl = url.endsWith('/') ? url : `${url}/`;
      return (
        <iframe
          src={`${igUrl}embed`}
          className="h-[700px] w-full max-w-[540px] overflow-hidden border-0"
          scrolling="no"
          allowtransparency="true"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      );

    case 'facebook':
      return (
        <div className="space-y-3 py-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Publicación de Facebook
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Facebook no permite previsualizar posts embebidos desde localhost o dominios no
                verificados
              </p>
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1877f2] px-4 py-2 text-white transition-colors hover:bg-[#166fe5]"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Ver en Facebook
          </a>
        </div>
      );

    case 'youtube':
      const videoId = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/,
      )?.[1];
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="aspect-video w-full max-w-[640px] rounded-lg border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
          allowFullScreen
        />
      );

    case 'tiktok':
      return (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${url.split('/video/')[1]?.split('?')[0]}`}
          className="h-[730px] w-full max-w-[325px] border-0"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          allowFullScreen
        />
      );

    case 'linkedin':
      return (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            LinkedIn no permite embeber publicaciones directamente.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0077b5] px-4 py-2 text-white transition-colors hover:bg-[#006399]"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            Ver en LinkedIn
          </a>
        </div>
      );

    default:
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vista previa no disponible para esta plataforma
        </p>
      );
  }
};

interface LivePreviewSectionProps {
  content: string;
  mediaUrls: string[];
  user?: {
    name: string;
    username: string;
    avatar?: string;
    headline?: string;
  };
  publishedLinks?: Record<string, string>;
  className?: string;
  title?: string;
  publishedAt?: string;
  contentType?: ContentType; // Nuevo: tipo de contenido para filtrar plataformas
  selectedPlatforms?: string[]; // Nuevo: plataformas seleccionadas por el usuario
  pollOptions?: string[]; // Nuevo: opciones de encuesta
  pollDuration?: number; // Nuevo: duración de encuesta
}

type Platform =
  | 'twitter'
  | 'instagram'
  | 'threads'
  | 'linkedin'
  | 'facebook'
  | 'tiktok'
  | 'youtube';

export const LivePreviewSection = ({
  content,
  mediaUrls,
  user,
  publishedLinks,
  className,
  title,
  publishedAt,
  contentType = 'post',
  selectedPlatforms = [],
  pollOptions = [],
  pollDuration = 24,
}: LivePreviewSectionProps) => {
  const { t } = useTranslation();

  // Obtener plataformas compatibles con el tipo de contenido
  const compatiblePlatforms = useMemo(() => {
    const contentTypes = [
      {
        value: 'post',
        platforms: [
          'instagram',
          'threads',
          'twitter',
          'facebook',
          'linkedin',
          'youtube',
          'pinterest',
        ],
      },
      {
        value: 'reel',
        platforms: [...REEL_COMPATIBLE_PLATFORMS],
      },
      {
        value: 'story',
        platforms: ['instagram', 'facebook'],
      },
      {
        value: 'poll',
        platforms: ['twitter', 'threads'],
      },
      {
        value: 'carousel',
        platforms: ['instagram', 'threads', 'facebook', 'linkedin'],
      },
    ];

    const type = contentTypes.find((t) => t.value === contentType);
    return type?.platforms || [];
  }, [contentType]);

  const tabs = useMemo(() => {
    const allTabs: { id: Platform; label: string; icon: any }[] = [
      { id: 'twitter', label: 'Twitter', icon: Twitter },
      { id: 'instagram', label: 'Instagram', icon: Instagram },
      { id: 'threads', label: 'Threads', icon: AtSign },
      { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
      { id: 'facebook', label: 'Facebook', icon: Facebook },
      { id: 'youtube', label: 'YouTube', icon: Youtube },
      { id: 'tiktok', label: 'TikTok', icon: Music2 },
    ];

    return allTabs.filter((tab) => {
      const config = (SOCIAL_PLATFORMS as any)[tab.id];
      const isActive = config?.active === true;

      // Filtrar por tipo de contenido
      const isCompatible = compatiblePlatforms.includes(tab.id);

      // Si hay plataformas seleccionadas, solo mostrar esas
      const isSelected =
        selectedPlatforms.length === 0 || selectedPlatforms.some((p) => p.toLowerCase() === tab.id);

      return isActive && isCompatible && isSelected;
    });
  }, [compatiblePlatforms, selectedPlatforms]);

  const [activePlatform, setActivePlatform] = useState<Platform>(
    tabs.length > 0 ? tabs[0].id : 'twitter',
  );

  // Actualizar plataforma activa si ya no es válida
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.id === activePlatform)) {
      setActivePlatform(tabs[0].id);
    }
  }, [tabs, activePlatform]);

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-neutral-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const hasPublishedLink = publishedLinks && publishedLinks[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePlatform(tab.id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all duration-200 ${
                activePlatform === tab.id
                  ? 'bg-white text-primary-600 shadow-sm dark:bg-neutral-700 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {hasPublishedLink && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-white bg-green-500 dark:border-neutral-800" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px] rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50">
        {publishedLinks && publishedLinks[activePlatform] ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Publicado en {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}
                  </span>
                </div>
                <a
                  href={publishedLinks[activePlatform]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Abrir en {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}
                </a>
              </div>
            </div>
            <div className="flex min-h-[500px] items-center justify-center rounded-lg bg-white p-4 dark:bg-neutral-800">
              <EmbeddedPost platform={activePlatform} url={publishedLinks[activePlatform]} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {activePlatform === 'twitter' && (
              <TwitterPreview
                content={content}
                mediaUrls={mediaUrls}
                user={user}
                contentType={contentType}
                pollOptions={pollOptions}
                pollDuration={pollDuration}
              />
            )}
            {activePlatform === 'instagram' && (
              <InstagramPreview content={content} mediaUrls={mediaUrls} user={user} />
            )}
            {activePlatform === 'threads' && (
              <ThreadsPreview content={content} mediaUrls={mediaUrls} user={user} />
            )}
            {activePlatform === 'linkedin' && (
              <LinkedInPreview content={content} mediaUrls={mediaUrls} user={user} />
            )}
            {activePlatform === 'facebook' && (
              <FacebookPreview
                content={content}
                mediaUrls={mediaUrls}
                user={user}
                publishedAt={publishedAt}
                contentType={contentType}
                pollOptions={pollOptions}
                pollDuration={pollDuration}
              />
            )}
            {activePlatform === 'tiktok' && (
              <TikTokPreview content={content} mediaUrls={mediaUrls} user={user} />
            )}
            {activePlatform === 'youtube' && (
              <YouTubePreview
                content={content}
                mediaUrls={mediaUrls}
                user={user}
                title={title}
                publishedAt={publishedAt}
              />
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        {t('publications.modal.preview.disclaimer') ||
          'Preview is an approximation. Actual appearance may vary by platform.'}
      </p>
    </div>
  );
};

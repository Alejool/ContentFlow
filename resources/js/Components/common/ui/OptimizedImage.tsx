import { useEffect, useRef, useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  eager?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  fallbackSrc,
  eager = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Preload de la imagen
    const preloadImage = new Image();

    // Timeout de 5 segundos para evitar carga infinita
    timeoutRef.current = setTimeout(() => {
      if (status === 'loading') {
        setStatus('error');
        if (fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.();
      }
    }, 5000);

    preloadImage.onload = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus('loaded');
      onLoad?.();
    };

    preloadImage.onerror = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setStatus('loading');
      } else {
        setStatus('error');
        onError?.();
      }
    };

    // Si es eager, cargar inmediatamente
    if (eager) {
      preloadImage.src = currentSrc;
      return;
    }

    // Lazy loading con IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadImage.src = currentSrc;
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Cargar 50px antes de que sea visible
      },
    );

    observerRef.current.observe(img);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      observerRef.current?.disconnect();
    };
  }, [currentSrc, eager, fallbackSrc, onError, onLoad, status]);

  // Si hay error y no hay fallback, no mostrar nada
  if (status === 'error' && !fallbackSrc) {
    return null;
  }

  return (
    <div className="relative">
      {status === 'loading' && (
        <div className="absolute inset-0 overflow-hidden rounded bg-gray-200 dark:bg-neutral-700">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        </div>
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`transition-opacity duration-300 ${
          status === 'loading' ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        style={{
          display: status === 'error' && !fallbackSrc ? 'none' : undefined,
        }}
      />
    </div>
  );
}

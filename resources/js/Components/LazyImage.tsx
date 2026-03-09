import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Lazy loading image component with Intersection Observer
 * Supports responsive images (srcset) and WebP/AVIF formats
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  srcSet,
  sizes,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      srcSet={isInView ? srcSet : undefined}
      sizes={isInView ? sizes : undefined}
      alt={alt}
      className={`lazy-image ${className} ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
};

interface ResponsiveImageProps {
  mediaId: number;
  alt: string;
  className?: string;
  sizes?: string;
}

/**
 * Responsive image component with automatic format selection
 * Serves WebP/AVIF with JPEG fallback
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  mediaId,
  alt,
  className,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
}) => {
  const [imageData, setImageData] = useState<any>(null);

  useEffect(() => {
    // Fetch image derivatives from API
    fetch(`/api/media/${mediaId}/derivatives`)
      .then((res) => res.json())
      .then((data) => setImageData(data))
      .catch((err) => console.error('Failed to load image data:', err));
  }, [mediaId]);

  if (!imageData) {
    return <div className="skeleton-image" />;
  }

  // Build srcset for different formats
  const webpSrcSet = imageData.derivatives
    ?.filter((d: any) => d.format === 'webp')
    .map((d: any) => `${d.url} ${d.width}w`)
    .join(', ');

  const avifSrcSet = imageData.derivatives
    ?.filter((d: any) => d.format === 'avif')
    .map((d: any) => `${d.url} ${d.width}w`)
    .join(', ');

  const jpegSrcSet = imageData.derivatives
    ?.filter((d: any) => d.format === 'jpeg')
    .map((d: any) => `${d.url} ${d.width}w`)
    .join(', ');

  return (
    <picture>
      {avifSrcSet && (
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
      )}
      {webpSrcSet && (
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      )}
      <LazyImage
        src={imageData.fallback_url}
        srcSet={jpegSrcSet}
        sizes={sizes}
        alt={alt}
        className={className}
      />
    </picture>
  );
};

/**
 * Progressive image loading with blur-up effect
 */
export const ProgressiveImage: React.FC<{
  src: string;
  placeholder: string;
  alt: string;
  className?: string;
}> = ({ src, placeholder, alt, className }) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div className={`progressive-image-container ${className || ''}`}>
      <img
        src={currentSrc}
        alt={alt}
        className={`progressive-image ${isLoaded ? 'loaded' : 'loading'}`}
        style={{
          filter: isLoaded ? 'none' : 'blur(10px)',
          transition: 'filter 0.3s ease-out',
        }}
      />
    </div>
  );
};

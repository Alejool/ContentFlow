import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
  src?: string | null;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
  loading?: "lazy" | "eager";
  showLoader?: boolean;
  loaderClassName?: string;
}

/**
 * Componente de imagen con carga lazy, fallback automático y animaciones suaves
 *
 * Características:
 * - Lazy loading nativo del navegador
 * - Fallback automático si la imagen falla
 * - Animación de fade-in al cargar
 * - Loader opcional mientras carga
 * - Manejo de errores robusto
 */
export function LazyImage({
  src,
  fallbackSrc = "/images/placeholder.png",
  alt,
  className = "",
  onError,
  onLoad,
  loading = "lazy",
  showLoader = true,
  loaderClassName = "",
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(src || null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasFallbackFailed = useRef(false);

  // Actualizar src cuando cambie la prop
  useEffect(() => {
    if (src !== imageSrc && !hasError) {
      setImageSrc(src || null);
      setIsLoading(true);
      setHasError(false);
      hasFallbackFailed.current = false;
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    // Si ya falló el fallback, no intentar más
    if (hasFallbackFailed.current) {
      setIsLoading(false);
      setHasError(true);
      onError?.();
      return;
    }

    // Si la imagen actual es el fallback, marcar como fallado
    if (imageSrc === fallbackSrc) {
      hasFallbackFailed.current = true;
      setIsLoading(false);
      setHasError(true);
      onError?.();
      return;
    }

    // Intentar cargar el fallback
    setImageSrc(fallbackSrc);
    setHasError(false);
  };

  // Si no hay src y no hay fallback, mostrar error
  if (!imageSrc && !fallbackSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 ${className}`}
      >
        <span className="text-xs text-neutral-400 dark:text-neutral-600">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loader mientras carga */}
      {showLoader && isLoading && !hasError && (
        <div
          className={`absolute inset-0 flex animate-pulse items-center justify-center bg-neutral-100 dark:bg-neutral-800 ${loaderClassName}`}
        >
          <div className="border-3 h-8 w-8 animate-spin rounded-full border-primary-200 border-t-primary-600"></div>
        </div>
      )}

      {/* Imagen */}
      <img
        ref={imgRef}
        src={imageSrc || fallbackSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`h-full w-full object-cover transition-opacity duration-300 ease-in-out ${isLoading ? "opacity-0" : "opacity-100"} ${hasError ? "hidden" : ""} `}
      />

      {/* Fallback visual si todo falla */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
          <svg
            className="h-1/3 w-1/3 text-neutral-300 dark:text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

import { Briefcase, Crown, Heart, Smile, Sparkles, Star, User, Zap } from 'lucide-react';
import { useState } from 'react';

interface UnifiedAvatarProps {
  src?: string | null;
  defaultIcon?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  imageClassName?: string;
  showStatus?: boolean;
  statusColor?: string;
  loading?: 'lazy' | 'eager';
  fallbackStrategy?: 'initials' | 'none';
}

// Iconos disponibles por defecto
const DEFAULT_ICONS = {
  user: User,
  briefcase: Briefcase,
  smile: Smile,
  star: Star,
  heart: Heart,
  zap: Zap,
  crown: Crown,
  sparkles: Sparkles,
};

export function UnifiedAvatar({
  src,
  defaultIcon,
  name = 'User',
  size = 'md',
  className = '',
  imageClassName = 'object-cover',
  showStatus = false,
  statusColor = 'bg-emerald-500',
  loading = 'lazy',
  fallbackStrategy = 'initials',
}: UnifiedAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Si la imagen tarda más de 5s, caer a iniciales
  const handleImageRef = (img: HTMLImageElement | null) => {
    if (!img) return;
    const timer = setTimeout(() => {
      if (!imageLoaded) setImageError(true);
    }, 5000);
    img.addEventListener('load', () => clearTimeout(timer), { once: true });
    img.addEventListener('error', () => clearTimeout(timer), { once: true });
  };
  const sizeClasses = {
    xs: 'w-6 h-6 text-2xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
    none: '', // Para custom sizes
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 48,
    none: 24,
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContent = () => {
    // Si hay foto y no ha fallado, intentar mostrarla
    if (src && !imageError) {
      return (
        <>
          {/* Skeleton shimmer mientras carga */}
          {!imageLoaded && (
            <div className="absolute inset-0 overflow-hidden bg-gray-200 dark:bg-neutral-700">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
            </div>
          )}

          {/* Imagen con lazy loading */}
          <img
            src={src}
            alt={name}
            loading={loading}
            ref={handleImageRef}
            className={`h-full w-full transition-opacity duration-300 ${imageClassName} ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        </>
      );
    }

    // Si hay icono por defecto seleccionado, mostrarlo
    if (defaultIcon && DEFAULT_ICONS[defaultIcon as keyof typeof DEFAULT_ICONS]) {
      const IconComponent = DEFAULT_ICONS[defaultIcon as keyof typeof DEFAULT_ICONS];
      return (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <IconComponent size={iconSizes[size]} />
        </div>
      );
    }

    // Si no hay nada o falló la imagen, mostrar iniciales
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 font-bold text-white">
        {getInitials(name)}
      </div>
    );
  };

  if (imageError && fallbackStrategy === 'none') return null;
  if (!src && !defaultIcon && fallbackStrategy === 'none') return null;

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size as keyof typeof sizeClasses]} relative flex items-center justify-center overflow-hidden ${size !== 'none' ? 'rounded-full' : 'w-full h-full'}`}
      >
        {renderContent()}
      </div>
      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 ${
            size === 'xs' || size === 'sm'
              ? 'h-2 w-2'
              : size === 'md' || size === 'lg'
                ? 'h-3 w-3'
                : 'h-4 w-4'
          } ${statusColor} rounded-full border-2 border-white shadow-sm dark:border-neutral-900`}
        ></div>
      )}
    </div>
  );
}

export { DEFAULT_ICONS };

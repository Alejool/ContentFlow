import { UnifiedAvatar } from '@/Components/common/UnifiedAvatar';

interface AvatarProps {
  src?: string | null;
  defaultIcon?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
  className?: string;
  imageClassName?: string;
  showStatus?: boolean;
  statusColor?: string;
  loading?: 'lazy' | 'eager';
  fallbackStrategy?: 'initials' | 'none';
}

export function Avatar({
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
}: AvatarProps) {
  return (
    <UnifiedAvatar
      {...(src !== undefined && { src })}
      {...(defaultIcon !== undefined && { defaultIcon })}
      name={name}
      size={size as any}
      className={className}
      imageClassName={imageClassName}
      showStatus={showStatus}
      statusColor={statusColor}
      loading={loading}
      fallbackStrategy={fallbackStrategy}
    />
  );
}

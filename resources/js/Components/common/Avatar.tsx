import { UnifiedAvatar } from '@/Components/common/UnifiedAvatar';

interface AvatarProps {
  src?: string | null;
  defaultIcon?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showStatus?: boolean;
  statusColor?: string;
  loading?: 'lazy' | 'eager';
}

export function Avatar({
  src,
  defaultIcon,
  name = 'User',
  size = 'md',
  className = '',
  showStatus = false,
  statusColor = 'bg-emerald-500',
  loading = 'lazy',
}: AvatarProps) {
  return (
    <UnifiedAvatar
      {...(src !== undefined && { src })}
      {...(defaultIcon !== undefined && { defaultIcon })}
      name={name}
      size={size}
      className={className}
      showStatus={showStatus}
      statusColor={statusColor}
      loading={loading}
    />
  );
}

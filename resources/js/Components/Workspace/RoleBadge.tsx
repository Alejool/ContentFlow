import { getRoleBadgeClass, getRoleConfig } from '@/Utils/roleHelpers';

interface RoleBadgeProps {
  role: any;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1.5 text-xs',
  lg: 'px-4 py-2 text-sm',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

const RoleBadge = ({ role, showIcon = false, size = 'md' }: RoleBadgeProps) => {
  const roleSlug = role?.slug || 'member';
  const config = getRoleConfig(roleSlug);
  const Icon = config.icon;
  const badgeClass = getRoleBadgeClass(roleSlug);

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-full font-semibold uppercase tracking-wider shadow-sm ${badgeClass}`}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {role?.name || 'Member'}
    </span>
  );
};

export default RoleBadge;

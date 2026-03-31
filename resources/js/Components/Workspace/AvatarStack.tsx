import { UnifiedAvatar } from '@/Components/common/UnifiedAvatar';
import { Users } from 'lucide-react';

interface AvatarStackProps {
  users: any[];
  roles: any[];
  max?: number;
  className?: string;
}

const AvatarStack = ({ users, roles, max = 4, className = '' }: AvatarStackProps) => {
  const displayUsers = Array.isArray(users) ? users.slice(0, max) : [];
  const remaining = users.length > max ? users.length - max : 0;

  return (
    <div className={`flex -space-x-2 overflow-hidden py-1 ${className}`}>
      {displayUsers.map((user) => {
        const roleId = user.pivot?.role_id;
        const role = roles.find((r) => r.id === roleId);
        const roleName = role ? role.name : 'Member';

        return (
          <div
            key={user.id}
            className="group relative inline-block cursor-help rounded-full ring-2 ring-white transition-all duration-200 hover:z-10 hover:scale-110 dark:ring-neutral-900"
            title={`${user.name} - ${roleName}`}
          >
            <UnifiedAvatar
              src={user.photo_url}
              defaultIcon={user.default_avatar_icon}
              name={user.name}
              size="sm"
              showStatus={true}
            />
          </div>
        );
      })}
      {remaining > 0 && (
        <div
          className="flex h-8 w-8 cursor-help items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-bold text-gray-600 ring-2 ring-white transition-transform duration-200 hover:scale-110 dark:from-neutral-800 dark:to-neutral-700 dark:text-gray-400 dark:ring-neutral-900"
          title={`${remaining} more members`}
        >
          +{remaining}
        </div>
      )}
      {users.length === 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-white dark:from-neutral-800 dark:to-neutral-700 dark:ring-neutral-900">
          <Users className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default AvatarStack;

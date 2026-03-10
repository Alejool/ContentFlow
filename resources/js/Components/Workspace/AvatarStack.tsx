import { UnifiedAvatar } from "@/Components/common/UnifiedAvatar";

interface AvatarStackProps {
  users: any[];
  roles: any[];
  max?: number;
  className?: string;
}

const AvatarStack = ({
  users,
  roles,
  max = 4,
  className = "",
}: AvatarStackProps) => {
  const displayUsers = Array.isArray(users) ? users.slice(0, max) : [];
  const remaining = users.length > max ? users.length - max : 0;

  return (
    <div className={`flex -space-x-2 overflow-hidden py-1 ${className}`}>
      {displayUsers.map((user) => {
        const roleId = user.pivot?.role_id;
        const role = roles.find((r) => r.id === roleId);
        const roleName = role ? role.name : "Member";

        return (
          <div
            key={user.id}
            className="relative inline-block ring-2 ring-white dark:ring-neutral-900 rounded-full cursor-help hover:scale-110 hover:z-10 transition-all duration-200 group"
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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700 ring-2 ring-white dark:ring-neutral-900 text-xs font-bold text-gray-600 dark:text-gray-400 hover:scale-110 transition-transform duration-200 cursor-help"
          title={`${remaining} more members`}
        >
          +{remaining}
        </div>
      )}
      {users.length === 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700 ring-2 ring-white dark:ring-neutral-900">
          <Users className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default AvatarStack;

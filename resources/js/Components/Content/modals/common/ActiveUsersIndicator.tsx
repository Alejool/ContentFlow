import { Lock } from "lucide-react";

interface LockInfo {
  user_id?: number;
}

interface ActiveUsersIndicatorProps {
  activeUsers: any[];
  lockInfo: LockInfo | null;
}

export const ActiveUsersIndicator = ({
  activeUsers,
  lockInfo,
}: ActiveUsersIndicatorProps) => {
  return (
    <div className="flex -space-x-2 overflow-hidden mr-2 p-2">
      {activeUsers.map((user: any) => {
        const isTheLocker = lockInfo?.user_id === user.id;
        return (
          <div
            key={user.id}
            className={`inline-block h-7 w-7 rounded-full ring-2 ${isTheLocker ? "ring-amber-500 z-10" : "ring-white dark:ring-neutral-800"} bg-gray-200 dark:bg-neutral-700 flex-shrink-0 relative`}
            title={user.name + (isTheLocker ? " (Editando)" : " (Viendo)")}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                loading="lazy"
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  // Si falla, mostrar iniciales
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement("div");
                    fallback.className =
                      "h-full w-full flex items-center justify-center text-xs font-bold text-gray-500 uppercase";
                    fallback.textContent = user.name.charAt(0);
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                {user.name.charAt(0)}
              </div>
            )}
            {isTheLocker && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5 shadow-sm">
                <Lock className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

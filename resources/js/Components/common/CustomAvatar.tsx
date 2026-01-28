import { useTheme } from "@/Hooks/useTheme";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
  status?: "online" | "offline" | "busy" | "away";
}

export default function Avatar({
  src,
  name = "User",
  size = "md",
  className = "",
  showStatus = false,
  status = "online",
}: AvatarProps) {
  const { theme } = useTheme();

  const getInitials = (name: string) => {
    if (!name.trim()) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-24 h-24 text-2xl",
  };

  const statusColors = {
    online: theme === "dark" ? "bg-green-500" : "bg-green-400",
    offline: theme === "dark" ? "bg-gray-400" : "bg-gray-300",
    busy: theme === "dark" ? "bg-primary-500" : "bg-primary-400",
    away: theme === "dark" ? "bg-yellow-500" : "bg-yellow-400",
  };

  const avatarBgClass =
    theme === "dark"
      ? "bg-gradient-to-br from-primary-900/30 to-purple-900/30"
      : "bg-gradient-to-br from-primary-100 to-purple-100";

  const avatarTextClass =
    theme === "dark" ? "text-primary-200" : "text-primary-800";

  const borderClass =
    theme === "dark" ? "ring-2 ring-purple-900/50" : "ring-2 ring-green-200";

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} ${borderClass} ${avatarBgClass} rounded-full overflow-hidden flex items-center justify-center font-bold shadow-lg`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = document.createElement("div");
              fallback.className = `w-full h-full flex items-center justify-center ${avatarTextClass}`;
              fallback.textContent = getInitials(name);
              e.currentTarget.parentElement?.appendChild(fallback);
            }}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${avatarTextClass}`}
          >
            {getInitials(name)}
          </div>
        )}
      </div>

      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 ${
            size === "2xl" || size === "xl" ? "w-4 h-4" : ""
          } rounded-full border-2 ${
            theme === "dark" ? "border-neutral-800" : "border-white"
          } ${statusColors[status]}`}
        ></div>
      )}
    </div>
  );
}

import { useTheme } from "@/Hooks/useTheme";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
  statusColor?: string;
}

export function Avatar({
  src,
  name = "User",
  size = "md",
  className = "",
  showStatus = false,
  statusColor = "bg-emerald-500",
}: AvatarProps) {
  const { theme } = useTheme();

  const getInitials = (name: string) => {
    if (!name.trim()) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-24 h-24 text-2xl",
  };

  const avatarBgClass =
    theme === "dark"
      ? "bg-gradient-to-br from-primary-900/30 to-purple-900/30"
      : "bg-gradient-to-br from-primary-100 to-purple-100";

  const avatarTextClass =
    theme === "dark" ? "text-primary-200" : "text-primary-800";

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} relative rounded-full overflow-hidden flex items-center justify-center font-bold shadow-lg ${avatarBgClass}`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = "none";
              const fallback = img.nextElementSibling as HTMLElement;
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`${src ? "hidden" : ""} w-full h-full flex items-center justify-center ${avatarTextClass} font-bold`}
        >
          {getInitials(name)}
        </div>
      </div>
      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 ${
            size === "xs" || size === "sm"
              ? "w-2 h-2"
              : size === "md" || size === "lg"
                ? "w-3 h-3"
                : "w-4 h-4"
          } ${statusColor} border-2 border-white dark:border-neutral-900 rounded-full shadow-sm`}
        ></div>
      )}
    </div>
  );
}

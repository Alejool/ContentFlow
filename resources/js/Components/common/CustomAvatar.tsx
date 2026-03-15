import { useTheme } from "@/Hooks/useTheme";
import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
  status?: "online" | "offline" | "busy" | "away";
  loading?: "lazy" | "eager";
}

export default function Avatar({
  src,
  name = "User",
  size = "md",
  className = "",
  showStatus = false,
  status = "online",
  loading = "lazy",
}: AvatarProps) {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const avatarTextClass = theme === "dark" ? "text-primary-200" : "text-primary-800";

  const borderClass = theme === "dark" ? "ring-2 ring-purple-900/50" : "ring-2 ring-green-200";

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} ${borderClass} ${avatarBgClass} flex items-center justify-center overflow-hidden rounded-full font-bold shadow-lg`}
      >
        {src && !imageError ? (
          <>
            {/* Loader mientras carga */}
            {!imageLoaded && (
              <div
                className={`absolute inset-0 flex items-center justify-center ${avatarBgClass} animate-pulse`}
              >
                <div
                  className={`border-2 ${theme === "dark" ? "border-primary-400/30 border-t-primary-400" : "border-primary-600/30 border-t-primary-600"} animate-spin rounded-full ${
                    size === "xs"
                      ? "h-3 w-3"
                      : size === "sm"
                        ? "h-4 w-4"
                        : size === "md"
                          ? "h-5 w-5"
                          : size === "lg"
                            ? "h-6 w-6"
                            : size === "xl"
                              ? "h-8 w-8"
                              : "h-10 w-10"
                  }`}
                ></div>
              </div>
            )}

            <img
              src={src}
              alt={name}
              loading={loading}
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          </>
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${avatarTextClass}`}>
            {getInitials(name)}
          </div>
        )}
      </div>

      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 h-3 w-3 ${
            size === "2xl" || size === "xl" ? "h-4 w-4" : ""
          } rounded-full border-2 ${
            theme === "dark" ? "border-neutral-800" : "border-white"
          } ${statusColors[status]}`}
        ></div>
      )}
    </div>
  );
}

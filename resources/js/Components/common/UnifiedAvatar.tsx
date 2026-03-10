import defaultProfile from "@/../assets/profile-default.svg";
import { User, Briefcase, Smile, Star, Heart, Zap, Crown, Sparkles } from "lucide-react";

interface UnifiedAvatarProps {
  src?: string | null;
  defaultIcon?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
  statusColor?: string;
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
  name = "User",
  size = "md",
  className = "",
  showStatus = false,
  statusColor = "bg-emerald-500",
}: UnifiedAvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-24 h-24 text-2xl",
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    "2xl": 48,
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContent = () => {
    // Si hay foto, mostrarla
    if (src) {
      return (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== defaultProfile) {
              img.src = defaultProfile;
            }
          }}
        />
      );
    }

    // Si hay icono por defecto seleccionado, mostrarlo
    if (defaultIcon && DEFAULT_ICONS[defaultIcon as keyof typeof DEFAULT_ICONS]) {
      const IconComponent = DEFAULT_ICONS[defaultIcon as keyof typeof DEFAULT_ICONS];
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <IconComponent size={iconSizes[size]} />
        </div>
      );
    }

    // Si no hay nada, mostrar iniciales
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold">
        {getInitials(name)}
      </div>
    );
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} relative rounded-full overflow-hidden flex items-center justify-center`}
      >
        {renderContent()}
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

export { DEFAULT_ICONS };

import { Link } from "@inertiajs/react";
import { useTheme } from "@/Hooks/useTheme";
import { ArrowRight, LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  buttonText: string;
  icon?: LucideIcon | string;
  bgColor?: string;
  iconColor?: string;
  variant?: "default" | "gradient" | "outline";
  className?: string;
}

export default function DashboardCard({
  title,
  description,
  href,
  buttonText,
  icon: Icon,
  bgColor,
  iconColor,
  variant = "default",
  className = "",
}: DashboardCardProps) {
  const { theme } = useTheme();

  // Determinar colores según el tema
  const getCardBgColor = () => {
    if (bgColor) return bgColor;

    if (theme === "dark") {
      switch (variant) {
        case "gradient":
          return "bg-gradient-to-br from-neutral-800/80 to-neutral-900/80";
        case "outline":
          return "bg-transparent";
        default:
          return "bg-neutral-800/50";
      }
    } else {
      switch (variant) {
        case "gradient":
          return "bg-gradient-to-br from-orange-50/80 to-pink-50/80";
        case "outline":
          return "bg-transparent";
        default:
          return "bg-white";
      }
    }
  };

  const getCardBorder = () => {
    if (theme === "dark") {
      switch (variant) {
        case "outline":
          return "border border-neutral-700/70";
        case "gradient":
          return "border border-neutral-700/30";
        default:
          return "border border-neutral-700/50";
      }
    } else {
      switch (variant) {
        case "outline":
          return "border-2 border-gray-200";
        case "gradient":
          return "border border-orange-100/50";
        default:
          return "border border-gray-100";
      }
    }
  };

  const getIconBgColor = () => {
    if (theme === "dark") {
      return (
        iconColor || "bg-gradient-to-r from-orange-600/20 to-orange-800/20"
      );
    } else {
      return iconColor || "bg-gradient-to-r from-orange-100 to-orange-50";
    }
  };

  const getIconColor = () => {
    if (theme === "dark") {
      return "text-orange-400";
    } else {
      return "text-orange-600";
    }
  };

  const getTitleColor = () => {
    if (theme === "dark") {
      return "text-gray-100";
    } else {
      return "text-gray-900";
    }
  };

  const getDescriptionColor = () => {
    if (theme === "dark") {
      return "text-gray-400";
    } else {
      return "text-gray-600";
    }
  };

  const getButtonStyles = () => {
    const baseStyles =
      "group relative overflow-hidden transition-all duration-300";

    if (theme === "dark") {
      return `${baseStyles} bg-gradient-to-r from-orange-600 to-orange-800 text-white hover:from-orange-700 hover:to-orange-900`;
    } else {
      return `${baseStyles} bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800`;
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6 
        transition-all duration-300 
        hover:shadow-xl hover:-translate-y-1
        ${getCardBgColor()}
        ${getCardBorder()}
        ${className}
      `}
    >
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div
          className={`absolute -inset-1 bg-gradient-to-r ${
            theme === "dark"
              ? "from-orange-600/10 via-purple-600/5 to-pink-600/10"
              : "from-orange-200/20 via-pink-200/10 to-purple-200/20"
          } blur-xl`}
        ></div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Icono */}
        <div className="mb-6 flex justify-center">
          <div
            className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            ${getIconBgColor()}
            transition-transform duration-300 group-hover:scale-110
          `}
          >
            {typeof Icon === "string" ? (
              <span className={`text-3xl ${getIconColor()}`}>{Icon}</span>
            ) : Icon ? (
              <Icon className={`w-8 h-8 ${getIconColor()}`} />
            ) : (
              <div
                className={`w-8 h-8 rounded-full ${getIconColor()} bg-current opacity-20`}
              />
            )}
          </div>
        </div>

        {/* Título */}
        <h3
          className={`
          text-xl font-bold mb-3 text-center
          ${getTitleColor()}
        `}
        >
          {title}
        </h3>

        {/* Descripción */}
        <p
          className={`
          flex-1 text-center mb-6
          ${getDescriptionColor()}
        `}
        >
          {description}
        </p>

        {/* Botón */}
        <Link
          href={href}
          className={`
            inline-flex items-center justify-center gap-2 
            py-3 px-6 rounded-xl font-semibold text-sm
            ${getButtonStyles()}
          `}
        >
          <span className="relative z-10">{buttonText}</span>
          <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />

          {/* Efecto de brillo en el botón */}
          <div
            className={`
            absolute inset-0 -translate-x-full group-hover:translate-x-full 
            transition-transform duration-700
            ${
              theme === "dark"
                ? "bg-gradient-to-r from-transparent via-white/10 to-transparent"
                : "bg-gradient-to-r from-transparent via-white/20 to-transparent"
            }
          `}
          ></div>
        </Link>
      </div>

      {/* Indicador de esquina */}
      <div
        className={`
        absolute top-0 right-0 w-16 h-16 
        overflow-hidden pointer-events-none
      `}
      >
        <div
          className={`
          absolute top-0 right-0 w-32 h-32 
          transform rotate-45 translate-x-16 -translate-y-16
          ${
            theme === "dark"
              ? "bg-gradient-to-br from-orange-600/10 to-transparent"
              : "bg-gradient-to-br from-orange-600/5 to-transparent"
          }
        `}
        ></div>
      </div>
    </div>
  );
}

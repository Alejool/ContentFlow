import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { Mail, Shield, User } from "lucide-react";
import AccountStatistics from "./Partials/AccountStatistics";
import ConnectedAccounts from "./Partials/ConnectedAccounts";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

interface EditProps {
  mustVerifyEmail: boolean;
  status?: string;
}

// Componente Avatar personalizado sin Chakra
interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

function CustomAvatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-20 h-20 text-xl",
    "2xl": "w-24 h-24 text-2xl",
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-bold shadow-lg`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si la imagen falla, muestra las iniciales
              e.currentTarget.style.display = "none";
              const fallback =
                e.currentTarget.parentElement?.querySelector(
                  ".avatar-fallback"
                );
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`avatar-fallback ${
            src ? "hidden" : ""
          } w-full h-full flex items-center justify-center`}
        >
          {getInitials(name)}
        </div>
      </div>
    </div>
  );
}

export default function Edit({ mustVerifyEmail, status }: EditProps) {
  const user = usePage().props.auth.user;
  const { theme } = useTheme();

  const getAvatarColor = () => {
    if (theme === "dark") {
      return "bg-gradient-to-br from-primary-900/30 to-purple-900/30 text-primary-200 ring-4 ring-purple-900/50";
    }
    return "bg-gradient-to-br from-primary-100 to-purple-100 text-primary-800 ring-4 ring-green-200";
  };

  return (
    <AuthenticatedLayout
      header={
        <div
          className={`flex flex-col items-center justify-center py-8 transition-colors duration-300
        `}
        >
          <div className="relative">
            <div
              className={`${getAvatarColor()} w-24 h-24 rounded-full shadow-lg flex items-center justify-center`}
            >
              <CustomAvatar
                src={user.photo_url || user.avatar}
                name={user.name}
                size="2xl"
              />
            </div>
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
              <div
                className={`w-6 h-6 rounded-full border-4 shadow-sm animate-pulse
                ${
                  theme === "dark"
                    ? "bg-green-500 border-neutral-800"
                    : "bg-green-500 border-white"
                }
              `}
              ></div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <h2
              className={`text-2xl font-bold transition-colors
              ${theme === "dark" ? "text-white" : "text-gray-900"}
            `}
            >
              {user.name}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Mail
                className={`w-4 h-4 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <p
                className={`font-medium ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {user.email}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                ${
                  user.email_verified_at
                    ? theme === "dark"
                      ? "bg-green-900/30 text-green-300 border border-green-800/50"
                      : "bg-green-100 text-green-800 border border-green-200"
                    : theme === "dark"
                    ? "bg-yellow-900/30 text-yellow-300 border border-yellow-800/50"
                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                }
              `}
              >
                <Shield className="w-3 h-3" />
                {user.email_verified_at ? "Verificado" : "Sin verificar"}
              </div>

              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                ${
                  theme === "dark"
                    ? "bg-purple-900/30 text-purple-300 border border-purple-800/50"
                    : "bg-purple-100 text-purple-800 border border-purple-200"
                }
              `}
              >
                <User className="w-3 h-3" />
                Miembro desde: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Head title="Profile" />

      <div
        className={`py-12 min-h-screen transition-colors duration-300
        
      `}
      >
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-3">
              <UpdateProfileInformationForm
                mustVerifyEmail={mustVerifyEmail}
                status={status}
                className="h-auto"
              />
              <AccountStatistics status={status} />
            </div>

            <div className="space-y-3">
              <ConnectedAccounts />
              <UpdatePasswordForm className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

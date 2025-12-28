import AccountStatistics from "@/Components/profile/Partials/AccountStatistics";
import ConnectedAccounts from "@/Components/profile/Partials/ConnectedAccounts";
import UpdatePasswordForm from "@/Components/profile/Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "@/Components/profile/Partials/UpdateProfileInformationForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { Mail, Shield, User } from "lucide-react";

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
          className={`avatar-fallback ${src ? "hidden" : ""
            } w-full h-full flex items-center justify-center`}
        >
          {getInitials(name)}
        </div>
      </div>
    </div>
  );
}

import { useUserStore } from "@/stores/userStore";
import { useEffect } from "react";

export default function Edit({ mustVerifyEmail, status }: EditProps) {
  const user = usePage<any>().props.auth.user;
  const setUser = useUserStore((state) => state.setUser);
  const storedUser = useUserStore((state) => state.user);

  useEffect(() => {
    // Only update store if user is different to prevent loops
    if (user && JSON.stringify(user) !== JSON.stringify(storedUser)) {
      setUser(user);
    }
  }, [user, setUser, storedUser]);

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col items-center justify-center py-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-purple-600 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-primary-500 to-purple-600">
              <div className="p-1 bg-white dark:bg-neutral-900 rounded-full">
                <CustomAvatar
                  src={user.photo_url || user.avatar}
                  name={user.name}
                  size="2xl"
                  className="ring-4 ring-transparent"
                />
              </div>
            </div>

            <div className="absolute bottom-1 right-1">
              <div className="w-5 h-5 rounded-full border-4 border-white dark:border-neutral-900 bg-green-500 shadow-sm animate-pulse" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {user.name}
            </h2>

            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800">
                <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="font-medium text-gray-600 dark:text-gray-400">
                {user.email}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-5">
              <div className={`
                flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border
                ${user.email_verified_at
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50"
                  : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50"
                }
              `}>
                <Shield className="w-3.5 h-3.5" />
                {user.email_verified_at ? "Verificado" : "Sin verificar"}
              </div>

              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                <User className="w-3.5 h-3.5" />
                Miembro desde: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-6">
              <ConnectedAccounts header={false} />
            </div>
          </div>
        </div>
      }
    >
      <Head title="Profile" />

      <div
        className={` transition-colors duration-300

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
            </div>
            <AccountStatistics status={status} />

            {user.provider === null && (
              <div className="space-y-3 col-span-2">
                {/* <ConnectedAccounts /> */}
                <div className="space-y-3">
                  <UpdatePasswordForm className="w-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import ConnectedAccounts from "./Partials/ConnectedAccounts";
import AccountStatistics from "./Partials/AccountStatistics";
import { Avatar } from "@chakra-ui/react";
import { useTheme } from "@/Hooks/useTheme";
import { User, Mail, Shield, Link as LinkIcon } from "lucide-react";

interface EditProps {
  mustVerifyEmail: boolean;
  status?: string;
}

export default function Edit({ mustVerifyEmail, status }: EditProps) {
  const user = usePage().props.auth.user;
  const { theme } = useTheme();

  return (
    <AuthenticatedLayout
      header={
        <div
          className={`flex flex-col items-center justify-center py-8 transition-colors duration-300
        `}
        >
          <div className="relative">
            <Avatar.Root
              colorPalette="orange"
              size="2xl"
              variant="subtle"
              className={`w-24 h-24 ring-4 shadow-lg
                ${
                  theme === "dark"
                    ? "ring-purple-900/50 bg-neutral-800"
                    : "ring-green-200 bg-gradient-to-br from-orange-100 to-purple-100"
                }
              `}
            >
              <Avatar.Fallback
                name={user.name}
                className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-orange-800"
                }`}
              />
              <Avatar.Image src={user.avatar} />
            </Avatar.Root>
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
        

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <UpdateProfileInformationForm
                mustVerifyEmail={mustVerifyEmail}
                status={status}
                className="h-auto"
              />
              <AccountStatistics status={status} />
            </div>

            <div className="space-y-8">
              <ConnectedAccounts />
              <UpdatePasswordForm className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

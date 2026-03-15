import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatformsConfig";
import { router } from "@inertiajs/react";
import axios from "axios";
import { CheckCircle, Settings, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

declare function route(name: string, params?: any): string;

interface ConnectedAccount {
  id: number;
  platform: string;
  name: string;
  logo: string;
  isConnected: boolean;
  details?: any;
  color: string;
  bgClass: string;
  textColor: string;
  darkColor: string;
  darkTextColor: string;
}

export default function ConnectedAccounts({ className = "" }) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar con las plataformas activas
    const activePlatforms = Object.values(SOCIAL_PLATFORMS)
      .filter((platform) => platform.active)
      .map((platform) => ({
        id: platform.id,
        platform: platform.key,
        name: platform.name,
        logo: platform.logo,
        isConnected: false,
        color: platform.color,
        bgClass: platform.bgClass,
        textColor: platform.textColor,
        darkColor: platform.darkColor,
        darkTextColor: platform.darkTextColor,
      }));

    setAccounts(activePlatforms);
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/social-accounts");
      if (response.data && response.data.accounts) {
        updateAccountsStatus(response.data.accounts);
      }
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsStatus = (connectedAccounts: any[]) => {
    if (!connectedAccounts || connectedAccounts.length === 0) {
      return;
    }

    setAccounts((prevAccounts) =>
      prevAccounts.map((account) => {
        const connectedAccount = connectedAccounts.find(
          (ca: any) =>
            ca.platform.toLowerCase() === account.platform.toLowerCase(),
        );

        return {
          ...account,
          isConnected: !!connectedAccount,
          details: connectedAccount || null,
        };
      }),
    );
  };

  const handleAccountClick = (account: ConnectedAccount) => {
    // Redirigir a la configuración de redes sociales
    router.visit(route("settings.social"));
  };

  return (
    <div className={className}>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleAccountClick(account)}
              className={`
                group relative flex flex-col items-center p-5 rounded-lg border-2 transition-all duration-200
                ${
                  account.isConnected
                    ? `${account.bgClass} ${account.darkColor} border-transparent hover:shadow-lg hover:scale-105`
                    : "bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:shadow-md"
                }
                cursor-pointer
              `}
            >
              {/* Logo */}
              <div
                className={`
                  w-16 h-16 flex items-center justify-center mb-3 transition-transform group-hover:scale-105
                `}
              >
                <img
                  src={account.logo}
                  alt={account.name}
                  className="w-8 h-8"
                />
              </div>

              {/* Nombre */}
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">
                {account.name}
              </h4>

              {/* Estado */}
              <div
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                  ${
                    account.isConnected
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400"
                  }
                `}
              >
                {account.isConnected ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t("profile.connectedAccounts.active", "Activa")}
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    {t("profile.connectedAccounts.inactive", "No conectada")}
                  </>
                )}
              </div>

              {/* Icono de configuración */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-700 shadow-md">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              </div>

              {/* Indicador de estado (punto) */}
              {account.isConnected && (
                <div className="absolute top-3 left-3">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75"></div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Link para gestionar */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-neutral-700">
        <button
          onClick={() => router.visit(route("settings.social"))}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          {t(
            "profile.connectedAccounts.manageLink",
            "Gestionar cuentas conectadas",
          )}
        </button>
      </div>
    </div>
  );
}

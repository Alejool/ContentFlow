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
          (ca: any) => ca.platform.toLowerCase() === account.platform.toLowerCase(),
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleAccountClick(account)}
              className={`group relative flex flex-col items-center rounded-lg border-2 p-5 transition-all duration-200 ${
                account.isConnected
                  ? `${account.bgClass} ${account.darkColor} border-transparent hover:scale-105 hover:shadow-lg`
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
              } cursor-pointer`}
            >
              {/* Logo */}
              <div
                className={`mb-3 flex h-16 w-16 items-center justify-center transition-transform group-hover:scale-105`}
              >
                <img src={account.logo} alt={account.name} className="h-8 w-8" />
              </div>

              {/* Nombre */}
              <h4 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
                {account.name}
              </h4>

              {/* Estado */}
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                  account.isConnected
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-400"
                } `}
              >
                {account.isConnected ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t("profile.connectedAccounts.active", "Activa")}
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    {t("profile.connectedAccounts.inactive", "No conectada")}
                  </>
                )}
              </div>

              {/* Icono de configuración */}
              <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-lg bg-white p-1.5 shadow-md dark:bg-neutral-700">
                  <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
              </div>

              {/* Indicador de estado (punto) */}
              {account.isConnected && (
                <div className="absolute left-3 top-3">
                  <div className="relative">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75"></div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Link para gestionar */}
      <div className="mt-6 border-t border-gray-200 pt-6 dark:border-neutral-700">
        <button
          onClick={() => router.visit(route("settings.social"))}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
        >
          <Settings className="h-4 w-4" />
          {t("profile.connectedAccounts.manageLink", "Gestionar cuentas conectadas")}
        </button>
      </div>
    </div>
  );
}

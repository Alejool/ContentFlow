import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { PlanUsageCards } from "@/Components/Subscription/PlanUsageCards";
import { ActiveAddonsCards } from "@/Components/Subscription/ActiveAddonsCards";
import { AddonsPurchaseSection } from "@/Components/Subscription/AddonsPurchaseSection";
import { AddonsInfoBanner } from "@/Components/Subscription/AddonsInfoBanner";

interface AddonPackage {
  sku: string;
  name: string;
  description: string;
  amount: number;
  price: number;
  price_usd: number;
  price_local: number;
  currency: string;
  country: string;
  exchange_rate: number;
  formatted_price: string;
  enabled: boolean;
  popular: boolean;
  savings_percentage: number;
}

interface AddonsConfig {
  ai_credits: {
    enabled: boolean;
    packages: Record<string, AddonPackage>;
  };
  storage: {
    enabled: boolean;
    packages: Record<string, AddonPackage>;
  };
  publications: {
    enabled: boolean;
    packages: Record<string, AddonPackage>;
  };
  team_members: {
    enabled: boolean;
    packages: Record<string, AddonPackage>;
  };
}

interface Props {
  addons: AddonsConfig;
}

interface PageProps extends Props {
  systemAddons: {
    ai_credits: boolean;
    storage: boolean;
    team_members: boolean;
    publications: boolean;
  };
}

export default function Addons({ addons }: Props) {
  const { t } = useTranslation();
  const { systemAddons } = usePage<PageProps>().props;
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filtrar addons según configuración del sistema
  const filteredAddons: AddonsConfig = {
    ai_credits: {
      ...addons.ai_credits,
      enabled: addons.ai_credits.enabled && systemAddons?.ai_credits !== false,
    },
    storage: {
      ...addons.storage,
      enabled: addons.storage.enabled && systemAddons?.storage !== false,
    },
    publications: {
      ...addons.publications,
      enabled:
        addons.publications.enabled && systemAddons?.publications !== false,
    },
    team_members: {
      ...addons.team_members,
      enabled:
        addons.team_members.enabled && systemAddons?.team_members !== false,
    },
  };

  // Verificar parámetros de URL para mostrar notificaciones
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "true") {
      setNotification({
        type: "success",
        message: t(
          "subscription.addons.purchaseSuccess",
          "¡Compra exitosa! Tu addon se activará en unos momentos.",
        ),
      });
      // Limpiar URL
      window.history.replaceState({}, "", window.location.pathname);

      // Refrescar la lista de addons después de 2 segundos
      setTimeout(() => {
        setRefreshKey((prev) => prev + 1);
      }, 2000);
    } else if (params.get("canceled") === "true") {
      setNotification({
        type: "error",
        message: t(
          "subscription.addons.purchaseCanceled",
          "Compra cancelada. No se realizó ningún cargo.",
        ),
      });
      // Limpiar URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("pending") === "true") {
      setNotification({
        type: "info",
        message: t(
          "subscription.addons.purchasePending",
          "Pago pendiente. Te notificaremos cuando se confirme.",
        ),
      });
      // Limpiar URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [t]);

  // Auto-ocultar notificación después de 10 segundos
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Validar que addons existe y tiene la estructura correcta
  if (!addons || typeof addons !== "object") {
    return (
      <AuthenticatedLayout>
        <Head title={t("subscription.addons.title", "Paquetes Adicionales")} />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">
                {t(
                  "subscription.addons.loadingError",
                  "Error al cargar add-ons",
                )}
              </p>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Head title={t("subscription.addons.title", "Paquetes Adicionales")} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
          {/* Notificación de éxito/error */}
          {notification && (
            <div
              className={`rounded-lg p-4 border-2 ${
                notification.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : notification.type === "error"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {notification.type === "success" && (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  )}
                  {notification.type === "error" && (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                  {notification.type === "info" && (
                    <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      notification.type === "success"
                        ? "text-green-800 dark:text-green-200"
                        : notification.type === "error"
                          ? "text-red-800 dark:text-red-200"
                          : "text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className={`flex-shrink-0 ${
                    notification.type === "success"
                      ? "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                      : notification.type === "error"
                        ? "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                        : "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("subscription.addons.title", "Paquetes Adicionales")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t(
                "subscription.addons.subtitle",
                "Extiende tu capacidad con créditos de IA, almacenamiento, publicaciones y miembros del equipo",
              )}
            </p>
          </div>

          {/* Tarjetas de uso del plan */}
          <PlanUsageCards showCarousel={true} showTitle={true} />

          {/* Tarjetas de add-ons activos */}
          <ActiveAddonsCards showCarousel={true} key={refreshKey} />

          {/* Sección de compra de paquetes */}
          <AddonsPurchaseSection addons={filteredAddons} />

          {/* Banner informativo global de moneda */}
          {addons &&
            Object.values(addons).some(
              (category: any) =>
                category.packages &&
                Object.values(category.packages).some(
                  (pkg: any) => pkg.currency && pkg.currency !== "USD",
                ),
            ) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
                    <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t(
                        "subscription.addons.currencyBanner.title",
                        "Precios en tu Moneda Local",
                      )}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {t(
                        "subscription.addons.currencyBanner.description",
                        "Los precios se muestran automáticamente en tu moneda local para tu comodidad. El equivalente en USD se muestra como referencia.",
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        ✓{" "}
                        {t(
                          "subscription.addons.currencyBanner.automatic",
                          "Conversión automática",
                        )}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        ✓{" "}
                        {t(
                          "subscription.addons.currencyBanner.transparent",
                          "Precios transparentes",
                        )}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        ✓{" "}
                        {t(
                          "subscription.addons.currencyBanner.noHiddenFees",
                          "Sin cargos ocultos",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Banner informativo */}
          <AddonsInfoBanner />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

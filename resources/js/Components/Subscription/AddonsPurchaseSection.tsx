import { Sparkles, HardDrive, FileText, Users, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import {
  CarouselPagination,
  CarouselDots,
} from "@/Components/common/CarouselPagination";
import { GatewaySelector } from "@/Components/Payment/GatewaySelector";
import { ActiveAddonsCards } from "./ActiveAddonsCards";
import { TabNavigation, Tab } from "@/Components/common/TabNavigation";
import { AddonPriceDisplay } from "./AddonPriceDisplay";

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

interface AddonsPurchaseSectionProps {
  addons: AddonsConfig;
}

export function AddonsPurchaseSection({ addons }: AddonsPurchaseSectionProps) {
  const { t } = useTranslation();

  // Encontrar el primer tab habilitado
  const firstEnabledTab = (
    addons.ai_credits?.enabled
      ? "ai_credits"
      : addons.storage?.enabled
        ? "storage"
        : addons.publications?.enabled
          ? "publications"
          : addons.team_members?.enabled
            ? "team_members"
            : "ai_credits"
  ) as "ai_credits" | "storage" | "publications" | "team_members";

  const [activeTab, setActiveTab] = useState<
    "ai_credits" | "storage" | "publications" | "team_members"
  >(firstEnabledTab);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [currentPackageSlide, setCurrentPackageSlide] = useState(0);
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  // Cargar información de gateways y precios
  useEffect(() => {
    fetch("/api/payment/gateways")
      .then((res) => res.json())
      .then((data) => {
        setSelectedGateway(data.default_gateway || "stripe");
        setCurrency(data.currency || "USD");
        setExchangeRate(data.exchange_rate || 1);
      })
      .catch((error) => {
        console.error("Error loading payment info:", error);
      });
  }, []);

  // Configuración del carrusel de paquetes
  const packagesPerSlide = 4;
  const currentPackages = addons[activeTab]?.packages
    ? Object.values(addons[activeTab].packages).filter((pkg) => pkg.enabled)
    : [];
  const totalPackageSlides = Math.ceil(
    currentPackages.length / packagesPerSlide,
  );
  const showPackageCarousel = currentPackages.length > packagesPerSlide;

  const nextPackageSlide = () => {
    setCurrentPackageSlide((prev) => (prev + 1) % totalPackageSlides);
  };

  const prevPackageSlide = () => {
    setCurrentPackageSlide(
      (prev) => (prev - 1 + totalPackageSlides) % totalPackageSlides,
    );
  };

  const getCurrentPackages = () => {
    const start = currentPackageSlide * packagesPerSlide;
    return currentPackages.slice(start, start + packagesPerSlide);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key as typeof activeTab);
    setCurrentPackageSlide(0);
  };

  const tabs = [
    {
      key: "ai_credits" as const,
      label: t("subscription.addons.aiCredits", "Créditos IA"),
      icon: Sparkles,
      enabled: addons.ai_credits?.enabled ?? false,
    },
    {
      key: "storage" as const,
      label: t("subscription.addons.storage", "Almacenamiento"),
      icon: HardDrive,
      enabled: addons.storage?.enabled ?? false,
    },
    {
      key: "publications" as const,
      label: t("subscription.addons.publications", "Publicaciones"),
      icon: FileText,
      enabled: addons.publications?.enabled ?? false,
    },
    {
      key: "team_members" as const,
      label: t("subscription.addons.teamMembers", "Miembros del Equipo"),
      icon: Users,
      enabled: addons.team_members?.enabled ?? false,
    },
  ];

  const getQuantity = (sku: string) => quantities[sku] || 1;

  const updateQuantity = (sku: string, delta: number) => {
    const current = getQuantity(sku);
    const newValue = Math.max(1, current + delta);
    setQuantities({ ...quantities, [sku]: newValue });
  };

  const handlePurchase = async (sku: string) => {
    const quantity = getQuantity(sku);

    try {
      const response = await fetch("/api/payment/checkout/addon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN":
            document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute("content") || "",
        },
        body: JSON.stringify({
          sku,
          quantity,
          gateway: selectedGateway,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirigir al checkout del gateway
        window.location.href = data.url;
      } else if (data.client_secret) {
        // Para Stripe Payment Intent, usar el client_secret con Stripe Elements
        // Por ahora, mostrar un mensaje
        console.error(
          "Payment Intent flow not implemented yet. Use Checkout Session instead.",
        );
        alert(
          "Por favor configura los Price IDs de Stripe para usar el checkout completo.",
        );
      } else {
        console.error("Invalid response from payment API");
        alert("Error al crear la sesión de pago. Por favor intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Error al procesar el pago. Por favor intenta de nuevo.");
    }
  };

  const renderPackageCard = (pkg: AddonPackage) => {
    const quantity = getQuantity(pkg.sku);
    const totalPriceUsd = (pkg.price_usd || pkg.price) * quantity;
    const totalPriceLocal = (pkg.price_local || pkg.price) * quantity;

    return (
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all ${
          pkg.popular
            ? "border-primary-500 shadow-lg scale-105"
            : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
        }`}
      >
        {pkg.popular && (
          <div className="absolute -top-2 left-3">
            <span className="bg-primary-500/90 backdrop-2xl text-white text-xs font-bold px-3 py-2 rounded-full">
              {t("subscription.addons.mostPopular", "Más Popular")}
            </span>
          </div>
        )}

        {pkg.savings_percentage > 0 && (
          <div className="absolute -top-2 right-3">
            <span className="bg-green-500/90 backdrop-2xl text-white text-xs font-bold px-3 py-2 rounded-full">
              {t("subscription.addons.save", "Ahorra")} {pkg.savings_percentage}
              %
            </span>
          </div>
        )}

        <div className="flex justify-center mb-4">
          {activeTab === "ai_credits" && (
            <Sparkles className="w-12 h-12 text-primary-500" />
          )}
          {activeTab === "storage" && (
            <HardDrive className="w-12 h-12 text-primary-500" />
          )}
          {activeTab === "publications" && (
            <FileText className="w-12 h-12 text-primary-500" />
          )}
          {activeTab === "team_members" && (
            <Users className="w-12 h-12 text-primary-500" />
          )}
        </div>

        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
          {t(`subscription.addons.packages.${pkg.sku}.name`, pkg.name)}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
          {t(
            `subscription.addons.packages.${pkg.sku}.description`,
            pkg.description,
          )}
        </p>

        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {pkg.amount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activeTab === "ai_credits" &&
              t("subscription.addons.credits", "créditos")}
            {activeTab === "storage" && "GB"}
            {activeTab === "publications" &&
              t("subscription.addons.posts", "publicaciones")}
            {activeTab === "team_members" &&
              t("subscription.addons.members", "miembros")}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <AddonPriceDisplay
            priceUsd={pkg.price_usd || pkg.price}
            priceLocal={pkg.price_local || pkg.price}
            currency={pkg.currency || "USD"}
            formattedPrice={pkg.formatted_price || `$${pkg.price.toFixed(2)}`}
            showUsdEquivalent={true}
            size="lg"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => updateQuantity(pkg.sku, -1)}
              variant="ghost"
              buttonStyle="icon"
              size="lg"
              className="w-10 h-10 !p-0"
              animation="scale"
            >
              -
            </Button>
            <Input
              id={`quantity-${pkg.sku}`}
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantities({
                  ...quantities,
                  [pkg.sku]: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              className="w-16 text-center"
              containerClassName="w-16"
              sizeType="md"
              variant="outlined"
            />
            <Button
              onClick={() => updateQuantity(pkg.sku, 1)}
              buttonStyle="icon"
              variant="ghost"
              size="lg"
              className="w-10 h-10 !p-0"
              animation="scale"
            >
              +
            </Button>
          </div>
        </div>

        {quantity > 1 && (
          <div className="text-center mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("subscription.addons.total", "Total")} ({quantity}x):
            </div>
            <AddonPriceDisplay
              priceUsd={totalPriceUsd}
              priceLocal={totalPriceLocal}
              currency={pkg.currency || "USD"}
              formattedPrice={formatPrice(
                totalPriceLocal,
                pkg.currency || "USD",
              )}
              showUsdEquivalent={true}
              size="md"
            />
          </div>
        )}

        <Button
          onClick={() => handlePurchase(pkg.sku)}
          disabled={!pkg.enabled}
          variant="primary"
          buttonStyle={pkg.popular ? "gradient" : "solid"}
          size="md"
          fullWidth
          shadow={pkg.popular ? "primary" : "md"}
          animation="scale"
        >
          {t("subscription.addons.buyNow", "Comprar Ahora")}
        </Button>
      </div>
    );
  };

  const getCurrencySymbol = (curr: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      COP: "$",
      MXN: "$",
      ARS: "$",
      BRL: "R$",
      CLP: "$",
      PEN: "S/",
      EUR: "€",
      GBP: "£",
      CAD: "CA$",
      AUD: "A$",
      JPY: "¥",
      INR: "₹",
    };
    return symbols[curr] || curr + " ";
  };

  const formatPrice = (price: number, curr: string): string => {
    const symbol = getCurrencySymbol(curr);
    // Monedas sin decimales
    if (["COP", "CLP", "JPY"].includes(curr)) {
      return `${symbol}${Math.round(price).toLocaleString()}`;
    }
    return `${symbol}${price.toFixed(2)}`;
  };

  // Detectar si hay precios convertidos
  const firstPackage = currentPackages[0];
  const hasCurrencyConversion =
    firstPackage && firstPackage.currency && firstPackage.currency !== "USD";

  return (
    <div className="space-y-6">
      {/* Sección de compra de paquetes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="underline"
          isDraggable={true}
          size="md"
          className=""
        />

        {showPackageCarousel && (
          <div className="px-8 pt-4 flex justify-center">
            <CarouselPagination
              currentSlide={currentPackageSlide}
              totalSlides={totalPackageSlides}
              onPrevious={prevPackageSlide}
              onNext={nextPackageSlide}
            />
          </div>
        )}

        <div className="p-8">
          {/* Banner informativo de moneda */}
          {hasCurrencyConversion && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t(
                      "subscription.addons.currencyInfo",
                      `Los precios se muestran en ${firstPackage.currency} según tu ubicación. El equivalente en USD se muestra como referencia.`,
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selector de Gateway */}
          <GatewaySelector
            selectedGateway={selectedGateway}
            onGatewayChange={setSelectedGateway}
            className="mb-6"
          />

          {showPackageCarousel ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {getCurrentPackages().map((pkg) => (
                  <div key={pkg.sku}>{renderPackageCard(pkg)}</div>
                ))}
              </div>

              <CarouselDots
                totalSlides={totalPackageSlides}
                currentSlide={currentPackageSlide}
                onDotClick={(index) => setCurrentPackageSlide(index)}
                className="mt-6"
              />
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {currentPackages.length > 0 ? (
                currentPackages.map((pkg) => (
                  <div key={pkg.sku}>{renderPackageCard(pkg)}</div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t(
                      "subscription.addons.noPackages",
                      "No hay paquetes disponibles en esta categoría",
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

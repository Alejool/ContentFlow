import { useState, useEffect } from "react";
import { CreditCard, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Gateway {
  name: string;
  display_name: string;
  logo: string | null;
  available: boolean;
}

interface GatewaySelectorProps {
  selectedGateway: string;
  onGatewayChange: (gateway: string) => void;
  className?: string;
  showModal?: boolean;
  onModalClose?: () => void;
}

export function GatewaySelector({
  selectedGateway,
  onGatewayChange,
  className = "",
  showModal = false,
  onModalClose,
}: GatewaySelectorProps) {
  const { t } = useTranslation();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(showModal);

  useEffect(() => {
    fetch("/api/payment/gateways")
      .then((res) => res.json())
      .then((data) => {
        // Filtrar solo gateways disponibles (habilitados en el sistema)
        const availableGateways = (data.gateways || []).filter((g: Gateway) => g.available);
        setGateways(availableGateways);

        // Si solo hay un gateway, seleccionarlo automáticamente
        if (availableGateways.length === 1 && !selectedGateway) {
          onGatewayChange(availableGateways[0].name);
        } else if (data.default_gateway && !selectedGateway && availableGateways.length > 0) {
          onGatewayChange(data.default_gateway);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading gateways:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setIsModalOpen(showModal);
  }, [showModal]);

  const handleGatewaySelect = (gatewayName: string) => {
    onGatewayChange(gatewayName);
    if (isModalOpen && onModalClose) {
      setIsModalOpen(false);
      onModalClose();
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  // Si no hay gateways disponibles, no mostrar nada
  if (gateways.length === 0) {
    return null;
  }

  // Si solo hay un gateway, no mostrar selector (ya se seleccionó automáticamente)
  if (gateways.length === 1 && !showModal) {
    return null;
  }

  // Contenido del selector
  const selectorContent = (
    <>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t("payment.paymentMethod") || "Método de pago"}
      </label>
      <div
        className={`grid gap-3 ${
          gateways.length === 1
            ? "grid-cols-1"
            : gateways.length === 2
              ? "grid-cols-2"
              : gateways.length === 3
                ? "grid-cols-3"
                : "grid-cols-2 md:grid-cols-4"
        }`}
      >
        {gateways.map((gateway) => (
          <button
            key={gateway.name}
            onClick={() => handleGatewaySelect(gateway.name)}
            disabled={!gateway.available}
            className={`relative flex min-h-[100px] flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
              selectedGateway === gateway.name
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-600"
            } ${!gateway.available ? "cursor-not-allowed opacity-50" : "cursor-pointer"} `}
          >
            {gateway.logo ? (
              <img
                src={gateway.logo}
                alt={gateway.display_name}
                className="mb-2 h-10 w-auto object-contain"
              />
            ) : (
              <CreditCard className="mb-2 h-8 w-8 text-gray-600 dark:text-gray-400" />
            )}

            <span className="text-center text-sm font-medium text-gray-900 dark:text-white">
              {gateway.display_name}
            </span>

            {selectedGateway === gateway.name && (
              <div className="absolute right-2 top-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );

  // Si showModal es true, mostrar en modal
  if (isModalOpen) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={handleModalClose}
        />

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            {/* Close button */}
            <button
              onClick={handleModalClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal content */}
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t("payment.selectPaymentMethod") || "Selecciona un método de pago"}
            </h3>

            {selectorContent}
          </div>
        </div>
      </>
    );
  }

  // Mostrar inline
  return <div className={className}>{selectorContent}</div>;
}

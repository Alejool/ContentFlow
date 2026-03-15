import { AlertTriangle, Sparkles, X } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useState } from "react";

interface UsageWarningBannerProps {
  usage: number;
  limit: number;
  type: "ai_credits" | "storage" | "publications";
  typeName?: string;
}

export function UsageWarningBanner({ usage, limit, type, typeName }: UsageWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const percentage = (usage / limit) * 100;

  // Solo mostrar si uso > 80%
  if (percentage < 80 || dismissed) return null;

  const typeNames = {
    ai_credits: "Créditos de IA",
    storage: "Almacenamiento",
    publications: "Publicaciones",
  };

  const displayName = typeName || typeNames[type];
  const remaining = limit - usage;

  // Colores según severidad
  const severity = percentage >= 95 ? "critical" : percentage >= 90 ? "high" : "warning";

  const styles = {
    critical: {
      bg: "bg-red-50",
      border: "border-red-400",
      text: "text-red-800",
      textLight: "text-red-700",
      icon: "text-red-400",
      button: "bg-red-600 hover:bg-red-700",
    },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-400",
      text: "text-orange-800",
      textLight: "text-orange-700",
      icon: "text-orange-400",
      button: "bg-orange-600 hover:bg-orange-700",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-400",
      text: "text-amber-800",
      textLight: "text-amber-700",
      icon: "text-amber-400",
      button: "bg-amber-600 hover:bg-amber-700",
    },
  };

  const style = styles[severity];

  return (
    <div className={`${style.bg} border-l-4 ${style.border} mb-4 rounded-r-lg p-4 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center">
          <AlertTriangle className={`h-5 w-5 ${style.icon} mr-3 flex-shrink-0`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${style.text}`}>
              {severity === "critical" && "🚨 "}
              {severity === "high" && "⚠️ "}
              {severity === "warning" && "⚡ "}
              Estás cerca del límite de {displayName}
            </p>
            <p className={`text-sm ${style.textLight} mt-1`}>
              Has usado <span className="font-semibold">{usage}</span> de{" "}
              <span className="font-semibold">{limit}</span> ({percentage.toFixed(0)}%)
              {remaining > 0 && (
                <span className="ml-2">
                  • Solo te quedan <span className="font-semibold">{remaining}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <Link
            href="/subscription/addons"
            className={`inline-flex items-center px-4 py-2 ${style.button} whitespace-nowrap rounded-lg text-sm font-medium text-white transition-colors`}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Comprar Más
          </Link>

          <button
            onClick={() => setDismissed(true)}
            className={`p-1 ${style.textLight} hover:${style.text} transition-colors`}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

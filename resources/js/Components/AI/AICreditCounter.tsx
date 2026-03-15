import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useAddons } from "@/Hooks/useAddons";

export function AICreditCounter() {
  const { summary, loading } = useAddons();

  if (loading || !summary) {
    return (
      <div className="mb-4 animate-pulse rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
        <div className="mb-2 h-8 w-3/4 rounded bg-gray-200"></div>
        <div className="h-2 w-full rounded bg-gray-200"></div>
      </div>
    );
  }

  const { used, limit, remaining, percentage } = summary.ai_credits;

  // Determinar estado
  const status = percentage >= 95 ? "critical" : percentage >= 80 ? "warning" : "normal";

  const statusConfig = {
    critical: {
      color: "text-red-600",
      bgColor: "bg-red-500",
      icon: AlertCircle,
      message: "¡Créditos casi agotados!",
    },
    warning: {
      color: "text-amber-600",
      bgColor: "bg-amber-500",
      icon: TrendingUp,
      message: "Considera comprar más",
    },
    normal: {
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      icon: Sparkles,
      message: "Todo bien",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="mb-4 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <Icon className={`h-5 w-5 ${config.color} mr-2`} />
          <span className="text-sm font-medium text-gray-700">Créditos IA</span>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${config.color}`}>{remaining}</div>
          <div className="text-xs text-gray-500">restantes</div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${config.bgColor}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            {used} / {limit === -1 ? "∞" : limit} usados
          </span>
          <span className={`text-xs font-medium ${config.color}`}>{percentage.toFixed(0)}%</span>
        </div>
      </div>

      {/* Mensaje y CTA */}
      {status !== "normal" && (
        <div className="border-t border-blue-100 pt-3">
          <p className="mb-2 text-xs text-gray-600">{config.message}</p>
          <Link
            href="/subscription/addons"
            className="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Sparkles className="mr-1.5 inline h-4 w-4" />
            Comprar Más Créditos
          </Link>
        </div>
      )}

      {/* Info adicional */}
      {status === "normal" && remaining < 50 && (
        <div className="border-t border-blue-100 pt-3">
          <Link
            href="/subscription/addons"
            className="flex items-center justify-center text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            Ver paquetes disponibles
            <TrendingUp className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

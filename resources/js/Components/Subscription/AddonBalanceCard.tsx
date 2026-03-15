import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Progress } from "@/Components/ui/progress";
import type { AddonBalance } from "@/types/addon";
import { Sparkles, HardDrive } from "lucide-react";

interface AddonBalanceCardProps {
  balance: AddonBalance;
  onBuyMore?: () => void;
}

export const AddonBalanceCard: React.FC<AddonBalanceCardProps> = ({
  balance,
  onBuyMore,
}) => {
  const isAI = balance.type === "ai_credits";
  const Icon = isAI ? Sparkles : HardDrive;
  const unit = isAI ? "créditos" : "GB";
  const title = isAI ? "Créditos IA" : "Almacenamiento";

  const getProgressColor = () => {
    if (balance.percentage_used >= 90) return "bg-red-500";
    if (balance.percentage_used >= 70) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Balance Amount */}
          <div>
            <div className="text-2xl font-bold">
              {balance.remaining.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {balance.total.toLocaleString()} {unit}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress
              value={balance.percentage_used}
              className="h-2"
              indicatorClassName={getProgressColor()}
            />
            <p className="text-xs text-muted-foreground">
              {balance.percentage_used.toFixed(1)}% usado
            </p>
          </div>

          {/* Addons Count */}
          {balance.addons_count > 0 && (
            <p className="text-xs text-muted-foreground">
              {balance.addons_count} paquete
              {balance.addons_count !== 1 ? "s" : ""} activo
              {balance.addons_count !== 1 ? "s" : ""}
            </p>
          )}

          {/* Low Balance Warning */}
          {balance.percentage_used >= 80 && balance.remaining > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ Saldo bajo. Considera comprar más {unit}.
              </p>
            </div>
          )}

          {/* No Balance */}
          {balance.total === 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                No tienes add-ons activos. Compra paquetes adicionales para
                extender tu capacidad.
              </p>
            </div>
          )}

          {/* Buy More Button */}
          {onBuyMore && (
            <button
              onClick={onBuyMore}
              className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Comprar Más
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

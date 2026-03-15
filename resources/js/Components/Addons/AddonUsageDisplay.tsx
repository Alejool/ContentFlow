import React from "react";

interface AddonUsageProps {
  type: string;
  name: string;
  planLimit: number;
  currentUsage: number;
  addonTotal: number;
  addonUsed: number;
  addonRemaining: number;
  unit: string;
}

export default function AddonUsageDisplay({
  type,
  name,
  planLimit,
  currentUsage,
  addonTotal,
  addonUsed,
  addonRemaining,
  unit,
}: AddonUsageProps) {
  const isUnlimited = planLimit === -1;
  const isExceedingPlan = !isUnlimited && currentUsage > planLimit;
  const planUsage = isUnlimited
    ? currentUsage
    : Math.min(currentUsage, planLimit);
  const excessUsage = isExceedingPlan ? currentUsage - planLimit : 0;

  const formatValue = (value: number) => {
    if (type === "storage" && unit === "GB") {
      return `${value.toFixed(1)} GB`;
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <span className="text-sm text-gray-500">
          {formatValue(currentUsage)} usado
        </span>
      </div>

      {/* Plan Base Usage */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Plan Base</span>
          <span className="text-sm text-gray-600">
            {isUnlimited ? "Ilimitado" : formatValue(planLimit)}
          </span>
        </div>

        {!isUnlimited && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((planUsage / planLimit) * 100, 100)}%`,
              }}
            />
          </div>
        )}

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatValue(planUsage)} usado del plan</span>
          {!isUnlimited && (
            <span>{((planUsage / planLimit) * 100).toFixed(1)}%</span>
          )}
        </div>
      </div>

      {/* Addon Usage (only if exceeding plan or has addons) */}
      {(addonTotal > 0 || isExceedingPlan) && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-orange-700">
              Addons de Extensión
            </span>
            <span className="text-sm text-orange-600">
              {formatValue(addonTotal)} disponible
            </span>
          </div>

          {addonTotal > 0 && (
            <div className="w-full bg-orange-100 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${addonTotal > 0 ? (addonUsed / addonTotal) * 100 : 0}%`,
                }}
              />
            </div>
          )}

          <div className="flex justify-between text-xs text-orange-600 mt-1">
            <span>{formatValue(addonUsed)} usado de addons</span>
            <span>{formatValue(addonRemaining)} restante</span>
          </div>

          {/* Explanation */}
          <div className="mt-3 p-3 bg-orange-50 rounded-md">
            <p className="text-xs text-orange-800">
              {isExceedingPlan ? (
                <>
                  <strong>Usando addons:</strong> Has excedido tu plan base por{" "}
                  {formatValue(excessUsage)}. Los addons se están consumiendo
                  automáticamente.
                </>
              ) : (
                <>
                  <strong>Addons disponibles:</strong> Tus addons se activarán
                  automáticamente cuando excedas el límite de tu plan base (
                  {isUnlimited ? "ilimitado" : formatValue(planLimit)}).
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Total Usage Summary */}
      <div className="mt-4 pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">
            Uso Total Disponible
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {isUnlimited ? "Ilimitado" : formatValue(planLimit + addonTotal)}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Plan: {isUnlimited ? "Ilimitado" : formatValue(planLimit)} + Addons:{" "}
          {formatValue(addonTotal)}
        </div>
      </div>
    </div>
  );
}

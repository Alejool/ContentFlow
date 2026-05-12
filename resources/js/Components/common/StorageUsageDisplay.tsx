import {
    calculateStoragePercentage,
    formatBytes,
    formatStorageUsage,
    getStorageBgColorClass,
    getStorageColorClass,
} from '@/Utils/formatters';
import React from 'react';

interface StorageUsageDisplayProps {
  used: number; // bytes
  total: number; // bytes
  showPercentage?: boolean;
  showAvailable?: boolean;
  showProgressBar?: boolean;
  className?: string;
}

/**
 * Componente para mostrar el uso de almacenamiento de forma visual
 * 
 * @example
 * // Uso básico
 * <StorageUsageDisplay used={536870912} total={1073741824} />
 * 
 * // Con todas las opciones
 * <StorageUsageDisplay
 *   used={subscription.storage_used}
 *   total={subscription.storage_limit}
 *   showPercentage
 *   showAvailable
 *   showProgressBar
 * />
 * 
 * // Si el backend envía en GB
 * import { gbToBytes } from '@/Utils/formatters';
 * <StorageUsageDisplay
 *   used={gbToBytes(704994.0)}
 *   total={gbToBytes(1073741824000.0)}
 * />
 */
const StorageUsageDisplay: React.FC<StorageUsageDisplayProps> = ({
  used,
  total,
  showPercentage = true,
  showAvailable = true,
  showProgressBar = true,
  className = '',
}) => {
  const percentage = calculateStoragePercentage(used, total);
  const colorClass = getStorageColorClass(percentage);
  const bgColorClass = getStorageBgColorClass(percentage);
  const remaining = total - used;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Uso en texto */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Almacenamiento</span>
        <span className={`text-sm font-medium ${colorClass}`}>
          {formatStorageUsage(used, total)}
        </span>
      </div>

      {/* Barra de progreso */}
      {showProgressBar && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full transition-all duration-300 ${bgColorClass}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      {/* Información adicional */}
      {(showPercentage || showAvailable) && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {showPercentage && <span>{percentage}% utilizado</span>}
          {showAvailable && <span>{formatBytes(remaining)} disponible</span>}
        </div>
      )}
    </div>
  );
};

export default StorageUsageDisplay;

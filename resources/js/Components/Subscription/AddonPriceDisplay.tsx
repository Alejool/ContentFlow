import { useTranslation } from 'react-i18next';

interface AddonPriceDisplayProps {
  priceUsd: number;
  priceLocal: number;
  currency: string;
  formattedPrice: string;
  showUsdEquivalent?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente para mostrar precios de addons con conversión de moneda
 */
export function AddonPriceDisplay({
  priceUsd,
  priceLocal,
  currency,
  formattedPrice,
  showUsdEquivalent = true,
  size = 'md',
}: AddonPriceDisplayProps) {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const subTextClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex flex-col">
      {/* Precio principal en moneda local */}
      <div className={`${sizeClasses[size]} font-bold text-gray-900 dark:text-white`}>
        {formattedPrice}
      </div>

      {/* Equivalente en USD (si no es USD) */}
      {showUsdEquivalent && currency !== 'USD' && (
        <div className={`${subTextClasses[size]} text-gray-500 dark:text-gray-400 mt-1`}>
          ≈ USD ${priceUsd.toFixed(2)}
        </div>
      )}

      {/* Badge de moneda */}
      {currency !== 'USD' && (
        <div className="mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            {currency}
          </span>
        </div>
      )}
    </div>
  );
}

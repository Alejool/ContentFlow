/**
 * Tipos para el sistema de addons con conversión de moneda
 */

export interface AddonPackage {
  sku: string;
  name: string;
  description: string;
  amount: number;
  unit: string;
  price: number; // Precio original en USD
  price_usd: number; // Precio en USD (igual que price)
  price_local: number; // Precio convertido a moneda local
  currency: string; // Código de moneda (USD, COP, MXN, etc.)
  country: string; // Código de país (US, CO, MX, etc.)
  exchange_rate: number; // Tasa de cambio aplicada
  formatted_price: string; // Precio formateado con símbolo ($39,960)
  stripe_price_id?: string;
  enabled: boolean;
  expires_days: number | null;
  popular: boolean;
  savings_percentage: number;
}

export interface AddonsConfig {
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

export interface ActiveAddon {
  id: number;
  addon_type: string;
  addon_sku: string;
  total_amount: number;
  used_amount: number;
  remaining: number;
  percentage: number;
  price_paid: number;
  currency: string;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface AddonBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
  percentage: number;
}

export interface CurrencyInfo {
  currency: string;
  country: string;
  exchange_rate: number;
  symbol: string;
}

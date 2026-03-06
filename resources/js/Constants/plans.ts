/**
 * ============================================================================
 * CONFIGURACIÓN DE PLANES - ContentFlow
 * ============================================================================
 *
 * Este archivo centraliza toda la configuración de planes de suscripción.
 *
 * CÓMO OCULTAR UN PLAN:
 * ---------------------
 * Opción 1: Comentar todo el bloque del plan
 * Opción 2: Cambiar enabled: true a enabled: false
 *
 * EJEMPLO - Ocultar el plan Demo:
 *
 *   demo: {
 *     enabled: false,  // ← Cambiar a false
 *     ...
 *   }
 *
 * O comentar todo:
 *
 *   // demo: {
 *   //   enabled: true,
 *   //   price: 0,
 *   //   ...
 *   // },
 *
 * PROPIEDADES:
 * ------------
 * - enabled: true/false - Mostrar u ocultar el plan
 * - price: número - Precio mensual en USD
 * - billingCycle: 'monthly' | 'yearly' | 'trial'
 * - trialDays: número - Días de prueba (solo para plan demo)
 * - popular: true/false - Mostrar badge de "Más Popular"
 * - requiresStripe: true/false - Si requiere pago con Stripe
 * - features: array - Lista de características (keys de traducción)
 *
 * ============================================================================
 */

export const PLAN_CONFIG = {
  // ========================================
  // PLAN DEMO - 30 días de prueba
  // ========================================
  demo: {
    enabled: true, // ← Cambiar a false para ocultar
    price: 0,
    billingCycle: "trial" as const,
    trialDays: 30,
    popular: false,
    requiresStripe: false,
    features: [
      "fullAccessDays",
      "publications100",
      "socialAccounts20",
      "storage50",
      "aiRequests500",
      "advancedAnalytics",
      "advancedScheduling",
      "calendarSync",
      "bulkOperations",
      "emailSupport",
    ],
  },

  // ========================================
  // PLAN FREE - Gratis para siempre
  // ========================================
  free: {
    enabled: false, // ← Cambiar a false para ocultar
    price: 0,
    billingCycle: "monthly" as const,
    popular: false,
    requiresStripe: false,
    features: [
      "publications3",
      "socialAccounts2",
      "storage1",
      "aiRequests10",
      "basicAnalytics",
      "emailSupport",
    ],
  },

  // ========================================
  // PLAN STARTER - Para emprendedores
  // ========================================
  starter: {
    enabled: true, // ← Cambiar a false para ocultar
    price: 19,
    billingCycle: "monthly" as const,
    popular: false,
    requiresStripe: true,
    features: [
      "publications50",
      "socialAccounts10",
      "storage10",
      "aiRequests100",
      "basicAnalytics",
      "calendarSync",
      "emailSupport",
    ],
  },

  // ========================================
  // PLAN PROFESSIONAL - Más popular
  // ========================================
  professional: {
    enabled: true, // ← Cambiar a false para ocultar
    price: 49,
    billingCycle: "monthly" as const,
    popular: true, // ← Badge de "Más Popular"
    requiresStripe: true,
    features: [
      "publications200",
      "socialAccounts50",
      "storage100",
      "aiRequestsUnlimited",
      "advancedAnalytics",
      "advancedScheduling",
      "calendarSync",
      "bulkOperations",
      "customBranding",
      "prioritySupport",
    ],
  },

  // ========================================
  // PLAN ENTERPRISE - Para organizaciones
  // ========================================
  enterprise: {
    enabled: true, // ← Cambiar a false para ocultar
    price: 199,
    billingCycle: "monthly" as const,
    popular: false,
    requiresStripe: true,
    features: [
      "publicationsUnlimited",
      "socialAccountsUnlimited",
      "storage1TB",
      "aiRequestsUnlimited",
      "advancedAnalytics",
      "advancedScheduling",
      "calendarSync",
      "bulkOperations",
      "whiteLabel",
      "apiAccess",
      "customIntegrations",
      "slaGuarantee",
      "dedicatedSupport",
    ],
  },
} as const;

export type PlanId = keyof typeof PLAN_CONFIG;

/**
 * Obtener solo las features de un plan (para compatibilidad con código existente)
 */
export const PLAN_FEATURES = Object.fromEntries(
  Object.entries(PLAN_CONFIG).map(([key, config]) => [key, config.features]),
) as unknown as Record<PlanId, readonly string[]>;

/**
 * Obtener lista de planes habilitados
 */
export const getEnabledPlans = (): PlanId[] => {
  return Object.entries(PLAN_CONFIG)
    .filter(([_, config]) => config.enabled)
    .map(([key]) => key as PlanId);
};

/**
 * Verificar si un plan está habilitado
 */
export const isPlanEnabled = (planId: PlanId): boolean => {
  return PLAN_CONFIG[planId]?.enabled ?? false;
};

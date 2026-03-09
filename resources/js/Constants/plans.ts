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
    enabled: true,
    price: 0,
    billingCycle: "trial" as const,
    trialDays: 30,
    popular: false,
    requiresStripe: false,
    features: [
      "fullAccessDays",
      "publications100",
      "socialAccountsUnlimited",
      "storage50",
      "aiRequests500",
      "advancedAnalytics",
      "advancedScheduling",
      "schedulingRecurrence",
      "queuePublishing",
      "calendarSync",
      "bulkOperations",
      "discordChannels5",
      "approvalWorkflowsBasic",
      "historyDays90",
      "emailSupport",
    ],
  },

  // ========================================
  // PLAN FREE - Gratis para siempre
  // ========================================
  free: {
    enabled: false,
    price: 0,
    billingCycle: "monthly" as const,
    popular: false,
    requiresStripe: false,
    features: [
      "publications3",
      "socialAccounts1",
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
    enabled: true,
    price: 19,
    billingCycle: "monthly" as const,
    popular: false,
    requiresStripe: true,
    features: [
      "publications50",
      "socialAccounts3",
      "storage10",
      "aiRequests100",
      "basicAnalytics",
      "basicScheduling",
      "calendarSync",
      "discordChannels1",
      "historyDays30",
      "emailSupport",
    ],
  },

  // ========================================
  // PLAN GROWTH - Para equipos en crecimiento
  // ========================================
  growth: {
    enabled: true,
    price: 35,
    billingCycle: "monthly" as const,
    popular: false,
    requiresStripe: true,
    features: [
      "publications100",
      "socialAccounts5",
      "storage50",
      "aiRequests300",
      "teamMembers5",
      "advancedAnalytics",
      "advancedScheduling",
      "schedulingRecurrence",
      "optimalTimes",
      "calendarSync",
      "discordChannels2",
      "approvalWorkflowsBasic",
      "historyDays60",
      "emailSupport",
    ],
  },

  // ========================================
  // PLAN PROFESSIONAL - Más popular
  // ========================================
  professional: {
    enabled: true,
    price: 49,
    billingCycle: "monthly" as const,
    popular: true,
    requiresStripe: true,
    features: [
      "publications200",
      "socialAccounts8",
      "storage100",
      "aiRequestsUnlimited",
      "advancedAnalytics",
      "advancedScheduling",
      "schedulingRecurrence",
      "queuePublishing",
      "optimalTimes",
      "calendarSync",
      "bulkOperations",
      "discordChannels5",
      "approvalWorkflowsBasic",
      "historyDays90",
      "customBranding",
      "prioritySupport",
    ],
  },

  // ========================================
  // PLAN ENTERPRISE - Para organizaciones
  // ========================================
  enterprise: {
    enabled: true,
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
      "schedulingRecurrence",
      "queuePublishing",
      "optimalTimes",
      "calendarSync",
      "bulkOperations",
      "discordChannelsUnlimited",
      "approvalWorkflowsAdvanced",
      "historyDays365",
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

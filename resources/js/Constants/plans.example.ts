/**
 * ============================================================================
 * EJEMPLO: Configuración de Planes con algunos ocultos
 * ============================================================================
 * 
 * Este es un ejemplo de cómo ocultar planes específicos.
 * Copia este contenido a plans.ts si quieres usar esta configuración.
 * 
 * En este ejemplo:
 * - ✅ Free: Visible
 * - ❌ Demo: Oculto (comentado)
 * - ✅ Starter: Visible
 * - ✅ Professional: Visible (marcado como popular)
 * - ❌ Enterprise: Oculto (enabled: false)
 * 
 * ============================================================================
 */

export const PLAN_CONFIG_EXAMPLE = {
  // ========================================
  // PLAN DEMO - OCULTO (comentado)
  // ========================================
  // demo: {
  //   enabled: true,
  //   price: 0,
  //   billingCycle: 'trial' as const,
  //   trialDays: 30,
  //   popular: false,
  //   requiresStripe: false,
  //   features: [
  //     'fullAccessDays',
  //     'publications100',
  //     'socialAccounts20',
  //     'storage50',
  //     'aiRequests500',
  //     'advancedAnalytics',
  //     'advancedScheduling',
  //     'calendarSync',
  //     'bulkOperations',
  //     'emailSupport',
  //   ],
  // },

  // ========================================
  // PLAN FREE - VISIBLE
  // ========================================
  free: {
    enabled: true, // ✅ Visible
    price: 0,
    billingCycle: 'monthly' as const,
    popular: false,
    requiresStripe: false,
    features: [
      'publications3',
      'socialAccounts2',
      'storage1',
      'aiRequests10',
      'basicAnalytics',
      'emailSupport',
    ],
  },

  // ========================================
  // PLAN STARTER - VISIBLE
  // ========================================
  starter: {
    enabled: true, // ✅ Visible
    price: 19,
    billingCycle: 'monthly' as const,
    popular: false,
    requiresStripe: true,
    features: [
      'publications50',
      'socialAccounts10',
      'storage10',
      'aiRequests100',
      'basicAnalytics',
      'advancedScheduling',
      'calendarSync',
      'emailSupport',
    ],
  },

  // ========================================
  // PLAN PROFESSIONAL - VISIBLE (Popular)
  // ========================================
  professional: {
    enabled: true, // ✅ Visible
    price: 49,
    billingCycle: 'monthly' as const,
    popular: true, // ⭐ Marcado como "Más Popular"
    requiresStripe: true,
    features: [
      'publications200',
      'socialAccounts50',
      'storage100',
      'aiRequestsUnlimited',
      'advancedAnalytics',
      'advancedScheduling',
      'calendarSync',
      'bulkOperations',
      'customBranding',
      'prioritySupport',
    ],
  },

  // ========================================
  // PLAN ENTERPRISE - OCULTO (enabled: false)
  // ========================================
  enterprise: {
    enabled: false, // ❌ Oculto
    price: 199,
    billingCycle: 'monthly' as const,
    popular: false,
    requiresStripe: true,
    features: [
      'publicationsUnlimited',
      'socialAccountsUnlimited',
      'storage1TB',
      'aiRequestsUnlimited',
      'advancedAnalytics',
      'whiteLabel',
      'apiAccess',
      'customIntegrations',
      'slaGuarantee',
      'dedicatedSupport',
    ],
  },
} as const;

/**
 * RESULTADO EN LA PÁGINA DE PRECIOS:
 * 
 * Solo se mostrarán estos 3 planes:
 * 
 * ┌─────────────┬─────────────┬─────────────────────┐
 * │    Free     │   Starter   │   Professional ⭐   │
 * │    $0/mes   │   $19/mes   │      $49/mes        │
 * └─────────────┴─────────────┴─────────────────────┘
 * 
 * Demo y Enterprise NO aparecerán en la lista.
 */

# IA Nativa + Unificación Admin — Plan de Refactorización

> Estado: **DIAGNÓSTICO + PLAN**. Ningún código eliminado todavía.
> Objetivo: (1) IA deja de ser producto/crédito y pasa a capacidad nativa transversal; (2) toda la config de IA vive solo en admin; (3) planes sin lenguaje de IA; (4) admin sigue misma arquitectura que la app principal.

---

## 0. Resumen ejecutivo

| Eje | Estado actual | Estado objetivo |
|-----|---------------|-----------------|
| IA como producto | Créditos, addons comprables, contador, config de API keys por cliente | IA invisible, incluida, contextual |
| Config de IA | Cliente elige proveedor/modelo/API key en su perfil | Solo super-admin, global, heredado por todos |
| Planes | `ai_requests_per_month` en cada plan | Planes solo hablan de funcionalidades del producto |
| Enforcement | Gate `canPerformAction('ai_requests')` + `incrementUsage` | Sin gate por crédito; límites internos globales de sistema (anti-abuso) |
| Admin | 3 controllers, nav con string hardcodeado, sin módulo IA | + AI Control Center; misma arquitectura que la app |

---

## 1. Referencias de IA que deben ELIMINARSE (cliente)

### 1.1 Frontend — créditos / consumo / compra

| Archivo | Qué es | Acción |
|---------|--------|--------|
| `resources/js/Components/AI/AICreditCounter.tsx` | Contador de créditos IA + CTA "Comprar Más Créditos" (texto hardcodeado ES) | **Borrar** componente y todos sus imports |
| `resources/js/Components/profile/Partials/AiConfigSection.tsx` | Cliente introduce API keys de gemini/deepseek/openai | **Borrar**. La config se mueve a admin |
| `resources/js/Components/Subscription/AddonCard.tsx`, `AddonBalanceCard.tsx`, `AddonBalanceWidget.tsx`, `AddonsPurchaseSection.tsx`, `AddonPackageCard.tsx` | Compra/estado de addons (hoy `ai_credits`) | Quitar la categoría `ai_credits`; conservar componentes solo si hay otros addons no-IA |
| `resources/js/Components/Dashboard/AddonsPromotionCard.tsx` | Promociona compra de créditos | Quitar promo de IA |
| `resources/js/Components/Subscription/PlanUsageCards.tsx`, `PlanUsageCard.tsx`, `UsageCard.tsx`, `UsageWarningBanner.tsx`, `LimitReachedModal.tsx` | Muestran uso de `ai_requests` | Quitar la métrica `ai_requests` de la UI de uso |
| `resources/js/Components/Layout/PlanUsageSection.tsx`, `profile/Partials/SubscriptionSection.tsx` | Resumen de uso con IA | Quitar fila de IA |
| `resources/js/Pages/Subscription/Addons.tsx`, `AddonPurchaseSuccess.tsx`, `Billing.tsx` | Flujo de compra de addons IA | Quitar rama `ai_credits` |
| `resources/js/Hooks/Addons/useAddons.ts`, `useActiveAddons.ts` | Exponen `summary.ai_credits` | Quitar campo IA del tipo/summary |
| `resources/js/types/Addons/addon.ts`, `types/Subscription/planUsage.ts` | Tipos con `ai_credits` / `ai_requests` | Quitar propiedades IA |
| `resources/js/Constants/navigation.ts` | Posible link a addons/créditos | Revisar y limpiar |
| Locales `en|es/subscription.json`, `payment.json`, `auth.json`, `translations.json` | Claves de créditos/consumo IA | Quitar claves y referencias |

### 1.2 Backend — créditos / consumo / límites de IA

| Archivo | Qué hace | Acción |
|---------|----------|--------|
| `config/addons.php` (líneas ~31-80) | Define packs `ai_credits` (ai_100/500/1000/5000) + `STRIPE_AI_*_PRICE_ID` | **Borrar** bloque `ai_credits` completo |
| `config/plans.php` | `ai_requests_per_month` en cada plan (500/10/100/300/-1…) | **Borrar** clave de todos los planes |
| `app/Http/Controllers/Ai/AIChatController.php` (l.52-57,119,174-179,227) | Gate `canPerformAction('ai_requests')` + `incrementUsage('ai_requests')` | Quitar gate por crédito. (Opcional: rate-limit interno global, no por plan) |
| `app/Services/Subscription/PlanLimitValidator.php` | Valida `ai_requests` | Quitar rama IA |
| `app/Services/Addons/AddonUsageService.php`, `Helpers/Subscription/AddonHelper.php`, `Services/Workspace/WorkspaceAddonService.php`, `WorkspaceUsageService.php` | Lógica de créditos IA | Quitar rama `ai_credits` |
| `app/Http/Controllers/Subscription/AddonsController.php`, `Api/WorkspaceAddonController.php`, `Webhooks/StripeAddonWebhookController.php` | Compra/webhook de addons IA | Quitar rama IA (dejar webhook solo para addons reales si existen) |
| `app/Console/Commands/CheckUsageLimits.php`, `DiagnoseSubscriptionUsage.php`, `TestPlanChange.php`, `Subscription/EnsureWorkspaceSubscriptions.php` | Tratan `ai_requests` como límite | Quitar `ai_requests` de los arrays de métricas |
| `app/Http/Controllers/Api/SubscriptionHistoryController.php` (l.105-107,159), `Profile/ProfileController.php` (l.77-78), `Subscription/SubscriptionController.php` (l.168) | Reportan `ai_requests_used/limit` | Quitar campos IA de la respuesta |
| `app/Http/Middleware/System/HandleInertiaRequests.php` | Comparte flags/uso IA a Inertia | Quitar props IA compartidas |
| DB `usage_metrics.ai_requests_used/limit` | Columnas de consumo IA | Migración: dejar de escribir; deprecar columnas (drop en fase posterior) |

### 1.3 Config del sistema (admin) que hoy expone IA como "addon"
- `app/Http/Controllers/Admin/SystemSettingsController.php` l.38/369: `SystemSetting::isAddonEnabled('ai_credits')` → reemplazar por flags del **AI Control Center** (`ai.enabled`, feature flags por funcionalidad), no por "addon comprable".

---

## 2. Planes — simplificación

Los planes deben describir **solo producto**. Mantener/normalizar estas dimensiones y **eliminar toda mención de IA**:

Mantener: `workspaces/brands`, `social_accounts`, `team_members`, `publications_per_month`, `storage`, `campaigns/automations`, `support_type`, retención de analítica.

Eliminar de `config/plans.php` y de la UI de pricing (`Components/Pricing/PricingPlansSection.tsx`, `PlanCard.tsx`, `Pages/Pricing/*`):
- `ai_requests_per_month`
- Cualquier bullet de plan tipo "X generaciones IA", "créditos", "tokens".

Copy nuevo recomendado en pricing: una sola línea transversal — **"Asistente de IA incluido en todos los planes"** (sin números, sin límites visibles).

---

## 3. IA nativa — dónde se integra (mapa funcional)

> La IA no se "invoca": aparece contextual. Backend ya tiene motor multi-proveedor (`AIService`, `LlmApiClient`) y superficie de asistente (`Components/AiAssistant/*`, `GlobalAiAssistant`). Se **reutiliza y expande**, no se reconstruye.

| Módulo | Función IA | Cuándo se ejecuta | Insumos | Valor |
|--------|-----------|-------------------|---------|-------|
| Creación de publicación | Hashtags, títulos, mejora de copy, corrección ortográfica/estilo, variantes | Al escribir / botón inline "Mejorar" | Texto actual, plataforma, marca, idioma | Copys mejores sin salir del editor |
| Editor | Sugerencia de campos (`suggestFields` ya existe) | Al abrir modal / on-demand | Campos parciales, tipo, límites de plataforma | Autocompletado inteligente |
| Calendario | Mejores días/horas + frecuencia recomendada | Al programar / vista calendario | Historial de posts + engagement propio | Programación óptima |
| Analytics | Resúmenes de métricas, insights automáticos, alertas | Al abrir dashboard / cron diario | Métricas históricas del workspace | Lectura sin analista |
| Campañas | Optimización de campaña, recomendación de contenido | Al crear/editar campaña | Objetivo, historial, industria | Campañas con mejor rendimiento |
| Contenido | Clasificación/etiquetado automático de assets | Al subir media | Media + metadata | Biblioteca ordenada sola |
| Onboarding/Perfil | Sugerencias por industria del cliente | Tras setup de marca | Industria, tono de marca | Personalización desde día 1 |
| Global (`GlobalAiAssistant`) | Asistente conversacional transversal | Botón flotante | Contexto de la página actual | Ayuda contextual siempre |

Todas estas funciones se activan/desactivan por **feature flag global en admin**, no por plan.

---

## 4. Nuevo módulo Admin — AI Control Center

Ruta: `routes/admin.php` → `prefix('admin')->name('admin.ai.')` bajo `super-admin`.
Página Inertia: `resources/js/Pages/Admin/AiControlCenter/Index.tsx` (+ subtabs).
Controller: `app/Http/Controllers/Admin/AiControlCenterController.php` (thin) → `app/Services/AI/Admin/AiConfigService.php`.

Secciones:
1. **Proveedores** — activar gemini/deepseek/openai, API keys (guardadas cifradas en `system_settings`, nunca expuestas al cliente).
2. **Modelos** — modelo por defecto y por tarea (ej. copy→deepseek, análisis→gemini).
3. **Prompts globales** — plantillas por funcionalidad, editables.
4. **Parámetros** — temperature, max_tokens, timeouts.
5. **Feature Flags** — on/off por funcionalidad del §3.
6. **Límites internos** — rate-limit anti-abuso global (por workspace/min), NO facturable.
7. **Monitoreo / Logs / Métricas / Costos** — requests por proveedor (ya existe `Cache ai_requests_{provider}`), costo estimado, errores.

**Herencia:** toda esta config es global. Cada request de IA de cualquier cliente resuelve proveedor/modelo/prompt/flags desde `AiConfigService` en runtime. El cliente no ve, elige ni configura nada.

---

## 5. Unificación arquitectónica Admin ↔ App

Diferencias detectadas y corrección (según reglas de CLAUDE.md):

| Inconsistencia | Ejemplo | Corrección |
|----------------|---------|------------|
| Strings hardcodeados en admin | `AdminNavigation.tsx` l.34 `'Control de Suscripciones'` | Mover a i18n `admin.navigation.*` |
| Controllers admin gordos | `SystemSettingsController` hace queries Eloquent + health checks inline | Extraer a `Services/Admin/*` + Repositories |
| Sin FormRequest en admin | `bulkUpdate`, `update` con `$request` directo | Crear `Update*Request` por acción |
| Componentes admin fuera de patrón | `Components/Admin/*` no usa `ui/`+`common/` uniformemente | Recomponer con Design System (`ui/system`) |
| Sin hooks/servicios TanStack en admin | Admin usa props Inertia directo | Crear `Hooks/admin/*` + `Services/adminService.ts` para datos dinámicos |
| Sin schemas Zod en formularios admin | Settings sin RHF+Zod | `schemas/admin.schema.ts` + RHF |

Regla: admin usa **exactamente** las mismas capas (ui/ → common/ → domain/ → Pages, Hooks → Services, schemas Zod, RHF) que el resto.

---

## 6. Cambios por capa (frontend / backend)

**Frontend**
- Borrar: `AICreditCounter`, `AiConfigSection`, rama `ai_credits` en addons/usage/tipos/locales.
- Añadir: componentes inline de IA (botones "Mejorar/Sugerir/Hashtags") reusando `aiAssistantService`; `Pages/Admin/AiControlCenter/*`; hooks/servicios admin.
- Normalizar admin al Design System + i18n.

**Backend**
- Borrar: packs `ai_credits` (addons), `ai_requests_per_month` (plans), gates/tracking de `ai_requests`.
- Añadir: `AiConfigService`, `AiControlCenterController` + FormRequests + Policy, resolución runtime de proveedor/modelo/prompt/flags en `AIService`.
- Migración: dejar de poblar `usage_metrics.ai_requests_*`; feature flags en `system_settings`.

---

## 7. Config global vs herencia

| Config | Dónde vive | Cómo se hereda |
|--------|-----------|----------------|
| Proveedor, modelo, API key, params, prompts, flags, límites internos | `system_settings` (solo admin) | `AiConfigService` los lee en cada request; aplica a todos los workspaces sin acción del cliente |
| Estado on/off de cada función IA | Feature flags admin | La UI del cliente muestra/oculta la ayuda IA según el flag |
| Nada facturable/medible por el cliente | — | El cliente nunca ve crédito, modelo ni consumo |

---

## 8. Secuencia de ejecución (fases)

- **F1 — Kill switch de facturación IA:** quitar `ai_credits` de `config/addons.php`, `ai_requests_per_month` de `config/plans.php`, gates en `AIChatController`, métricas IA en commands/controllers. (Backend, reversible por git.)
- **F2 — Limpieza UI cliente:** borrar `AICreditCounter`, `AiConfigSection`, filas/props IA en usage/addons/locales.
- **F3 — AI Control Center admin:** módulo nuevo + `AiConfigService` + resolución runtime en `AIService`.
- **F4 — IA nativa contextual:** botones inline por módulo (§3) reusando `aiAssistantService`.
- **F5 — Unificación arquitectónica admin** (§5) + migración drop de columnas IA.

Cada fase = rama + commits atómicos por concern.

---

## 9. Riesgos
- Webhooks Stripe de addons `ai_credits` en producción con compras vivas → migrar/refund antes de borrar SKUs.
- `usage_metrics.ai_requests_*`: no dropear columnas hasta que nada las escriba (F5).
- Clientes con API keys propias en `ai_settings` → decidir si se descartan (recomendado) al centralizar.

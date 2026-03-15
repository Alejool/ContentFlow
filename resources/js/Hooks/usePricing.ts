import { usePricingStore } from "@/stores/pricingStore";
import { router, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useState } from "react";

interface UsePricingOptions {
  isAuthenticated: boolean;
  currentPlan?: string;
  workspaceId?: number;
}

export type ModalType = "error" | "info" | "warning" | "confirm";

export interface PricingModal {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  closeLabel?: string;
}

const MODAL_CLOSED: PricingModal = {
  open: false,
  type: "info",
  title: "",
  message: "",
};

export function usePricing({ isAuthenticated, currentPlan, workspaceId }: UsePricingOptions) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [activePlans, setActivePlans] = useState<string[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [expiredPlans, setExpiredPlans] = useState<string[]>([]);
  const [modal, setModal] = useState<PricingModal>(MODAL_CLOSED);
  const { billingCycle, setBillingCycle } = usePricingStore();

  // Get auth from Inertia page props
  const { auth } = usePage<any>().props;

  // Listen for real-time subscription updates via broadcasting
  useEffect(() => {
    if (!isAuthenticated || !auth?.user?.id || !window.Echo) {
      return;
    }

    const channel = window.Echo.channel(`user.${auth.user.id}`);

    channel.listen(".subscription.updated", (event: any) => {
      // Refresh subscription data
      checkActiveSubscription().then(() => {
        // Reload Inertia props to update UI with new subscription data
        router.reload({ only: ["auth", "subscription", "currentPlan"] });
      });
    });

    return () => {
      channel.stopListening(".subscription.updated");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, auth?.user?.id]);

  const closeModal = useCallback(() => setModal(MODAL_CLOSED), []);

  const showModal = useCallback(
    (
      type: ModalType,
      title: string,
      message: string,
      opts?: Pick<PricingModal, "actionLabel" | "onAction" | "closeLabel">,
    ) => setModal({ open: true, type, title, message, ...opts }),
    [],
  );

  const redirectToDashboard = () => {
    // A full page reload is best here since auth props (like current_plan) are server-generated
    // and this ensures all global layouts (like the profile dropdown) reflect the new plan correctly
    window.location.href = "/dashboard";
  };

  const handleSelectPlan = async (planId: string, forceCheckout: boolean = false) => {
    if (!isAuthenticated) {
      router.visit("/register", { data: { plan: planId }, method: "get" });
      return;
    }

    if (planId === currentPlan) return;

    // ── Free / Demo ──────────────────────────────────────────────────────
    if (planId === "free" || planId === "demo") {
      const PAID = ["starter", "growth", "professional", "enterprise"];
      const hasActivePaid =
        activePlans.some((id) => PAID.includes(id)) ||
        activeSubscriptions.some((s) => PAID.includes(s.plan) && s.status === "active");

      if (hasActivePaid) {
        showModal(
          "warning",
          "Cambio bloqueado",
          "No puedes cambiar a un plan gratuito mientras tengas una suscripción de pago activa.\nPrimero debes cancelar tu suscripción actual.",
          {
            actionLabel: "Ir a Facturación",
            onAction: () => router.visit("/subscription/billing"),
            closeLabel: "Cerrar",
          },
        );
        return;
      }

      setIsLoading(planId);
      router.post(
        "/api/v1/subscription/activate-free-plan",
        { plan: planId },
        {
          onSuccess: () => {
            window.dispatchEvent(new CustomEvent("subscription-plan-changed"));
            redirectToDashboard();
          },
          onError: () => {
            showModal(
              "error",
              "Error al activar plan",
              "No se pudo activar el plan. Por favor, inténtalo de nuevo.",
            );
          },
          onFinish: () => setIsLoading(null),
        },
      );
      return;
    }

    // ── Paid plans ───────────────────────────────────────────────────────
    // Si forceCheckout es true, SIEMPRE ir a Stripe checkout (desde las tarjetas)
    if (forceCheckout) {
      setIsLoading(planId);
      try {
        const checkoutResponse = await fetch("/api/v1/subscription/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN":
              document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          },
          body: JSON.stringify({ plan: planId, workspace_id: workspaceId }),
        });

        const checkoutData = await checkoutResponse.json();
        setIsLoading(null);

        if (!checkoutResponse.ok) {
          showModal(
            "error",
            "Error al procesar el pago",
            checkoutData.error === "Invalid plan configuration"
              ? "Este plan requiere configuración de Stripe. Contacta al administrador."
              : checkoutData.message || checkoutData.error || "Error al procesar el pago.",
          );
          return;
        }

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          showModal(
            "error",
            "Error al crear sesión de pago",
            "No se pudo crear la sesión de pago.",
          );
        }
      } catch {
        setIsLoading(null);
        showModal("error", "Error de conexión", "No se pudo conectar con el servidor.");
      }
      return;
    }

    // Si NO es forceCheckout, intentar cambio automático (desde la tabla)
    setIsLoading(planId);
    try {
      const changeResponse = await fetch("/api/v1/subscription/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN":
            document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
        body: JSON.stringify({ plan: planId, workspace_id: workspaceId }),
      });

      const changeData = await changeResponse.json();

      // ── Success → reload data and redirect ─────────────────────────
      if (changeResponse.ok && changeData.success) {
        // Dispatch event FIRST
        window.dispatchEvent(new CustomEvent("subscription-plan-changed"));

        // Wait a bit for WebSocket to propagate
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Clear any cached subscription data
        await checkActiveSubscription();

        // Force Inertia to reload ALL shared data
        router.reload({
          preserveScroll: false,
          preserveState: false,
          onSuccess: () => {
            // Show success message after reload
            showModal(
              "info",
              "Plan actualizado",
              `Tu plan ha sido cambiado exitosamente a ${changeData.plan}.`,
              {
                closeLabel: "Entendido",
              },
            );
          },
        });

        return;
      }

      setIsLoading(null);

      // ── 403 — cancellation required ──────────────────────────────────
      if (changeResponse.status === 403 && changeData.requires_cancellation) {
        showModal(
          "warning",
          "Cancelación requerida",
          changeData.message ||
            "No puedes cambiar manualmente a ese plan mientras tengas una suscripción activa.",
          {
            actionLabel: "Ir a Facturación",
            onAction: () => router.visit("/subscription/billing"),
            closeLabel: "Entendido",
          },
        );
        return;
      }

      // ── 402 — need Stripe portal or checkout ─────────────────────────
      if (changeResponse.status === 402 && changeData.requires_portal) {
        setIsLoading(planId);
        window.location.href = changeData.url;
        return;
      }

      if (changeResponse.status === 402 && changeData.requires_checkout) {
        setIsLoading(planId); // keep spinner while redirecting to Stripe
        const checkoutResponse = await fetch("/api/v1/subscription/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN":
              document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          },
          body: JSON.stringify({ plan: planId, workspace_id: workspaceId }),
        });

        const checkoutData = await checkoutResponse.json();
        setIsLoading(null);

        if (!checkoutResponse.ok) {
          showModal(
            "error",
            "Error al procesar el pago",
            checkoutData.error === "Invalid plan configuration"
              ? "Este plan requiere configuración de Stripe. Contacta al administrador."
              : checkoutData.message || checkoutData.error || "Error al procesar el pago.",
          );
          return;
        }

        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          showModal(
            "error",
            "Error al crear sesión de pago",
            "No se pudo crear la sesión de pago.",
          );
        }
        return;
      }

      showModal(
        "error",
        "Error al cambiar el plan",
        changeData.message || changeData.error || "Error inesperado.",
      );
    } catch {
      setIsLoading(null);
      showModal("error", "Error de conexión", "No se pudo conectar con el servidor.");
    }
  };

  const checkActiveSubscription = async (): Promise<boolean> => {
    try {
      const url = new URL("/api/v1/subscription/check-active", window.location.origin);
      if (workspaceId) url.searchParams.append("workspace_id", workspaceId.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-CSRF-TOKEN":
            document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.active_plans) setActivePlans(data.active_plans);
        if (data.active_subscriptions) setActiveSubscriptions(data.active_subscriptions);
        if (data.expired_plans) setExpiredPlans(data.expired_plans);
        return data.has_active_subscription || false;
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
    return false;
  };

  const formatPrice = (price: number) =>
    billingCycle === "yearly" ? Math.floor(price * 12 * 0.8) : price;

  const isPlanCurrent = (planId: string) => currentPlan === planId;

  return {
    isLoading,
    activePlans,
    activeSubscriptions,
    expiredPlans,
    billingCycle,
    setBillingCycle,
    handleSelectPlan,
    formatPrice,
    isPlanCurrent,
    checkActiveSubscription,
    modal,
    closeModal,
  };
}

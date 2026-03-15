import { useState, useEffect } from "react";
import axios from "axios";

export interface ActiveAddon {
  id?: number;
  sku: string;
  name: string;
  type: "ai_credits" | "storage" | "publications" | "team_members";
  amount: number;
  used: number;
  remaining: number;
  percentage: number;
  price?: number;
  total_price?: number;
  purchase_count?: number;
  purchased_at?: string;
  first_purchased_at?: string;
  last_purchased_at?: string;
  expires_at: string | null;
  status: "active" | "expired" | "depleted";
}

interface UseActiveAddonsReturn {
  addons: ActiveAddon[];
  loading: boolean;
  error: string | null;
  totalSpent: number;
  refresh: () => void;
}

export function useActiveAddons(): UseActiveAddonsReturn {
  const [addons, setAddons] = useState<ActiveAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[useActiveAddons] Fetching from /api/v1/addons/active...");
      const response = await axios.get("/api/v1/addons/active");

      console.log("[useActiveAddons] Response:", response.data);
      setAddons(response.data.addons || []);
      setTotalSpent(response.data.total_spent || 0);
    } catch (err: any) {
      console.error("[useActiveAddons] Error fetching active addons:", err);
      console.error("[useActiveAddons] Error response:", err.response);

      // Si hay error de autenticación o la ruta no existe, NO usar datos de ejemplo
      // Simplemente mostrar vacío
      setAddons([]);
      setTotalSpent(0);

      if (err.response?.status === 401) {
        setError("No autenticado");
      } else if (err.response?.status === 404) {
        setError("Ruta no encontrada");
      } else if (!err.response) {
        setError("Error de red");
      } else {
        setError(err.response?.data?.message || "Error al cargar add-ons activos");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  return {
    addons,
    loading,
    error,
    totalSpent,
    refresh: fetchAddons,
  };
}

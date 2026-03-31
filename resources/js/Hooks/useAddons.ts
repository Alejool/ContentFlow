import { useState, useEffect } from 'react';
import axios from 'axios';
import type { AddonPackages, AddonSummary, AddonBalance, WorkspaceAddon } from '@/types/addon';

interface UseAddonsReturn {
  packages: AddonPackages | null;
  summary: AddonSummary | null;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  purchaseAddon: (sku: string, quantity?: number) => Promise<void>;
  getBalanceByType: (type: 'ai_credits' | 'storage') => Promise<AddonBalance | null>;
}

export const useAddons = (): UseAddonsReturn => {
  const [packages, setPackages] = useState<AddonPackages | null>(null);
  const [summary, setSummary] = useState<AddonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [packagesRes, summaryRes] = await Promise.all([
        axios.get('/api/v1/addons'),
        axios.get('/api/v1/addons/balance'),
      ]);

      setPackages(packagesRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err: any) {
      console.error('Error loading addons:', err);
      setError(err.response?.data?.message || 'Error al cargar add-ons');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      const response = await axios.get('/api/v1/addons/balance');
      setSummary(response.data.data);
    } catch (err: any) {
      console.error('Error refreshing balance:', err);
    }
  };

  const purchaseAddon = async (sku: string, quantity: number = 1) => {
    try {
      const response = await axios.post('/api/v1/addons/checkout', {
        sku,
        quantity,
      });

      const { url } = response.data.data;

      // Redirigir a Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('Error creating checkout:', err);
      throw new Error(err.response?.data?.message || 'Error al iniciar el proceso de compra');
    }
  };

  const getBalanceByType = async (type: 'ai_credits' | 'storage'): Promise<AddonBalance | null> => {
    try {
      const response = await axios.get(`/api/v1/addons/balance/${type}`);
      return response.data.data;
    } catch (err: any) {
      console.error(`Error getting ${type} balance:`, err);
      return null;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    packages,
    summary,
    loading,
    error,
    refreshBalance,
    purchaseAddon,
    getBalanceByType,
  };
};

export const useAddonHistory = () => {
  const [history, setHistory] = useState<WorkspaceAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/addons/history');
      setHistory(response.data.data.data);
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError(err.response?.data?.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async (addonId: number) => {
    try {
      await axios.post(`/api/v1/addons/${addonId}/refund`);
      await loadHistory(); // Recargar historial
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al procesar el reembolso');
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return {
    history,
    loading,
    error,
    refreshHistory: loadHistory,
    requestRefund,
  };
};

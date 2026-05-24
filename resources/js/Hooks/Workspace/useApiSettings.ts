import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { ApiToken, ApiTokenForm } from '@/types/Workspace/apiSettings';

// Ziggy route helper is declared globally in this project
declare const route: (name: string, params?: unknown) => string;

export function useApiSettings(
  workspace: { id?: number | string; slug: string },
  canManageWorkspace: boolean,
) {
  const { t } = useTranslation();

  // — Token list & loading
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);

  // — New token creation
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState(false);

  // — Revocation modal
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<number | null>(null);
  const [revoking, setRevoking] = useState(false);

  // — Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data, setData, reset } = useForm<ApiTokenForm>({ name: '' });

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(route('workspaces.api-tokens.index', workspace.slug));
      const resData = response.data;
      const fetched = resData?.data?.tokens || resData?.tokens || [];
      setTokens(fetched);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch tokens', error);
    } finally {
      setLoading(false);
    }
  }, [workspace.slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTokens();
  }, [fetchTokens]);

  // ─── Pagination derived state ─────────────────────────────────────────────
  const totalTokens = tokens.length;
  const lastPage = Math.max(1, Math.ceil(totalTokens / perPage));
  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return tokens.slice(start, start + perPage);
  }, [tokens, currentPage, perPage]);

  // ─── Token creation ───────────────────────────────────────────────────────
  const createTokenDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || isCreating || !canManageWorkspace) return;

    try {
      setIsCreating(true);
      const response = await axios.post(route('workspaces.api-tokens.store', workspace.slug), {
        name: data.name,
      });
      setGeneratedToken(response.data.token || response.data.data?.token);
      toast.success('API token creado exitosamente');
      reset('name');
      fetchTokens();
    } catch (error) {
      let message = 'Error al crear el token';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Revocation ───────────────────────────────────────────────────────────
  const handleRevokeToken = (tokenId: number) => {
    setTokenToRevoke(tokenId);
    setIsRevokeModalOpen(true);
  };

  const confirmRevocation = async () => {
    if (!tokenToRevoke) return;
    try {
      setRevoking(true);
      await axios.delete(route('workspaces.api-tokens.destroy', [workspace.slug, tokenToRevoke]));
      toast.success('Token revocado exitosamente');
      setIsRevokeModalOpen(false);
      setTokenToRevoke(null);
      fetchTokens();
    } catch {
      toast.error(t('workspace.api.table.revoke_error'));
    } finally {
      setRevoking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied') || 'Copiado al portapapeles');
  };

  return {
    tokens,
    loading,
    generatedToken,
    setGeneratedToken,
    showToken,
    setShowToken,
    isCreating,
    isRevokeModalOpen,
    setIsRevokeModalOpen,
    tokenToRevoke,
    revoking,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    data,
    setData,
    reset,
    fetchTokens,
    totalTokens,
    lastPage,
    paginatedTokens,
    createTokenDirectly,
    handleRevokeToken,
    confirmRevocation,
    copyToClipboard,
  };
}

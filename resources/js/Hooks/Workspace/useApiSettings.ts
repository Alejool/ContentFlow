import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { ApiToken, ApiTokenForm, ApiScopeGroups, ApiScopeKey } from '@/types/Workspace/apiSettings';
import { createApiTokenSchema } from '@/schemas/Workspace/apiToken';

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

  const { data, setData, reset } = useForm<ApiTokenForm>({ name: '', abilities: [] });
  const [nameError, setNameError] = useState<string | null>(null);

  // — Scope groups (loaded once)
  const [scopeGroups, setScopeGroups] = useState<ApiScopeGroups>({});

  useEffect(() => {
    axios.get(route('workspaces.api-tokens.scopes')).then((r) => {
      setScopeGroups(r.data?.data?.scopes ?? r.data?.scopes ?? {});
    }).catch(() => {});
  }, []);

  const toggleAbility = (ability: ApiScopeKey) => {
    setData('abilities', data.abilities.includes(ability)
      ? data.abilities.filter((a) => a !== ability)
      : [...data.abilities, ability]);
  };

  const toggleGroup = (groupScopes: Record<string, string>) => {
    const keys = Object.keys(groupScopes) as ApiScopeKey[];
    const allSelected = keys.every((k) => data.abilities.includes(k));
    setData('abilities', allSelected
      ? data.abilities.filter((a) => !keys.includes(a))
      : [...new Set([...data.abilities, ...keys])]);
  };

  const selectAll = () => {
    const all = Object.values(scopeGroups).flatMap((g) => Object.keys(g.scopes)) as ApiScopeKey[];
    setData('abilities', all);
  };

  const clearAll = () => setData('abilities', []);

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
    if (isCreating || !canManageWorkspace) return;

    // Validate with Zod before hitting the server
    const result = createApiTokenSchema.safeParse({ name: data.name, abilities: data.abilities });
    if (!result.success) {
      const firstError = result.error.issues[0];
      setNameError(t(firstError.message));
      return;
    }
    setNameError(null);

    try {
      setIsCreating(true);
      const response = await axios.post(route('workspaces.api-tokens.store', workspace.slug), {
        name: data.name,
        abilities: data.abilities.length > 0 ? data.abilities : ['*'],
      });
      setGeneratedToken(response.data.token || response.data.data?.token);
      toast.success(t('workspace.api.create_success'));
      reset('name');
      setData('abilities', []);
      fetchTokens();
    } catch (error) {
      let message = t('workspace.api.create_error');
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
    // Form validation
    nameError,
    setNameError,
    // Scope management
    scopeGroups,
    toggleAbility,
    toggleGroup,
    selectAll,
    clearAll,
    copyToClipboard,
  };
}

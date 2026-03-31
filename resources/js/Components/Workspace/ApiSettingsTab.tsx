import AlertCard from '@/Components/common/Modern/AlertCard';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import AdvancedPagination from '@/Components/common/ui/AdvancedPagination';
import { formatDateString, formatDateTimeStyled } from '@/Utils/dateHelpers';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  Info,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ApiSettingsTabProps {
  workspace: any;
  canManageWorkspace: boolean;
}

const PER_PAGE_OPTIONS = [5, 10, 25];

/** Returns a token type label + badge colour */
function getTokenMeta(token: any): {
  label: string;
  labelColor: string;
  isExpired: boolean;
  isRefreshToken: boolean;
} {
  const isProgrammaticAccess = token.name?.startsWith('api-access:');
  const isRefresh = token.name?.startsWith('api-refresh:');
  const isExpired = token.expires_at && new Date(token.expires_at) < new Date();

  if (isRefresh) {
    return {
      label: 'API · Refresh',
      labelColor: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
      isExpired,
      isRefreshToken: true,
    };
  }
  if (isProgrammaticAccess) {
    return {
      label: 'API · Access',
      labelColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      isExpired,
      isRefreshToken: false,
    };
  }
  return {
    label: 'Dashboard',
    labelColor: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
    isExpired: false, // dashboard tokens never expire
    isRefreshToken: false,
  };
}

export default function ApiSettingsTab({ workspace, canManageWorkspace }: ApiSettingsTabProps) {
  const { t } = useTranslation();

  // — Token list & loading
  const [tokens, setTokens] = useState<any[]>([]);
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

  const { data, setData, reset } = useForm({ name: '' });

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchTokens = async () => {
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
  };

  useEffect(() => {
    fetchTokens();
  }, [workspace.slug]);

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear el token');
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

  // ─── Expiry cell renderer ─────────────────────────────────────────────────
  const renderExpiry = (token: any) => {
    const meta = getTokenMeta(token);
    if (!token.expires_at) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Permanente
        </span>
      );
    }
    const date = new Date(token.expires_at);
    const isExpired = date < new Date();
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
          <XCircle className="h-3 w-3" />
          Expirado — {formatDateString(date)}
        </span>
      );
    }
    const diffMs = date.getTime() - Date.now();
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffD = Math.floor(diffH / 24);
    const relative = diffD > 0 ? `en ${diffD}d` : diffH > 0 ? `en ${diffH}h` : 'pronto';
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
        <Clock className="h-3 w-3" />
        {formatDateString(date)} ({relative})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Generated Token Alert ─────────────────────────────── */}
      {generatedToken && (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-4 rounded-lg border border-green-200 bg-green-50 p-6 duration-500 dark:border-green-800 dark:bg-green-900/30">
          <div className="flex items-center gap-3 text-green-800 dark:text-green-300">
            <CheckCircle2 className="h-6 w-6" />
            <h3 className="text-lg font-bold">Token generado exitosamente</h3>
          </div>
          <p className="text-sm text-green-700 dark:text-green-400">
            Copia este token ahora. Por seguridad, <strong>no se mostrará de nuevo</strong>.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 select-all items-center justify-between break-all rounded-md border border-green-300 bg-white p-3 font-mono text-sm dark:border-green-700 dark:bg-neutral-900">
              <span>
                {showToken
                  ? generatedToken
                  : '•'.repeat(generatedToken.length > 40 ? 40 : generatedToken.length)}
              </span>
              <button
                onClick={() => setShowToken(!showToken)}
                className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <button
              onClick={() => copyToClipboard(generatedToken)}
              className="rounded-md bg-green-600 p-3 text-white transition-colors hover:bg-green-700"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => {
              setGeneratedToken(null);
              setShowToken(false);
            }}
            className="text-sm font-medium text-green-800 hover:underline dark:text-green-300"
          >
            Lo guardé, cerrar este mensaje
          </button>
        </div>
      )}

      {/* ── Token Table Card ──────────────────────────────────── */}
      <div className="border border-neutral-200 bg-white shadow dark:border-neutral-700 dark:bg-neutral-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900/30">
                <Key className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {t('workspace.api.title') || 'API Access Tokens'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                  {t('workspace.api.description') ||
                    'Gestiona todos los tokens de acceso a la API de Intellipost.'}
                </p>
              </div>
            </div>

            {canManageWorkspace && !generatedToken && (
              <form onSubmit={createTokenDirectly} className="flex gap-2">
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder={
                    t('workspace.api.token_name_placeholder') || 'Ej: Marketing Automation'
                  }
                  className="block w-full rounded-md border-neutral-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-900 sm:w-64"
                  required
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center whitespace-nowrap rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {t('workspace.api.generate') || 'Generar'}
                </button>
              </form>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
              <Key className="mx-auto mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
              <p className="text-gray-500 dark:text-neutral-400">
                {t('workspace.api.no_tokens') || 'No hay tokens generados aún.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info box */}
              <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="mb-1 font-semibold">{t('workspace.api.usage_info.title')}</p>
                  <p
                    className="mb-2"
                    dangerouslySetInnerHTML={{
                      __html: t('workspace.api.usage_info.description'),
                    }}
                  />
                  <div className="overflow-x-auto rounded border border-blue-200/50 bg-white/50 p-2 font-mono text-xs dark:border-blue-800/50 dark:bg-black/20">
                    curl -X GET "https://tu-dominio.com/api/v1/endpoint" \<br />
                    &nbsp;&nbsp;-H "Authorization: Bearer TU_TOKEN_API" \<br />
                    &nbsp;&nbsp;-H "Accept: application/json"
                  </div>
                  <p
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400"
                    dangerouslySetInnerHTML={{
                      __html: t('workspace.api.usage_info.refresh_token_help'),
                    }}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                    {t('workspace.api.token_types.dashboard')}
                  </span>
                  — {t('workspace.api.token_types.dashboard_description')}
                </span>
                <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {t('workspace.api.token_types.api_access')}
                  </span>
                  — {t('workspace.api.token_types.api_access_description')}
                </span>
                <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <span className="rounded bg-violet-100 px-1.5 py-0.5 font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    {t('workspace.api.token_types.api_refresh')}
                  </span>
                  — {t('workspace.api.token_types.api_refresh_description')}
                </span>
              </div>

              {/* Refresh list button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchTokens}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {t('workspace.api.table.refresh_list')}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                    <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          {t('workspace.api.table.name')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          {t('workspace.api.table.type')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          {t('workspace.api.table.last_used')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          {t('workspace.api.table.expires_status')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          {t('workspace.api.table.created')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          {t('workspace.api.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
                      {paginatedTokens.map((token) => {
                        const meta = getTokenMeta(token);
                        return (
                          <tr
                            key={token.id}
                            className={`transition-colors ${meta.isExpired ? 'opacity-60' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/30'}`}
                          >
                            {/* Name */}
                            <td className="max-w-[180px] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              <span className="block truncate" title={token.name}>
                                {token.name}
                              </span>
                            </td>

                            {/* Type badge */}
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${meta.labelColor}`}
                              >
                                {meta.label}
                              </span>
                            </td>

                            {/* Last used */}
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-neutral-400">
                              {token.last_used_at
                                ? formatDateTimeStyled(token.last_used_at, 'short', 'short')
                                : t('workspace.api.table.never_used')}
                            </td>

                            {/* Expiry */}
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                              {renderExpiry(token)}
                            </td>

                            {/* Created at */}
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-neutral-400">
                              {formatDateTimeStyled(token.created_at, 'short', 'short')}
                            </td>

                            {/* Actions */}
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              {canManageWorkspace && (
                                <button
                                  onClick={() => handleRevokeToken(token.id)}
                                  className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                  title={t('workspace.api.table.revoke_token')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalTokens > (PER_PAGE_OPTIONS[0] ?? 5) && (
                  <AdvancedPagination
                    currentPage={currentPage}
                    lastPage={lastPage}
                    total={totalTokens}
                    perPage={perPage || 12}
                    onPageChange={(p) => setCurrentPage(p)}
                    onPerPageChange={(pp) => {
                      setPerPage(pp);
                      setCurrentPage(1);
                    }}
                    t={t}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── API Documentation Downloads ───────────────────────── */}
      <div className="border border-neutral-200 bg-white shadow dark:border-neutral-700 dark:bg-neutral-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {t('workspace.api.documentation.title')}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                {t('workspace.api.documentation.description')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Markdown Guide */}
            <a
              href={route('workspaces.api-docs.download', [workspace.slug, { type: 'markdown' }])}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex cursor-pointer items-start gap-4 rounded-xl border-2 border-neutral-200 p-5 transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50 dark:border-neutral-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20"
            >
              <div className="shrink-0 rounded-lg bg-indigo-100 p-3 transition-colors group-hover:bg-indigo-200 dark:bg-indigo-900/40 dark:group-hover:bg-indigo-900/60">
                <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('workspace.api.documentation.enterprise_guide_title')}
                  </h4>
                  <Download className="h-4 w-4 shrink-0 text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                  {t('workspace.api.documentation.enterprise_guide_description')}
                </p>
                <span className="mt-2 inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  {t('workspace.api.documentation.enterprise_guide_badge')}
                </span>
              </div>
            </a>

            {/* OpenAPI JSON */}
            <a
              href={route('workspaces.api-docs.download', [workspace.slug, { type: 'openapi' }])}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex cursor-pointer items-start gap-4 rounded-xl border-2 border-neutral-200 p-5 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50 dark:border-neutral-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20"
            >
              <div className="shrink-0 rounded-lg bg-emerald-100 p-3 transition-colors group-hover:bg-emerald-200 dark:bg-emerald-900/40 dark:group-hover:bg-emerald-900/60">
                <FileCode2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('workspace.api.documentation.openapi_title')}
                  </h4>
                  <Download className="h-4 w-4 shrink-0 text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                  {t('workspace.api.documentation.openapi_description')}
                </p>
                <span className="mt-2 inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  {t('workspace.api.documentation.openapi_badge')}
                </span>
              </div>
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-400 dark:text-neutral-500">
            {t('workspace.api.documentation.pdf_conversion_help')}
          </p>
        </div>
      </div>

      {/* ── Security Notice ───────────────────────────────────── */}
      <AlertCard
        type="warning"
        title={t('workspace.api.security_notice') || 'Aviso de Seguridad'}
        message={
          t('workspace.api.security_help') ||
          'Los tokens API otorgan acceso completo a este workspace. Nunca los compartas ni los incluyas en repositorios públicos.'
        }
      />

      {/* ── Revoke Confirmation Modal ─────────────────────────── */}
      <DynamicModal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        title={t('common.deleteConfirmTitle') || 'Confirmar eliminación'}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
            <p className="font-medium">
              {t('workspace.api.revoke_confirm') ||
                '¿Estás seguro de que quieres revocar este token? Dejará de funcionar inmediatamente.'}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Esta acción es irreversible. El sistema o aplicación que use este token perderá el
            acceso al instante.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsRevokeModalOpen(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {t('common.cancel') || 'Cancelar'}
            </button>
            <button
              onClick={confirmRevocation}
              disabled={revoking}
              className="flex items-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {revoking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('common.delete') || 'Eliminar'}
            </button>
          </div>
        </div>
      </DynamicModal>
    </div>
  );
}

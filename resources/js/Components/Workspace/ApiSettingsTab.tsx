import AlertCard from "@/Components/common/Modern/AlertCard";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import AdvancedPagination from "@/Components/common/ui/AdvancedPagination";
import { formatDateString, formatDateTimeStyled } from "@/Utils/dateHelpers";
import { useForm } from "@inertiajs/react";
import axios from "axios";
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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
  const isProgrammaticAccess = token.name?.startsWith("api-access:");
  const isRefresh = token.name?.startsWith("api-refresh:");
  const isExpired = token.expires_at && new Date(token.expires_at) < new Date();

  if (isRefresh) {
    return {
      label: "API · Refresh",
      labelColor:
        "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
      isExpired,
      isRefreshToken: true,
    };
  }
  if (isProgrammaticAccess) {
    return {
      label: "API · Access",
      labelColor:
        "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      isExpired,
      isRefreshToken: false,
    };
  }
  return {
    label: "Dashboard",
    labelColor:
      "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300",
    isExpired: false, // dashboard tokens never expire
    isRefreshToken: false,
  };
}

export default function ApiSettingsTab({
  workspace,
  canManageWorkspace,
}: ApiSettingsTabProps) {
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

  const { data, setData, reset } = useForm({ name: "" });

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        route("workspaces.api-tokens.index", workspace.slug),
      );
      const resData = response.data;
      const fetched = resData?.data?.tokens || resData?.tokens || [];
      setTokens(fetched);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch tokens", error);
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
      const response = await axios.post(
        route("workspaces.api-tokens.store", workspace.slug),
        { name: data.name },
      );
      setGeneratedToken(response.data.token || response.data.data?.token);
      toast.success("API token creado exitosamente");
      reset("name");
      fetchTokens();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear el token");
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
      await axios.delete(
        route("workspaces.api-tokens.destroy", [workspace.slug, tokenToRevoke]),
      );
      toast.success("Token revocado exitosamente");
      setIsRevokeModalOpen(false);
      setTokenToRevoke(null);
      fetchTokens();
    } catch {
      toast.error(t("workspace.api.table.revoke_error"));
    } finally {
      setRevoking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("common.copied") || "Copiado al portapapeles");
  };

  // ─── Expiry cell renderer ─────────────────────────────────────────────────
  const renderExpiry = (token: any) => {
    const meta = getTokenMeta(token);
    if (!token.expires_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Permanente
        </span>
      );
    }
    const date = new Date(token.expires_at);
    const isExpired = date < new Date();
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          Expirado — {formatDateString(date)}
        </span>
      );
    }
    const diffMs = date.getTime() - Date.now();
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffD = Math.floor(diffH / 24);
    const relative =
      diffD > 0 ? `en ${diffD}d` : diffH > 0 ? `en ${diffH}h` : "pronto";
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
        <Clock className="w-3 h-3" />
        {formatDateString(date)} ({relative})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Generated Token Alert ─────────────────────────────── */}
      {generatedToken && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 text-green-800 dark:text-green-300">
            <CheckCircle2 className="h-6 w-6" />
            <h3 className="text-lg font-bold">Token generado exitosamente</h3>
          </div>
          <p className="text-sm text-green-700 dark:text-green-400">
            Copia este token ahora. Por seguridad,{" "}
            <strong>no se mostrará de nuevo</strong>.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-neutral-900 border border-green-300 dark:border-green-700 rounded-md p-3 font-mono text-sm break-all select-all flex items-center justify-between">
              <span>
                {showToken
                  ? generatedToken
                  : "•".repeat(
                      generatedToken.length > 40 ? 40 : generatedToken.length,
                    )}
              </span>
              <button
                onClick={() => setShowToken(!showToken)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
              >
                {showToken ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              onClick={() => copyToClipboard(generatedToken)}
              className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => {
              setGeneratedToken(null);
              setShowToken(false);
            }}
            className="text-sm font-medium text-green-800 dark:text-green-300 hover:underline"
          >
            Lo guardé, cerrar este mensaje
          </button>
        </div>
      )}

      {/* ── Token Table Card ──────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-800 shadow sm:rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="px-4 py-5 sm:p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Key className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {t("workspace.api.title") || "API Access Tokens"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                  {t("workspace.api.description") ||
                    "Gestiona todos los tokens de acceso a la API de ContentFlow."}
                </p>
              </div>
            </div>

            {canManageWorkspace && !generatedToken && (
              <form onSubmit={createTokenDirectly} className="flex gap-2">
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder={
                    t("workspace.api.token_name_placeholder") ||
                    "Ej: Marketing Automation"
                  }
                  className="block w-full sm:w-64 rounded-md border-neutral-300 dark:border-neutral-600 dark:bg-neutral-900 text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 whitespace-nowrap"
                >
                  {isCreating ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t("workspace.api.generate") || "Generar"}
                </button>
              </form>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700">
              <Key className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-neutral-400">
                {t("workspace.api.no_tokens") || "No hay tokens generados aún."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Info box */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">
                    {t("workspace.api.usage_info.title")}
                  </p>
                  <p
                    className="mb-2"
                    dangerouslySetInnerHTML={{
                      __html: t("workspace.api.usage_info.description"),
                    }}
                  />
                  <div className="bg-white/50 dark:bg-black/20 p-2 rounded border border-blue-200/50 dark:border-blue-800/50 font-mono text-xs overflow-x-auto">
                    curl -X GET "https://tu-dominio.com/api/v1/endpoint" \<br />
                    &nbsp;&nbsp;-H "Authorization: Bearer TU_TOKEN_API" \<br />
                    &nbsp;&nbsp;-H "Accept: application/json"
                  </div>
                  <p
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400"
                    dangerouslySetInnerHTML={{
                      __html: t("workspace.api.usage_info.refresh_token_help"),
                    }}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium">
                    {t("workspace.api.token_types.dashboard")}
                  </span>
                  — {t("workspace.api.token_types.dashboard_description")}
                </span>
                <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                    {t("workspace.api.token_types.api_access")}
                  </span>
                  — {t("workspace.api.token_types.api_access_description")}
                </span>
                <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium">
                    {t("workspace.api.token_types.api_refresh")}
                  </span>
                  — {t("workspace.api.token_types.api_refresh_description")}
                </span>
              </div>

              {/* Refresh list button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchTokens}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                  {t("workspace.api.table.refresh_list")}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                    <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t("workspace.api.table.name")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t("workspace.api.table.type")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t("workspace.api.table.last_used")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t("workspace.api.table.expires_status")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t("workspace.api.table.created")}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                          {t("workspace.api.table.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                      {paginatedTokens.map((token) => {
                        const meta = getTokenMeta(token);
                        return (
                          <tr
                            key={token.id}
                            className={`transition-colors ${meta.isExpired ? "opacity-60" : "hover:bg-neutral-50 dark:hover:bg-neutral-700/30"}`}
                          >
                            {/* Name */}
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white max-w-[180px]">
                              <span
                                className="block truncate"
                                title={token.name}
                              >
                                {token.name}
                              </span>
                            </td>

                            {/* Type badge */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${meta.labelColor}`}
                              >
                                {meta.label}
                              </span>
                            </td>

                            {/* Last used */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                              {token.last_used_at
                                ? formatDateTimeStyled(
                                    token.last_used_at,
                                    "short",
                                    "short",
                                  )
                                : t("workspace.api.table.never_used")}
                            </td>

                            {/* Expiry */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {renderExpiry(token)}
                            </td>

                            {/* Created at */}
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                              {formatDateTimeStyled(
                                token.created_at,
                                "short",
                                "short",
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              {canManageWorkspace && (
                                <button
                                  onClick={() => handleRevokeToken(token.id)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title={t("workspace.api.table.revoke_token")}
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
                {totalTokens > PER_PAGE_OPTIONS[0] && (
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
      <div className="bg-white dark:bg-neutral-800 shadow sm:rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {t("workspace.api.documentation.title")}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                {t("workspace.api.documentation.description")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Markdown Guide */}
            <a
              href={route("workspaces.api-docs.download", [
                workspace.slug,
                { type: "markdown" },
              ])}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-5 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 cursor-pointer"
            >
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/60 transition-colors shrink-0">
                <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t("workspace.api.documentation.enterprise_guide_title")}
                  </h4>
                  <Download className="h-4 w-4 text-indigo-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                  {t(
                    "workspace.api.documentation.enterprise_guide_description",
                  )}
                </p>
                <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                  {t("workspace.api.documentation.enterprise_guide_badge")}
                </span>
              </div>
            </a>

            {/* OpenAPI JSON */}
            <a
              href={route("workspaces.api-docs.download", [
                workspace.slug,
                { type: "openapi" },
              ])}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-5 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 cursor-pointer"
            >
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors shrink-0">
                <FileCode2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t("workspace.api.documentation.openapi_title")}
                  </h4>
                  <Download className="h-4 w-4 text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                  {t("workspace.api.documentation.openapi_description")}
                </p>
                <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                  {t("workspace.api.documentation.openapi_badge")}
                </span>
              </div>
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-400 dark:text-neutral-500">
            {t("workspace.api.documentation.pdf_conversion_help")}
          </p>
        </div>
      </div>

      {/* ── Security Notice ───────────────────────────────────── */}
      <AlertCard
        type="warning"
        title={t("workspace.api.security_notice") || "Aviso de Seguridad"}
        message={
          t("workspace.api.security_help") ||
          "Los tokens API otorgan acceso completo a este workspace. Nunca los compartas ni los incluyas en repositorios públicos."
        }
      />

      {/* ── Revoke Confirmation Modal ─────────────────────────── */}
      <DynamicModal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        title={t("common.deleteConfirmTitle") || "Confirmar eliminación"}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
            <p className="font-medium">
              {t("workspace.api.revoke_confirm") ||
                "¿Estás seguro de que quieres revocar este token? Dejará de funcionar inmediatamente."}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Esta acción es irreversible. El sistema o aplicación que use este
            token perderá el acceso al instante.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsRevokeModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              {t("common.cancel") || "Cancelar"}
            </button>
            <button
              onClick={confirmRevocation}
              disabled={revoking}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
            >
              {revoking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t("common.delete") || "Eliminar"}
            </button>
          </div>
        </div>
      </DynamicModal>
    </div>
  );
}

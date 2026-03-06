import { DynamicModal } from "@/Components/Common/Modern/DynamicModal";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Info,
  Key,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ApiSettingsTabProps {
  workspace: any;
  canManageWorkspace: boolean;
}

export default function ApiSettingsTab({
  workspace,
  canManageWorkspace,
}: ApiSettingsTabProps) {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data, setData, post, processing, reset, errors } = useForm({
    name: "",
  });

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        route("workspaces.api-tokens.index", workspace.slug),
      );
      const resData = response.data;
      const fetchedTokens = resData?.data?.tokens || resData?.tokens || [];
      setTokens(fetchedTokens);
    } catch (error) {
      console.error("Failed to fetch tokens", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [workspace.slug]);

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageWorkspace) return;

    post(route("workspaces.api-tokens.store", workspace.slug), {
      onSuccess: (page: any) => {
        const result =
          page.props.flash?.data?.token || (page.props as any).token;
        // Note: Inertia might not be the best for showing the sensitive token once.
        // If the backend returns it in the response body of a successful POST, we can catch it.
        // However, standard Inertia 'post' doesn't return the JSON body easily to the success callback if it's a redirect.
        // Let's use axios for token creation to handle the sensitive data better.
      },
    });
  };

  // Using axios for token creation to get the raw response with the secret
  const createTokenDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || processing || !canManageWorkspace) return;

    try {
      setIsCreating(true);
      const response = await axios.post(
        route("workspaces.api-tokens.store", workspace.slug),
        {
          name: data.name,
        },
      );

      setGeneratedToken(response.data.token || response.data.data?.token);
      toast.success(
        t("workspace.api.create_success") || "API token created successfully",
      );
      reset("name");
      fetchTokens();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t("workspace.api.create_error") ||
          "Failed to create token",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<number | null>(null);
  const [revoking, setRevoking] = useState(false);

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
      toast.success(
        t("workspace.api.revoke_success") || "Token revocado exitosamente",
      );
      setIsRevokeModalOpen(false);
      setTokenToRevoke(null);
      fetchTokens();
    } catch (error) {
      toast.error(
        t("workspace.api.revoke_error") || "Error al revocar el token",
      );
    } finally {
      setRevoking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("common.copied") || "Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Generated Token Alert (Sensitive) */}
      {generatedToken && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 text-green-800 dark:text-green-300">
            <CheckCircle2 className="h-6 w-6" />
            <h3 className="text-lg font-bold">
              {t("workspace.api.token_generated") ||
                "Token Generated Successfully"}
            </h3>
          </div>
          <p className="text-sm text-green-700 dark:text-green-400">
            {t("workspace.api.token_warning") ||
              "Copy this token now. For security reasons, it will not be shown again."}
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
                title={
                  showToken
                    ? t("common.hide") || "Hide"
                    : t("common.show") || "Show"
                }
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
              title="Copy token"
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
            {t("common.dismiss") || "I've saved it, dismiss this message"}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 shadow sm:rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="px-4 py-5 sm:p-6">
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
                    "Generate tokens to authenticate requests to the ContentFlow API."}
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
                    "e.g., Marketing Automation"
                  }
                  className="block w-full sm:w-64 rounded-md border-neutral-300 dark:border-neutral-600 dark:bg-neutral-900 text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t("workspace.api.generate") || "Generate"}
                </button>
              </form>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700">
              <Key className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-neutral-400">
                {t("workspace.api.no_tokens") || "No API tokens generated yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">¿Cómo usar tu Token API?</p>
                  <p className="mb-2">
                    Envía el token en el encabezado <code>Authorization</code>{" "}
                    como un <strong>Bearer token</strong>. Los tokens no expiran
                    automáticamente, duran hasta que decidas revocarlos.
                  </p>
                  <div className="bg-white/50 dark:bg-black/20 p-2 rounded border border-blue-200/50 dark:border-blue-800/50 font-mono text-xs overflow-x-auto">
                    curl -X GET "https://api.contentflow.app/v1/endpoint" \
                    <br />
                    &nbsp;&nbsp;-H "Authorization: Bearer TU_TOKEN_API" \<br />
                    &nbsp;&nbsp;-H "Accept: application/json"
                  </div>
                </div>
              </div>

              <div className="overflow-hidden border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        {t("common.name") || "Nombre"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        {"Último uso"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        {"Expiración"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        {t("common.created") || "Fecha de creación"}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                        {t("common.actions") || "Acciones"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {tokens.map((token) => (
                      <tr key={token.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {token.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                          {token.last_used_at
                            ? new Date(token.last_used_at).toLocaleString()
                            : t("common.never") || "Nunca"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                          {token.expires_at
                            ? new Date(token.expires_at).toLocaleString()
                            : t("common.never_expires") || "No expira"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                          {new Date(token.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {canManageWorkspace && (
                            <button
                              onClick={() => handleRevokeToken(token.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2"
                              title="Revocar Token"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
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

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">
              {t("workspace.api.security_notice") || "Security Notice"}
            </p>
            <p className="mt-1">
              {t("workspace.api.security_help") ||
                "API tokens grant full access to this workspace. Never share them or commit them to public repositories."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

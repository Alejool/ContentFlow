import AlertCard from '@/Components/common/Modern/AlertCard';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import AdvancedPagination from '@/Components/common/ui/AdvancedPagination';
import { formatDateString, formatDateTimeStyled } from '@/Utils/formatters';
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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '@/Components/common/Modern/Input';
import Button from '@/Components/common/Modern/Button';
import { useApiSettings } from '@/Hooks/Workspace/useApiSettings';
import { getTokenMeta, PER_PAGE_OPTIONS } from '@/Utils/Workspace/apiSettings.helpers';
import type { ApiSettingsTabProps, ApiToken } from '@/types/Workspace/apiSettings';

export default function ApiSettingsTab({ workspace, canManageWorkspace }: ApiSettingsTabProps) {
  const { t } = useTranslation();
  const [showScopeSelector, setShowScopeSelector] = useState(false);

  const {
    tokens,
    loading,
    generatedToken,
    setGeneratedToken,
    showToken,
    setShowToken,
    isCreating,
    isRevokeModalOpen,
    setIsRevokeModalOpen,
    revoking,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    data,
    setData,
    fetchTokens,
    totalTokens,
    lastPage,
    paginatedTokens,
    createTokenDirectly,
    handleRevokeToken,
    confirmRevocation,
    copyToClipboard,
    nameError,
    setNameError,
    scopeGroups,
    toggleAbility,
    toggleGroup,
    selectAll,
    clearAll,
  } = useApiSettings(workspace, canManageWorkspace);

  // ─── Expiry cell renderer ─────────────────────────────────────────────────
  const renderExpiry = (token: ApiToken) => {
    if (!token.expires_at) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t('workspace.api.expiry.permanent')}
        </span>
      );
    }
    const date = new Date(token.expires_at);
    const isExpired = date < new Date();
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
          <XCircle className="h-3 w-3" />
          {t('workspace.api.expiry.expired')} — {formatDateString(date)}
        </span>
      );
    }
    const diffMs = date.getTime() - Date.now();
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffD = Math.floor(diffH / 24);
    const relative =
      diffD > 0
        ? t('workspace.api.expiry.expires_in_days', { count: diffD })
        : diffH > 0
          ? t('workspace.api.expiry.expires_in_hours', { count: diffH })
          : t('workspace.api.expiry.expires_soon');
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
        <Clock className="h-3 w-3" />
        {formatDateString(date)} ({relative})
      </span>
    );
  };

  const abilitiesCount = data.abilities.length;
  const scopeToggleLabel =
    abilitiesCount === 0
      ? t('workspace.api.scopes.toggle_hint_full')
      : t('workspace.api.scopes.toggle_hint_count_other', { count: abilitiesCount });

  return (
    <div className="space-y-6">
      {/* ── Generated Token Alert ─────────────────────────────── */}
      {generatedToken && (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-4 rounded-lg border border-green-200 bg-green-50 p-6 duration-500 dark:border-green-800 dark:bg-green-900/30">
          <div className="flex items-center gap-3 text-green-800 dark:text-green-300">
            <CheckCircle2 className="h-6 w-6" />
            <h3 className="text-lg font-bold">{t('workspace.api.token_generated')}</h3>
          </div>
          <p className="text-sm text-green-700 dark:text-green-400">
            {t('workspace.api.token_warning').split('<strong>').map((part, i) =>
              i === 0
                ? part
                : <>
                    <strong key={i}>{part.split('</strong>')[0]}</strong>
                    {part.split('</strong>')[1]}
                  </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 select-all items-center justify-between break-all rounded-md border border-green-300 bg-white p-3 font-mono text-sm dark:border-green-700 dark:bg-theme-bg-secondary">
              <span>
                {showToken
                  ? generatedToken
                  : '•'.repeat(generatedToken.length > 40 ? 40 : generatedToken.length)}
              </span>
              <Button
                variant="ghost"
                buttonStyle="ghost"
                className="ml-2 !border-0 !p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            <Button
              onClick={() => copyToClipboard(generatedToken)}
              variant="success"
              buttonStyle="solid"
              size="md"
              icon={<Copy className="h-5 w-5" />}
              className="p-3"
            >
              <span className="sr-only">{t('common.copy')}</span>
            </Button>
          </div>
          <Button
            onClick={() => {
              setGeneratedToken(null);
              setShowToken(false);
            }}
            variant="ghost"
            buttonStyle="underline"
            size="sm"
            className="text-sm font-medium text-green-800 hover:text-green-950 dark:text-green-300 dark:hover:text-green-100 border-green-800 dark:border-green-300"
          >
            {t('workspace.api.saved_token')}
          </Button>
        </div>
      )}

      {/* ── Token Table Card ──────────────────────────────────── */}
      <div className="border border-neutral-200 bg-white shadow dark:border-neutral-700 dark:bg-theme-bg-secondary sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">

          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2">
                <Key className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {t('workspace.api.title')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                  {t('workspace.api.description')}
                </p>
              </div>
            </div>

            {canManageWorkspace && !generatedToken && (
              <form onSubmit={createTokenDirectly} className="w-full md:w-auto md:min-w-[300px]">
                <div className="flex flex-col gap-3">

                  {/* Token name input */}
                  <div>
                    <Input
                      id="api-token-name"
                      type="text"
                      sizeType="md"
                      value={data.name}
                      onChange={(e) => {
                        setData('name', e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      placeholder={t('workspace.api.token_name_placeholder')}
                      className="block w-full"
                      error={nameError ?? undefined}
                    />
                  </div>

                  {/* Scope selector toggle */}
                  <button
                    type="button"
                    onClick={() => setShowScopeSelector((v) => !v)}
                    className="flex items-center gap-1.5 text-left text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                  >
                    <Key className="h-3 w-3 shrink-0" />
                    <span>{scopeToggleLabel}</span>
                  </button>

                  {/* Scope selector panel */}
                  {showScopeSelector && Object.keys(scopeGroups).length > 0 && (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          {t('workspace.api.scopes.label')}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={selectAll}
                            className="text-xs text-primary-600 hover:underline dark:text-primary-400"
                          >
                            {t('workspace.api.scopes.select_all')}
                          </button>
                          <span className="text-neutral-400">·</span>
                          <button
                            type="button"
                            onClick={clearAll}
                            className="text-xs text-neutral-500 hover:underline dark:text-neutral-400"
                          >
                            {t('workspace.api.scopes.select_none')}
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(scopeGroups).map(([groupKey, group]) => {
                          const scopeKeys = Object.keys(group.scopes);
                          const allSelected = scopeKeys.every((k) => data.abilities.includes(k as any));
                          const someSelected = scopeKeys.some((k) => data.abilities.includes(k as any));
                          return (
                            <div
                              key={groupKey}
                              className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
                            >
                              <label className="mb-2 flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  ref={(el) => {
                                    if (el) el.indeterminate = !allSelected && someSelected;
                                  }}
                                  onChange={() => toggleGroup(group.scopes)}
                                  className="h-3.5 w-3.5 rounded border-neutral-300 text-primary-600"
                                />
                                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                  {group.label}
                                </span>
                              </label>
                              <div className="ml-5 space-y-1.5">
                                {Object.entries(group.scopes).map(([scopeKey, desc]) => (
                                  <label key={scopeKey} className="flex cursor-pointer items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={data.abilities.includes(scopeKey as any)}
                                      onChange={() => toggleAbility(scopeKey as any)}
                                      className="mt-0.5 h-3 w-3 rounded border-neutral-300 text-primary-600"
                                    />
                                    <div>
                                      <span className="block text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                                        {scopeKey}
                                      </span>
                                      <span className="block text-xs text-neutral-700 dark:text-neutral-300">
                                        {desc as string}
                                      </span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isCreating || !data.name}
                    variant="primary"
                    size="md"
                    className="self-start"
                    icon={
                      isCreating
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Plus className="mr-2 h-4 w-4" />
                    }
                  >
                    {t('workspace.api.generate')}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 py-12 text-center dark:border-neutral-700 dark:bg-theme-bg-secondary">
              <Key className="mx-auto mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
              <p className="text-gray-500 dark:text-neutral-400">{t('workspace.api.no_tokens')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Usage info */}
              <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="mb-1 font-semibold">{t('workspace.api.usage_info.title')}</p>
                  <p
                    className="mb-2"
                    dangerouslySetInnerHTML={{ __html: t('workspace.api.usage_info.description') }}
                  />
                  <div className="overflow-x-auto rounded border border-blue-200/50 bg-white/50 p-2 font-mono text-xs dark:border-blue-800/50 dark:bg-black/20">
                    curl -X GET &quot;https://tu-dominio.com/api/v1/endpoint&quot; \<br />
                    &nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_API_TOKEN&quot; \<br />
                    &nbsp;&nbsp;-H &quot;Accept: application/json&quot;
                  </div>
                  <p
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: t('workspace.api.usage_info.refresh_token_help') }}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { key: 'dashboard', color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300' },
                  { key: 'api_access', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
                  { key: 'api_refresh', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
                ].map(({ key, color }) => (
                  <span key={key} className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                    <span className={`rounded px-1.5 py-0.5 font-medium ${color}`}>
                      {t(`workspace.api.token_types.${key}`)}
                    </span>
                    — {t(`workspace.api.token_types.${key}_description`)}
                  </span>
                ))}
              </div>

              {/* Refresh */}
              <div className="flex justify-end">
                <Button
                  onClick={fetchTokens}
                  disabled={loading}
                  variant="secondary"
                  buttonStyle="ghost"
                  size="xs"
                  icon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
                >
                  {t('workspace.api.table.refresh_list')}
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                    <thead className="bg-neutral-50 dark:bg-theme-bg-secondary">
                      <tr>
                        {[
                          'table.name',
                          'table.type',
                          'table.last_used',
                          'table.expires_status',
                          'table.created',
                        ].map((key) => (
                          <th
                            key={key}
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400"
                          >
                            {t(`workspace.api.${key}`)}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                          {t('workspace.api.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-theme-bg-secondary">
                      {paginatedTokens.map((token) => {
                        const meta = getTokenMeta(token);
                        return (
                          <tr
                            key={token.id}
                            className={`transition-colors ${meta.isExpired ? 'opacity-60' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/30'}`}
                          >
                            {/* Name + abilities */}
                            <td className="max-w-[220px] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              <span className="block truncate" title={token.name}>
                                {token.name}
                              </span>
                              {token.abilities && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {token.abilities.includes('*') || token.abilities.length === 0 ? (
                                    <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                      {t('workspace.api.full_access')}
                                    </span>
                                  ) : (
                                    <>
                                      {token.abilities.slice(0, 3).map((a) => (
                                        <span
                                          key={a}
                                          className="inline-flex rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-mono text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                                        >
                                          {a}
                                        </span>
                                      ))}
                                      {token.abilities.length > 3 && (
                                        <span className="inline-flex rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                                          +{token.abilities.length - 3}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Type */}
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${meta.labelColor}`}>
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

                            {/* Created */}
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-neutral-400">
                              {formatDateTimeStyled(token.created_at, 'short', 'short')}
                            </td>

                            {/* Actions */}
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              {canManageWorkspace && (
                                <Button
                                  onClick={() => handleRevokeToken(token.id)}
                                  variant="danger"
                                  buttonStyle="ghost"
                                  size="sm"
                                  title={t('workspace.api.table.revoke_token')}
                                  icon={<Trash2 className="h-4 w-4" />}
                                  className="!border-0 !bg-transparent text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                  <span className="sr-only">{t('workspace.api.table.revoke_token')}</span>
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalTokens > (PER_PAGE_OPTIONS[0] ?? 5) && (
                  <AdvancedPagination
                    currentPage={currentPage}
                    lastPage={lastPage}
                    total={totalTokens}
                    perPage={perPage || 12}
                    onPageChange={(p) => setCurrentPage(p)}
                    onPerPageChange={(pp) => { setPerPage(pp); setCurrentPage(1); }}
                    t={t}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── API Documentation Downloads ───────────────────────── */}
      <div className="border border-neutral-200 bg-white shadow dark:border-neutral-700 dark:bg-theme-bg-secondary sm:rounded-lg">
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
        title={t('workspace.api.security_notice')}
        message={t('workspace.api.security_help')}
      />

      {/* ── Revoke Confirmation Modal ─────────────────────────── */}
      <DynamicModal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        title={t('common.deleteConfirmTitle')}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
            <p className="font-medium">{t('workspace.api.revoke_confirm')}</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {t('workspace.api.revoke_irreversible')}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={() => setIsRevokeModalOpen(false)}
              variant="secondary"
              buttonStyle="ghost"
              size="md"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmRevocation}
              disabled={revoking}
              loading={revoking}
              loadingText={t('common.deleting')}
              variant="danger"
              buttonStyle="solid"
              size="md"
              icon={<Trash2 className="h-4 w-4" />}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </div>
  );
}

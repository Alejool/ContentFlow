import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import Select from '@/Components/common/Modern/Select';
import Switch from '@/Components/common/Modern/Switch';
import Textarea from '@/Components/common/Modern/Textarea';
import ConfirmDialog from '@/Components/common/ui/ConfirmDialog';
import { getSettingsSchema } from '@/Components/Workspace/generalSettings.schema';
import type {
  GeneralSettingsTabProps,
  SettingsFormData,
} from '@/Components/Workspace/generalSettings.types';
import { useTimezoneStore } from '@/stores/common/timezoneStore';
import type { PageProps } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import {
  AlertTriangle,
  Clock,
  Copy,
  Globe,
  Hash,
  Lock,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Tiempo Universal Coordinado)' },
  { value: 'America/New_York', label: 'Hora del Este (EE.UU. y Canadá)' },
  { value: 'America/Chicago', label: 'Hora Central (EE.UU. y Canadá)' },
  { value: 'America/Denver', label: 'Hora de Montaña (EE.UU. y Canadá)' },
  { value: 'America/Los_Angeles', label: 'Hora del Pacífico (EE.UU. y Canadá)' },
  { value: 'America/Bogota', label: 'Bogotá, Lima, Quito' },
  { value: 'America/Mexico_City', label: 'Ciudad de México, Monterrey' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'America/Sao_Paulo', label: 'São Paulo, Brasília' },
  { value: 'Europe/London', label: 'Londres, Dublín, Lisboa' },
  { value: 'Europe/Paris', label: 'París, Madrid, Berlín' },
  { value: 'Europe/Moscow', label: 'Moscú, San Petersburgo' },
  { value: 'Asia/Dubai', label: 'Dubái, Abu Dabi' },
  { value: 'Asia/Kolkata', label: 'Bombay, Calcuta, Nueva Delhi' },
  { value: 'Asia/Shanghai', label: 'Pekín, Shanghái, Hong Kong' },
  { value: 'Asia/Tokyo', label: 'Tokio, Osaka, Sapporo' },
  { value: 'Australia/Sydney', label: 'Sídney, Melbourne' },
];

export default function GeneralSettingsTab({ workspace }: GeneralSettingsTabProps) {
  const { t } = useTranslation();
  const { auth } = usePage<PageProps>().props;
  const { workspaceTimezone, updateWorkspaceTimezone } = useTimezoneStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = Number(workspace.created_by) === Number(auth.user?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(getSettingsSchema(t)),
    defaultValues: {
      name: workspace.name,
      description: workspace.description ?? '',
      public: workspace.public,
      allow_public_invites: workspace.allow_public_invites,
      timezone: workspaceTimezone ?? 'UTC',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    if (!isOwner) {
      toast.error(t('workspace.permissions_required'));
      return;
    }
    setIsSaving(true);

    if (data.timezone && data.timezone !== workspaceTimezone) {
      try {
        await updateWorkspaceTimezone(data.timezone);
      } catch {
        // timezone update errors are non-blocking
      }
    }

    router.put(route('workspaces.update', workspace.id), data, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(t('workspace.messages.update_success'));
        setIsSaving(false);
      },
      onError: () => setIsSaving(false),
    });
  };

  const handleDeleteWorkspace = () => {
    setIsDeleting(true);
    router.delete(route('workspaces.destroy', workspace.id), {
      onSuccess: () => {
        toast.success(t('workspace.messages.delete_success'));
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      },
      onError: () => {
        toast.error(t('workspace.messages.delete_error'));
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      },
    });
  };

  const isPublic = watch('public');
  const allowPublicInvites = watch('allow_public_invites') ?? false;
  const selectedTimezone = watch('timezone') ?? 'UTC';

  return (
    <div className="space-y-8">
      {/* ── Single unified form card ─────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-theme-bg-secondary">
        {/* Card header */}
        <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('workspace.general_settings')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {t('workspace.configure_basic_info')}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="divide-y divide-gray-100 dark:divide-neutral-800"
        >
          {/* ── Section: Basic info ──────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
            <Input
              id="name"
              label={t('workspace.name')}
              register={register}
              error={errors.name?.message}
              required
              disabled={!isOwner}
              placeholder={t('workspace.name_placeholder')}
            />
            <Textarea
              id="description"
              label={t('workspace.description')}
              register={register}
              error={errors.description?.message}
              disabled={!isOwner}
              placeholder={t('workspace.description_placeholder')}
              rows={3}
            />
          </div>

          {/* ── Section: Timezone ────────────────────────────── */}
          <div className="px-6 py-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {t('workspace.timezone.title')}
                </p>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  {t('workspace.timezone.description')}
                </p>
              </div>
            </div>
            <Select
              id="timezone"
              options={COMMON_TIMEZONES}
              value={selectedTimezone}
              onChange={(val) => setValue('timezone', val as string)}
              disabled={!isOwner}
              searchable
              icon={Globe}
              size="md"
            />
          </div>

          {/* ── Section: Visibility ──────────────────────────── */}
          <div className="px-6 py-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                <Shield className="h-4 w-4" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('workspace.visibility')}
              </p>
            </div>

            <div className="space-y-3">
              {/* Public toggle row */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-neutral-800 dark:bg-theme-bg-secondary">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md ${
                      isPublic
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'
                        : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                    }`}
                  >
                    {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {isPublic
                        ? t('workspace.public_workspace')
                        : t('workspace.private_workspace')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">
                      {isPublic
                        ? t('workspace.public_description')
                        : t('workspace.private_description')}
                    </p>
                  </div>
                </div>
                <Switch
                  isSelected={isPublic}
                  onChange={(value) => setValue('public', value)}
                  isDisabled={!isOwner}
                  size="md"
                />
              </div>

              {/* Public invites row */}
              {isPublic && (
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-neutral-800 dark:bg-theme-bg-secondary">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('workspace.public_invites')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        {t('workspace.public_invites_description')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    isSelected={allowPublicInvites}
                    onChange={(value) => setValue('allow_public_invites', value)}
                    isDisabled={!isOwner}
                    size="md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Section: Workspace ID ────────────────────────── */}
          <div className="px-6 py-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-theme-bg-secondary dark:text-neutral-400">
                <Hash className="h-4 w-4" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('workspace.workspace_id')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-sm text-gray-700 dark:border-neutral-700 dark:bg-theme-bg-secondary dark:text-gray-300">
                {workspace.id}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(String(workspace.id));
                  toast.success(t('workspace.id_copied'));
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-theme-bg-secondary dark:hover:bg-neutral-700"
                title={t('common.copy')}
              >
                <Copy className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-neutral-500">
              {t('workspace.id_description')}
            </p>
          </div>

          {/* ── Save button ──────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4">
            {!isOwner && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('workspace.permissions_required')}
              </p>
            )}
            <div className="ml-auto">
              <Button type="submit" loading={isSaving} disabled={!isOwner} className="px-8">
                {isSaving ? t('common.saving') : t('common.save_changes')}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Danger Zone ─────────────────────────────────────────── */}
      {isOwner && (
        <div className="overflow-hidden rounded-xl border border-red-200 dark:border-red-900/50">
          {/* Striped top bar */}
          <div className="h-1.5 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_8px,#fca5a5_8px,#fca5a5_16px)] dark:bg-[repeating-linear-gradient(45deg,#7f1d1d,#7f1d1d_8px,#991b1b_8px,#991b1b_16px)]" />

          <div className="bg-red-50 px-6 py-5 dark:bg-red-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">
                  {t('workspace.danger_zone')}
                </h3>
                <p className="text-xs text-red-600/70 dark:text-red-400/60">
                  {t('workspace.delete_workspace_description')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-6 bg-white px-6 py-5 dark:bg-theme-bg-secondary">
            <div className="max-w-sm">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {t('workspace.delete_workspace')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {t('workspace.delete_workspace_warning')}
              </p>
            </div>
            {/* Muted destructive button — visible but not inviting */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/50"
            >
              <Trash2 className="h-4 w-4" />
              {t('workspace.delete_button')}
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorkspace}
        title={t('workspace.delete_confirmation_title')}
        message={t('workspace.delete_confirmation_message')}
        confirmText={isDeleting ? t('common.deleting') : t('workspace.confirm_delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  );
}

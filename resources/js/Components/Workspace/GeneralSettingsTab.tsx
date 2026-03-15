import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import ConfirmDialog from '@/Components/common/ui/ConfirmDialog';
import { WorkspaceTimezoneSettings } from '@/Components/Workspace/WorkspaceTimezoneSettings';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Copy,
    Globe,
    Info,
    Lock,
    SettingsIcon,
    Shield,
    Trash2,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

interface GeneralSettingsTabProps {
  workspace: any;
  canManageWorkspace: boolean;
}

const getSettingsSchema = (t: any) =>
  z.object({
    name: z
      .string()
      .min(1, t('workspace.invite_modal.validation.nameRequired') || 'Workspace name is required')
      .max(255),
    description: z.string().max(1000).optional().or(z.literal('')),
    public: z.boolean().optional(),
    allow_public_invites: z.boolean().optional(),
  });

type SettingsFormData = {
  name: string;
  description?: string;
  public?: boolean;
  allow_public_invites?: boolean;
};

export default function GeneralSettingsTab({
  workspace,
  canManageWorkspace,
}: GeneralSettingsTabProps) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only workspace creator (Owner) can edit workspace settings
  const isOwner = Number(workspace.created_by) === Number(auth.user.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(getSettingsSchema(t)),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || '',
      public: workspace.public || false,
      allow_public_invites: workspace.allow_public_invites || false,
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    if (!isOwner) {
      toast.error(
        t('workspace.permissions_required') || 'Only the workspace owner can update these settings',
      );
      return;
    }

    setIsSaving(true);
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
        toast.success(t('workspace.messages.delete_success') || 'Workspace deleted successfully');
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      },
      onError: () => {
        toast.error(t('workspace.messages.delete_error') || 'Failed to delete workspace');
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      },
    });
  };

  const isPublic = watch('public');

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/70 bg-gradient-to-br from-white/90 to-white/95 p-6 shadow-sm dark:border-black/70 dark:from-black/90 dark:to-black/95">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('workspace.general_settings')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              {t('workspace.configure_basic_info')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Input
                id="name"
                label={t('workspace.name')}
                register={register}
                error={errors.name?.message}
                required
                disabled={!isOwner}
                className="bg-white dark:bg-neutral-900"
                placeholder={t('workspace.name_placeholder')}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('workspace.description')}
                </label>
                <textarea
                  {...register('description')}
                  disabled={!isOwner}
                  className="mt-1 block min-h-[120px] w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition-colors focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:text-sm"
                  rows={4}
                  placeholder={t('workspace.description_placeholder')}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
                <h4 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <Shield className="h-5 w-5 text-primary-500" />
                  {t('workspace.visibility')}
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isPublic
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}
                      >
                        {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {isPublic
                            ? t('workspace.public_workspace')
                            : t('workspace.private_workspace')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-neutral-500">
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

                  {isPublic && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-neutral-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {t('workspace.public_invites')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-neutral-500">
                            {t('workspace.public_invites_description')}
                          </p>
                        </div>
                      </div>
                      <Switch
                        isSelected={watch('allow_public_invites') || false}
                        onChange={(value) => setValue('allow_public_invites', value)}
                        isDisabled={!isOwner}
                        size="md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-blue-800/30 dark:from-blue-900/10 dark:to-neutral-950">
                <div className="mb-3 flex items-center gap-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t('workspace.workspace_id')}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300">
                    {workspace.id}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(workspace.id);
                      toast.success(t('workspace.id_copied'));
                    }}
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
                    title={t('common.copy')}
                  >
                    <Copy className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-neutral-500">
                  {t('workspace.id_description')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-6 dark:border-neutral-800">
            <Button type="submit" loading={isSaving} disabled={!isOwner} className="px-8">
              {isSaving ? t('common.saving') : t('common.save_changes')}
            </Button>
          </div>
        </form>
      </div>

      {/* Timezone Settings */}
      <WorkspaceTimezoneSettings canManage={isOwner} />

      {isOwner && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-6 shadow-sm dark:border-red-900/30 dark:bg-red-900/10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                {t('workspace.danger_zone') || 'Danger Zone'}
              </h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/70">
                {t('workspace.delete_workspace_description') ||
                  'Irreversible actions for this workspace'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-red-100 bg-white p-4 dark:border-red-900/30 dark:bg-neutral-900">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {t('workspace.delete_workspace') || 'Delete this workspace'}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('workspace.delete_workspace_warning') ||
                  'Once you delete a workspace, there is no going back. Please be certain.'}
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowDeleteConfirm(true)} icon={Trash2}>
              {t('workspace.delete_button') || 'Delete Workspace'}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorkspace}
        title={t('workspace.delete_confirmation_title') || 'Delete Workspace?'}
        message={
          t('workspace.delete_confirmation_message') ||
          'Are you sure you want to delete this workspace? All data including content, campaigns, and team members will be permanently removed. This action cannot be undone.'
        }
        confirmText={
          isDeleting
            ? t('common.deleting') || 'Deleting...'
            : t('workspace.confirm_delete') || 'Yes, delete workspace'
        }
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  );
}

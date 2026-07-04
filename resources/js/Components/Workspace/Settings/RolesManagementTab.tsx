import Button from '@/Components/common/Modern/Button';
import ColorPicker from '@/Components/common/Modern/ColorPicker';
import Input from '@/Components/common/Modern/Input';
import Switch from '@/Components/common/Modern/Switch';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import { buildRoleColorStyles, getRoleTextOnColor } from '@/lib/common/roleColors';
import {
  canDeleteRole,
  canEditRole,
  getMemberCount,
  isProtectedRole,
} from '@/Utils/Workspace/rolesManagement.helpers';
import type { Permission, Role, RolesManagementTabProps } from '@/types/Workspace/rolesManagement';
import { getRoleConfig, getRoleLabel } from '@/Utils/Roles/roleHelpers';
import { router } from '@inertiajs/react';
import { roleService } from '@/Services/Roles/roleService';
import {
  AlertCircle, ChevronDown, ChevronUp, Edit2,
  Search, Shield, ShieldAlert, Trash2, Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// ── Permission category map (frontend-side) ───────────────────────────────────
// labelKey maps to roles.groups.* in the locale files
const PERMISSION_GROUPS: Record<string, { labelKey: string; slugs: string[] }> = {
  content: {
    labelKey: 'roles.groups.content',
    slugs: ['view-content', 'create-content', 'manage-content'],
  },
  publishing: {
    labelKey: 'roles.groups.publishing',
    slugs: ['publish', 'submit-for-approval', 'approve', 'reject'],
  },
  team: {
    labelKey: 'roles.groups.team',
    slugs: ['manage-team', 'manage-accounts'],
  },
  workspace: {
    labelKey: 'roles.groups.workspace',
    slugs: ['manage-workspace'],
  },
  analytics: {
    labelKey: 'roles.groups.analytics',
    slugs: ['view-analytics'],
  },
  campaigns: {
    labelKey: 'roles.groups.campaigns',
    slugs: ['manage-campaigns'],
  },
};

function groupPermissions(permissions: Permission[]) {
  const grouped: Record<string, Permission[]> = {};
  const ungrouped: Permission[] = [];

  const slugToGroup: Record<string, string> = {};
  for (const [group, config] of Object.entries(PERMISSION_GROUPS)) {
    for (const slug of config.slugs) {
      slugToGroup[slug] = group;
    }
  }

  for (const p of permissions) {
    const group = slugToGroup[p.slug ?? ''] ?? slugToGroup[p.name ?? ''];
    if (group) {
      grouped[group] = grouped[group] ?? [];
      grouped[group]!.push(p);
    } else {
      ungrouped.push(p);
    }
  }

  if (ungrouped.length) grouped['other'] = ungrouped;
  return grouped;
}

// ── Role card ─────────────────────────────────────────────────────────────────

function RoleCard({
  role, isCurrentRole, memberCount, canManageWorkspace,
  onEdit, onDelete, t,
}: {
  role: Role; isCurrentRole: boolean; memberCount: number;
  canManageWorkspace: boolean;
  onEdit: () => void; onDelete: () => void;
  t: (k: string, opts?: object | string) => string;
}) {
  const config = getRoleConfig(role.slug);
  const RoleIcon = config.icon;
  const styles = buildRoleColorStyles(role.color_hex);

  // Use i18n label (respects current language) — never show DB string
  const roleLabel = getRoleLabel(role.slug, t as any);
  // Use i18n description for system roles; fall back to DB value for custom roles
  const roleDescription = role.is_system_role
    ? t(`roles.descriptions.${role.slug}`, role.description ?? '')
    : (role.description ?? '');

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-theme-bg-secondary"
      style={isCurrentRole ? styles.cardBg : {}}
    >
      {/* Color accent bar */}
      <div className="h-1.5 w-full" style={styles.accent} />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={styles.iconBg}
            >
              <RoleIcon
                className="h-5 w-5"
                style={{ color: styles.textColor }}
              />
            </div>
            <div>
              <h4 className="flex flex-wrap items-center gap-2 font-bold text-gray-900 dark:text-white">
                {roleLabel}
                {isCurrentRole && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={styles.badge}
                  >
                    {t('workspace.your_role')}
                  </span>
                )}
              </h4>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400">
                <Users className="h-3 w-3" />
                {t('workspace.members_count', { count: memberCount })}
              </div>
            </div>
          </div>

          {/* Badges + actions */}
          <div className="flex items-center gap-1">
            {isProtectedRole(role) && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {t('roles.protected')}
              </span>
            )}
            {canManageWorkspace && (
              <>
                {canEditRole(role) && (
                  <Button size="sm" variant="ghost" buttonStyle="icon" onClick={onEdit} icon={Edit2} title={t('common.edit')}>{'  '}</Button>
                )}
                {canDeleteRole(role) && (
                  <Button size="sm" variant="ghost" buttonStyle="icon" onClick={onDelete} icon={Trash2} title={t('common.delete')}
                    className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">{'  '}</Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm text-gray-600 dark:text-neutral-400">
          {roleDescription || t('workspace.no_description')}
        </p>

        {/* Slug */}
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
            {role.slug}
          </span>
          {/* Color dot */}
          {role.color_hex && (
            <span
              className="h-3 w-3 rounded-full border border-white shadow-sm dark:border-neutral-700"
              style={{ backgroundColor: role.color_hex }}
              title={role.color_hex}
            />
          )}
        </div>

        {/* Permissions preview */}
        <div className="flex flex-wrap gap-1.5">
          {role.permissions?.slice(0, 4).map((p) => (
            <span
              key={p.id}
              className="rounded-md px-2 py-0.5 text-[10px] font-medium"
              style={styles.badge}
            >
              {p.display_name ?? p.name}
            </span>
          ))}
          {(role.permissions?.length ?? 0) > 4 && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
              +{(role.permissions?.length ?? 0) - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Permission group (collapsible) ────────────────────────────────────────────

function PermissionGroup({
  groupKey, label, perms, selected, onToggle, roleColorHex,
}: {
  groupKey: string; label: string; perms: Permission[];
  selected: number[]; onToggle: (id: number, v: boolean) => void;
  roleColorHex?: string | null;
}) {
  const [open, setOpen] = useState(true);
  const styles = buildRoleColorStyles(roleColorHex);
  const allSelected = perms.every((p) => selected.includes(p.id));
  const someSelected = perms.some((p) => selected.includes(p.id));

  const toggleAll = () => {
    if (allSelected) {
      perms.forEach((p) => onToggle(p.id, false));
    } else {
      perms.forEach((p) => onToggle(p.id, true));
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700">
     

      {open && (
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {perms.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {p.display_name ?? p.name}
                </p>
                {p.description && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
                    {p.description}
                  </p>
                )}
              </div>
              <Switch
                checked={selected.includes(p.id)}
                onChange={(v) => onToggle(p.id, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RolesManagementTab({
  roles, permissions, workspace, userRole, canManageWorkspace,
}: RolesManagementTabProps) {
  const { t } = useTranslation();

  // Edit state
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [editColor, setEditColor] = useState<string>('#6366f1');
  const [permSearch, setPermSearch] = useState('');

  // Delete state
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEditRole = (role: Role) => {
    if (!canEditRole(role)) { toast.error(t('roles.errors.cannot_edit_protected')); return; }
    setEditingRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.id) ?? []);
    setEditColor(role.color_hex ?? '#6366f1');
    setPermSearch('');
    setIsEditModalOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (!canDeleteRole(role)) { toast.error(t('roles.errors.cannot_delete_protected')); return; }
    if (getMemberCount(workspace, role.id) > 0) { toast.error(t('roles.errors.role_has_users')); return; }
    setDeletingRole(role);
    setIsDeleteModalOpen(true);
  };

  const closeEditModal = () => { setIsEditModalOpen(false); setEditingRole(null); setSelectedPermissions([]); };
  const closeDeleteModal = () => { setIsDeleteModalOpen(false); setDeletingRole(null); };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    setIsLoading(true);
    try {
      const res = await roleService.update(workspace.id, editingRole.id, {
        permission_ids: selectedPermissions,
        color_hex: editColor,
      });

      const colorSaved: boolean = res.data?.color_saved ?? false;

      if (!colorSaved && editColor !== (editingRole.color_hex ?? '#6366f1')) {
        // color_hex DB column missing (migration pending) — warn user
        toast.success(t('roles.success.updated'));
        toast.error('Color not saved — run php artisan migrate in Docker to enable role colors.', { duration: 6000 });
      } else {
        toast.success(t('roles.success.updated'));
      }

      router.reload({ only: ['roles'] });
      closeEditModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? t('roles.errors.update_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteRole = async () => {
    if (!deletingRole) return;
    setIsLoading(true);
    try {
      await roleService.destroy(workspace.id, deletingRole.id);
      toast.success(t('roles.success.deleted'));
      router.reload({ only: ['roles'] });
      closeDeleteModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? t('roles.errors.delete_failed'));
    } finally { setIsLoading(false); }
  };

  const togglePermission = (id: number, checked: boolean) =>
    setSelectedPermissions((prev) => checked ? [...prev, id] : prev.filter((i) => i !== id));

  // ── Filtered + grouped permissions ────────────────────────────────────────

  const filteredPermissions = useMemo(() => {
    if (!permSearch.trim()) return permissions;
    const q = permSearch.toLowerCase();
    return permissions.filter((p) =>
      (p.display_name ?? p.name ?? '').toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  }, [permissions, permSearch]);

  const groupedPermissions = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-theme-bg-secondary">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('workspace.roles_management.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-neutral-500">
            {t('workspace.roles_management.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              isCurrentRole={userRole === role.slug}
              memberCount={getMemberCount(workspace, role.id)}
              canManageWorkspace={canManageWorkspace}
              onEdit={() => handleEditRole(role)}
              onDelete={() => handleDeleteRole(role)}
              t={t}
            />
          ))}
        </div>

        {!canManageWorkspace && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-primary-500" />
            <div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-400">{t('workspace.permissions_required')}</p>
              <p className="mt-1 text-sm text-primary-700 dark:text-primary-300">{t('workspace.owner_admin_required')}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Role Modal ─────────────────────────────────────── */}
      <DynamicModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={editingRole ? `${t('roles.edit_role')} — ${getRoleLabel(editingRole.slug, t as any)}` : ''}
        size="2xl"
      >
        <div className="flex flex-col gap-6">

          {/* Color picker */}
          <ColorPicker
            value={editColor}
            onChange={setEditColor}
            label={t('roles.role_color', 'Role color')}
          />

          {/* Permissions section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 dark:text-neutral-200">
                {t('roles.permissions')} ({selectedPermissions.length}/{permissions.length})
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedPermissions(permissions.map((p) => p.id))}
                  className="text-xs text-primary-600 hover:underline dark:text-primary-400">
                  {t('roles.select_all', 'All')}
                </button>
                <span className="text-gray-300">·</span>
                <button type="button" onClick={() => setSelectedPermissions([])}
                  className="text-xs text-gray-500 hover:underline dark:text-neutral-400">
                  {t('roles.deselect_all', 'None')}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-3">
              <Input
                id="perm-search"
                type="text"
                sizeType="sm"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder={t('roles.search_permissions', 'Search permissions…')}
                icon={Search}
              />
            </div>

            {/* Grouped permission switches */}
            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {Object.entries(groupedPermissions).map(([key, perms]) => (
                <PermissionGroup
                  key={key}
                  groupKey={key}
                  label={t(PERMISSION_GROUPS[key]?.labelKey ?? key, key)}
                  perms={perms}
                  selected={selectedPermissions}
                  onToggle={togglePermission}
                  roleColorHex={editColor}
                />
              ))}
              {filteredPermissions.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">{t('roles.no_permissions_found', 'No permissions match your search')}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-neutral-800">
            <Button variant="ghost" buttonStyle="outline" size="md" onClick={closeEditModal} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" buttonStyle="solid" size="md" onClick={handleSaveRole}
              disabled={isLoading || selectedPermissions.length === 0} icon={Shield}>
              {isLoading ? t('common.saving') : t('common.save_changes')}
            </Button>
          </div>
        </div>
      </DynamicModal>

      {/* ── Delete Modal ────────────────────────────────────────── */}
      <DynamicModal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title={t('roles.delete_role')} size="md">
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h4 className="mb-1 text-sm font-bold text-red-900 dark:text-red-200">{t('roles.delete_confirmation_title')}</h4>
              <p className="text-sm text-red-800 dark:text-red-300">
                {t('roles.delete_confirmation_message')}{' '}
                <span className="font-bold">{deletingRole ? getRoleLabel(deletingRole.slug, t as any) : ''}</span>{' '}
                {t('roles.will_be_deleted')}.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-neutral-800">
            <Button variant="ghost" buttonStyle="outline" size="md" onClick={closeDeleteModal} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" buttonStyle="solid" size="md" onClick={confirmDeleteRole}
              disabled={isLoading} icon={Trash2}>
              {isLoading ? t('common.deleting') : t('common.delete')}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </div>
  );
}

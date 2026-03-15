import Button from "@/Components/common/Modern/Button";
import Select from "@/Components/common/Modern/Select";
import ConfirmDialog from "@/Components/common/ui/ConfirmDialog";
import InviteMemberModal from "@/Components/Workspace/InviteMemberModal";
import { getRoleStyle, ROLE_STYLES } from "@/Constants/RoleConstants";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface MembersManagementProps {
  roles?: any[];
  workspace: any;
}

export default function MembersManagement({ roles = [], workspace }: MembersManagementProps) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  // Use the passed workspace prop, fallback to global if somehow missing (though Settings ensures it)
  const current_workspace = workspace;

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<number | null>(null);

  const fetchMembers = async () => {
    if (!current_workspace?.id) return;

    try {
      setIsLoading(true);
      const response = await axios.get(route("api.v1.workspaces.members", current_workspace.id));
      setMembers(response.data.members || []);
    } catch (error) {
      toast.error(t("workspace.invite_modal.messages.error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (current_workspace?.id) {
      fetchMembers();
    } else {
      setIsLoading(false);
    }
  }, [current_workspace?.id]);

  const roleDistribution = members.reduce((acc: any, member: any) => {
    const roleId = member.pivot?.role_id;
    acc[roleId] = (acc[roleId] || 0) + 1;
    return acc;
  }, {});

  const currentUser = members.find((u: any) => Number(u.id) === Number(auth.user.id));
  const userRoleSlug = currentUser?.pivot?.role?.slug || currentUser?.role?.slug;
  const canManageMembers =
    ["owner", "admin"].includes(userRoleSlug) ||
    Number(current_workspace.created_by) === Number(auth.user.id);

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    if (!canManageMembers) return;
    try {
      await axios.put(
        route("api.v1.workspaces.members.update-role", {
          idOrSlug: current_workspace.id,
          user: userId,
        }),
        {
          role_id: newRoleId,
        },
      );
      toast.success(t("workspace.invite_modal.messages.success"));
      fetchMembers();
    } catch (error) {
      toast.error(t("workspace.invite_modal.messages.error"));
    }
  };

  const initiateRemoveMember = (userId: number) => {
    setUserToRemove(userId);
    setIsConfirmDialogOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!canManageMembers || !userToRemove) return;

    try {
      const response = await axios.delete(
        route("api.v1.workspaces.members.remove", {
          idOrSlug: current_workspace.id,
          user: userToRemove,
        }),
      );
      toast.success(t("workspace.invite_modal.messages.success"));
      if (response.data.members) {
        setMembers(response.data.members);
      } else {
        fetchMembers();
      }
    } catch (error) {
      toast.error(t("workspace.invite_modal.messages.error"));
    } finally {
      setUserToRemove(null);
    }
  };

  const stats = [
    {
      label: t("workspace.stats.total_members"),
      value: members.length,
      icon: Users,
      color: "text-primary-600",
    },
    {
      label: t("workspace.owners"),
      value: roleDistribution[roles.find((r) => r.slug === "owner")?.id] || 0,
      icon: ROLE_STYLES.owner.icon,
      color: ROLE_STYLES.owner.color,
    },
    {
      label: t("workspace.admins"),
      value: roleDistribution[roles.find((r) => r.slug === "admin")?.id] || 0,
      icon: ROLE_STYLES.admin.icon,
      color: ROLE_STYLES.admin.color,
    },
    {
      label: t("workspace.members"),
      value: roleDistribution[roles.find((r) => r.slug === "member")?.id] || 0,
      icon: ROLE_STYLES.member.icon,
      color: ROLE_STYLES.member.color,
    },
  ];

  const roleOptions = roles
    .filter((r) => r.slug !== "owner")
    .map((r) => ({ value: r.id, label: r.name }));

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
        <p className="text-gray-500">{t("workspace.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 md:p-4"
          >
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 md:text-sm">
                  {stat.label}
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color} opacity-80`} />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("workspace.workspace_members")}
          </h3>
          {canManageMembers && (
            <Button onClick={() => setIsInviteModalOpen(true)} size="sm" icon={UserPlus}>
              <span className="hidden md:inline">{t("workspace.invite_member")}</span>
              <span className="md:hidden">{t("workspace.invite")}</span>
            </Button>
          )}
        </div>

        <div className="divide-y divide-gray-200 dark:divide-neutral-700">
          {members.map((member: any) => {
            const isMe = Number(member.id) === Number(auth.user.id);
            const isCreator = Number(current_workspace.created_by) === Number(member.id);
            const roleId = member.pivot?.role_id;
            const currentRole = roles.find((r) => r.id === roleId) || {
              name: "Member",
              slug: "member",
            };

            return (
              <div
                key={member.id}
                className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700/30 md:flex-row md:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 min-w-[2.5rem] shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-200 dark:border-neutral-600 dark:bg-neutral-700">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 font-bold text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate font-semibold text-gray-900 dark:text-white">
                      {member.name}
                      {isMe && (
                        <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          {t("workspace.you")}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>
                </div>

                <div className="flex w-full items-center justify-end gap-3 pl-14 md:w-auto md:gap-4 md:pl-0">
                  {isCreator || !canManageMembers ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        getRoleStyle(currentRole.slug).badge
                      }`}
                    >
                      {isCreator ? t("workspace.owners") : currentRole.name}
                    </span>
                  ) : (
                    <div className="w-32 md:w-36">
                      <Select
                        id={`role-${member.id}`}
                        options={roleOptions}
                        value={roleId}
                        onChange={(val) => handleRoleChange(member.id, Number(val))}
                        size="sm"
                        variant="outlined"
                        containerClassName="m-0"
                      />
                    </div>
                  )}

                  {canManageMembers && !isMe && !isCreator && (
                    <Button
                      onClick={() => initiateRemoveMember(member.id)}
                      variant="ghost"
                      size="xs"
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      title={t("workspace.remove_member")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && !isLoading && (
            <div className="p-8 text-center text-gray-500">{t("workspace.activity.empty")}</div>
          )}
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={fetchMembers}
        roles={roles}
        workspace={current_workspace}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleRemoveMember}
        title={t("workspace.remove_member")}
        message={t("workspace.remove_confirm")}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        type="danger"
      />
    </div>
  );
}

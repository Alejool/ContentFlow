import Button from "@/Components/common/Modern/Button";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
  Building2,
  ChevronRight,
  ExternalLink,
  Globe,
  Info,
  Lock,
  Plus,
  Settings as SettingsIcon,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(255),
  description: z.string().max(1000).optional().or(z.literal("")),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const AvatarStack = ({
  users,
  roles,
  max = 4,
}: {
  users: any[];
  roles: any[];
  max?: number;
}) => {
  const displayUsers = Array.isArray(users) ? users.slice(0, max) : [];
  const remaining = users.length > max ? users.length - max : 0;

  return (
    <div className="flex -space-x-2 overflow-hidden py-1">
      {displayUsers.map((user) => {
        const roleId = user.pivot?.role_id;
        const role = roles.find((r) => r.id === roleId);
        const roleName = role ? role.name : "Member";

        return (
          <div
            key={user.id}
            className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-neutral-800 dark:to-neutral-700 overflow-hidden cursor-help hover:scale-110 hover:z-10 transition-all duration-200 group"
            title={`${user.name} - ${roleName}`}
          >
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.name}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 bg-emerald-500"></div>
          </div>
        );
      })}
      {remaining > 0 && (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700 ring-2 ring-white dark:ring-neutral-900 text-xs font-bold text-gray-600 dark:text-gray-400 hover:scale-110 transition-transform duration-200 cursor-help"
          title={`${remaining} more members`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

const RoleBadge = ({ role }: { role: any }) => {
  const roleColors: Record<string, string> = {
    owner:
      "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
    admin:
      "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50",
    member:
      "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50",
    viewer:
      "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800/50",
  };

  return (
    <span
      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm ${roleColors[role?.slug] || roleColors.member}`}
    >
      {role?.name || "Member"}
    </span>
  );
};

export default function Index({
  workspaces,
  roles,
}: {
  workspaces: any[];
  roles: any[];
}) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredWorkspace, setHoveredWorkspace] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleSwitch = (workspaceId: number) => {
    if (workspaceId === auth.user.current_workspace_id) return;

    router.post(
      route("workspaces.switch", workspaceId),
      {},
      {
        onSuccess: () => {
          toast.success(t("workspace.switched_successfully"));
        },
      },
    );
  };

  const onSubmit = (data: WorkspaceFormData) => {
    setIsSubmitting(true);
    router.post(route("workspaces.store"), data, {
      onSuccess: () => {
        setShowCreateModal(false);
        reset();
        toast.success("Workspace created successfully");
        setIsSubmitting(false);
      },
      onError: () => setIsSubmitting(false),
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
              {t("workspace.my_workspaces")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
              {t("workspace.subtitle")}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/40 active:scale-[0.98]"
          >
            <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-5 w-5" />
            </div>
            <span className="font-semibold">{t("workspace.create_new")}</span>
          </button>
        </div>
      }
    >
      <Head title={t("workspace.my_workspaces")} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-10">
        {workspaces.map((workspace) => {
          const userRole = roles.find((r) => r.id === workspace.pivot.role_id);
          const isActive = auth.user.current_workspace_id === workspace.id;

          return (
            <div
              key={workspace.id}
              className={`group relative bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900/50 dark:to-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-600/10 hover:-translate-y-1 ${
                openMenuId === workspace.id ? "z-50 shadow-2xl" : "z-0"
              }`}
              onMouseEnter={() => setHoveredWorkspace(workspace.id)}
              onMouseLeave={() => {
                setHoveredWorkspace(null);
              }}
            >
              {isActive && (
                <div className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {t("workspace.active")}
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="h-14 w-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  {userRole?.slug === "owner" && (
                    <div className="absolute -top-1 -left-1 h-6 w-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
                      <Shield className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div title={userRole?.name || "Member"}>
                    <RoleBadge role={userRole} />
                  </div>
                  {workspace.public ? (
                    <div title={t("workspace.tooltips.public")}>
                      <Globe className="h-4 w-4 text-gray-400" />
                    </div>
                  ) : (
                    <div title={t("workspace.tooltips.private")}>
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {workspace.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {workspace.description || (
                    <span className="italic text-gray-400 dark:text-neutral-600">
                      {t("workspace.no_description_italic")}
                    </span>
                  )}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {t("workspace.members_count", {
                        count: workspace.users?.length || 0,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    </div>
                    <span className="font-medium">
                      {t("workspace.projects_count", {
                        count: workspace.projects_count || 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-neutral-800">
                <div className="flex-1">
                  <AvatarStack users={workspace.users || []} roles={roles} />
                </div>

                <div className="flex items-center gap-2">
                  {isActive ? (
                    <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {t("workspace.status.current")}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSwitch(workspace.id)}
                      className="px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/20 dark:hover:to-primary-900/10 text-gray-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 text-sm font-semibold rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-800/50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 group/switch"
                    >
                      <span>{t("workspace.status.switch")}</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover/switch:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === workspace.id ? null : workspace.id,
                        );
                      }}
                      className={`p-2.5 rounded-lg transition-all duration-200 ${
                        ["owner", "admin"].includes(userRole?.slug)
                          ? "text-gray-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/20 dark:hover:to-primary-900/10 hover:shadow-sm"
                          : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      }`}
                      title={
                        ["owner", "admin"].includes(userRole?.slug)
                          ? t("workspace.tooltips.manage")
                          : t("workspace.tooltips.view")
                      }
                    >
                      {["owner", "admin"].includes(userRole?.slug) ? (
                        <SettingsIcon className="h-5 w-5" />
                      ) : (
                        <Info className="h-5 w-5" />
                      )}
                    </button>

                    {openMenuId === workspace.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-transparent"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-2xl z-50 py-2">
                          <Link
                            href={route("workspaces.show", workspace.id)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {t("workspace.status.open")}
                            </span>
                          </Link>
                          {["owner", "admin"].includes(userRole?.slug) && (
                            <>
                              <Link
                                href={route(
                                  "workspaces.settings",
                                  workspace.id,
                                )}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
                              >
                                <SettingsIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {t("workspace.status.settings")}
                                </span>
                              </Link>
                              <Link
                                href={`${route("workspaces.settings", workspace.id)}?tab=members`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
                              >
                                <UserPlus className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {t("workspace.status.invite")}
                                </span>
                              </Link>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div
          onClick={() => setShowCreateModal(true)}
          className="group relative border-2 border-dashed border-gray-300 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:bg-gradient-to-br hover:from-primary-50/30 hover:to-primary-100/30 dark:hover:from-primary-900/5 dark:hover:to-primary-900/10 cursor-pointer hover:-translate-y-1"
        >
          <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center p-4">
            <div className="h-16 w-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-neutral-300 mb-2">
              {t("workspace.create_new_workspace")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500 mb-6">
              {t("workspace.create_card.subtitle")}
            </p>
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold">
              <span>{t("workspace.create_button_subtitle")}</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-lg bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("workspace.create_new_workspace")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
                    {t("workspace.modal.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <div className="h-5 w-5 text-gray-500 dark:text-neutral-400">
                  ×
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300">
                  {t("workspace.name")}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  {...register("name")}
                  autoFocus
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder={t("workspace.name_placeholder")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300">
                  {t("workspace.description")}
                  <span className="text-gray-400 dark:text-neutral-600 text-xs font-normal ml-2">
                    ({t("common.optional", { defaultValue: "Opcional" })})
                  </span>
                </label>
                <textarea
                  {...register("description")}
                  className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all min-h-[120px] resize-none"
                  placeholder={t("workspace.description_placeholder")}
                />
                <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                  {t("workspace.modal.description_hint")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700 transition-colors font-medium hover:border-gray-400 dark:hover:border-neutral-600"
                >
                  {t("common.cancel")}
                </button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold shadow-lg shadow-primary-600/25"
                >
                  {isSubmitting ? t("common.creating") : t("workspace.create")}
                </Button>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-neutral-800">
                <p className="text-xs text-gray-500 dark:text-neutral-500 text-center">
                  {t("workspace.modal.footer_note")}
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}

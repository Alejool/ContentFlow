import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Plus, Users, Building2, ExternalLink, Settings as SettingsIcon, Info } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Input from "@/Components/common/Modern/Input";
import Button from "@/Components/common/Modern/Button";

const workspaceSchema = z.object({
    name: z.string().min(1, "Workspace name is required").max(255),
    description: z.string().max(1000).optional().or(z.literal("")),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const AvatarStack = ({ users, roles, max = 4 }: { users: any[], roles: any[], max?: number }) => {
    const displayUsers = Array.isArray(users) ? users.slice(0, max) : [];
    const remaining = users.length > max ? users.length - max : 0;

    return (
        <div className="flex -space-x-2 overflow-hidden py-1">
            {displayUsers.map((user) => {
                const roleId = user.pivot?.role_id;
                const role = roles.find(r => r.id === roleId);
                const roleName = role ? role.name : 'Member';

                return (
                    <div
                        key={user.id}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-gray-100 dark:bg-neutral-800 overflow-hidden cursor-help hover:z-10 transition-all duration-200"
                        title={`${user.name} - ${roleName}`}
                    >
                        {user.photo_url ? (
                            <img src={user.photo_url} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 select-none">
                                {user.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                );
            })}
            {remaining > 0 && (
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800 ring-2 ring-white dark:ring-neutral-900 text-[10px] font-bold text-gray-400 dark:text-gray-500 shadow-inner select-none"
                    title={`${remaining} more members`}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
};

export default function Index({ workspaces, roles }: { workspaces: any[], roles: any[] }) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<WorkspaceFormData>({
        resolver: zodResolver(workspaceSchema),
        defaultValues: {
            name: '',
            description: '',
        }
    });

    const handleSwitch = (workspaceId: number) => {
        if (workspaceId === auth.user.current_workspace_id) return;

        router.post(route('workspaces.switch', workspaceId), {}, {
            onSuccess: () => {
                toast.success(t('workspace.switched_successfully'));
            },
        });
    };

    const onSubmit = (data: WorkspaceFormData) => {
        setIsSubmitting(true);
        router.post(route('workspaces.store'), data, {
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
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-200">
                        {t('workspace.my_workspaces')}
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-900/20"
                    >
                        <Plus className="h-5 w-5" />
                        {t('workspace.create_new')}
                    </button>
                </div>
            }
        >
            <Head title={t('workspace.my_workspaces')} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-0">
                {workspaces.map((workspace) => (
                    <div
                        key={workspace.id}
                        className="group relative bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 transition-all duration-300 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-600/10 shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 bg-primary-600/10 rounded-xl flex items-center justify-center text-primary-500 font-bold text-xl group-hover:scale-110 transition-transform">
                                {workspace.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                                {roles.find(r => r.id === workspace.pivot.role_id)?.name}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-200 mb-2 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {workspace.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-neutral-500 mb-6 line-clamp-2 min-h-[2.5rem]">
                            {workspace.description || t('workspace.no_description')}
                        </p>

                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                                <AvatarStack users={workspace.users} roles={roles} />
                            </div>
                            <div className="flex-1" />
                            <div className="flex items-center gap-2">
                                {auth.user.current_workspace_id === workspace.id ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                        {t('workspace.active')}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleSwitch(workspace.id)}
                                        className="px-3 py-1.5 bg-white dark:bg-neutral-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 text-xs font-bold rounded-lg border border-gray-200 dark:border-neutral-700 hover:border-primary-200 dark:hover:border-primary-800/50 transition-all duration-200 shadow-sm"
                                    >
                                        {t('workspace.switch')}
                                    </button>
                                )}

                                {(() => {
                                    const role = roles.find(r => r.id === workspace.pivot.role_id);
                                    const canManage = ['owner', 'admin'].includes(role?.slug);
                                    return (
                                        <Link
                                            href={route('workspaces.settings', workspace.id)}
                                            className={`p-1.5 rounded-lg transition-all duration-200 ${canManage
                                                ? "text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:text-neutral-500 dark:hover:text-white dark:hover:bg-neutral-800"
                                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-gray-300 dark:hover:bg-neutral-800 border border-transparent border-gray-200 dark:border-neutral-700"
                                                }`}
                                            title={canManage ? "Workspace Settings" : "Team & Info"}
                                        >
                                            {canManage ? (
                                                <SettingsIcon className="h-4 w-4" />
                                            ) : (
                                                <Info className="h-4 w-4" />
                                            )}
                                        </Link>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-50">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {t('workspace.create_new_workspace')}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Input
                                id="name"
                                label={t('workspace.name')}
                                placeholder={t('workspace.name_placeholder')}
                                register={register}
                                error={errors.name?.message}
                                required
                                className="bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-2">
                                    {t('workspace.description')}
                                </label>
                                <textarea
                                    {...register('description')}
                                    className="w-full bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 min-h-[100px] transition-colors"
                                    placeholder={t('workspace.description_placeholder')}
                                />
                                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                            </div>

                            <div className="flex flex-col-reverse md:flex-row gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
                                >
                                    {t('common.cancel')}
                                </button>
                                <Button
                                    type="submit"
                                    loading={isSubmitting}
                                    className="flex-1"
                                >
                                    {isSubmitting ? t('common.creating') : t('workspace.create')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import WorkspaceInfoBadge from "@/Components/Workspace/WorkspaceInfoBadge";
import { Head, usePage, router, Link } from "@inertiajs/react";
import { Settings as SettingsIcon, Shield, Users, Share2, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import MembersManagement from "@/Components/Workspace/MembersManagement";
import toast from "react-hot-toast";
import Input from "@/Components/common/Modern/Input";
import Button from "@/Components/common/Modern/Button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface WorkspaceSettingsProps {
    roles: any[];
    workspace: any;
}

const settingsSchema = z.object({
    name: z.string().min(1, "Workspace name is required").max(255),
    description: z.string().max(1000).optional().or(z.literal("")),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function WorkspaceSettings({ roles = [], workspace }: WorkspaceSettingsProps) {
    const { current_workspace: globalWorkspace, auth } = usePage().props as any;
    const current_workspace = workspace || globalWorkspace;

    if (!current_workspace) {
        return (
            <AuthenticatedLayout>
                <Head title="Settings" />
                <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
                    <p>Loading workspace settings...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    const [activeTab, setActiveTab] = useState<"general" | "members" | "roles" | "integrations">(
        "general"
    );

    const currentUser = current_workspace.users ?
        (Array.isArray(current_workspace.users)
            ? current_workspace.users.find((u: any) => Number(u.id) === Number(auth.user.id))
            : Object.values(current_workspace.users).find((u: any) => Number(u.id) === Number(auth.user.id)))
        : null;

    const userRole = currentUser?.pivot?.role?.slug || currentUser?.role?.slug;
    const isOwner = Number(current_workspace.created_by) === Number(auth.user.id) || userRole === 'owner';

    const canManageWorkspace = isOwner || userRole === 'admin';

    const GeneralSettings = () => {
        const [isSaving, setIsSaving] = useState(false);
        const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormData>({
            resolver: zodResolver(settingsSchema),
            defaultValues: {
                name: current_workspace.name,
                description: current_workspace.description || "",
            },
        });

        const onSubmit = (data: SettingsFormData) => {
            setIsSaving(true);
            router.put(route("workspaces.update", current_workspace.id), data, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Workspace updated successfully");
                    setIsSaving(false);
                },
                onError: () => setIsSaving(false),
            });
        };

        return (
            <div className="bg-white dark:bg-neutral-800 shadow rounded-lg p-4 md:p-6 border border-gray-200 dark:border-neutral-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    General Settings
                </h3>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-full md:max-w-2xl">
                    <Input
                        id="name"
                        label="Workspace Name"
                        register={register}
                        error={errors.name?.message}
                        required
                    />

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                        </label>
                        <textarea
                            {...register("description")}
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors"
                            rows={4}
                            placeholder="Briefly describe what this workspace is for..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            loading={isSaving}
                            disabled={!canManageWorkspace}
                            className="w-full md:w-auto"
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        );
    };

    const IntegrationsSettings = () => {
        const [isSaving, setIsSaving] = useState(false);
        const [testing, setTesting] = useState<string | null>(null);
        const [activity, setActivity] = useState<any[]>([]);
        const [loadingActivity, setLoadingActivity] = useState(false);

        const { register, handleSubmit, setValue, getValues } = useForm({
            defaultValues: {
                slack_webhook_url: current_workspace.slack_webhook_url || "",
                discord_webhook_url: current_workspace.discord_webhook_url || "",
            },
        });

        const fetchActivity = async () => {
            try {
                setLoadingActivity(true);
                const response = await axios.get(route('api.workspaces.activity', current_workspace.id));
                setActivity(response.data.data || []);
            } catch (error) {
                console.error("Failed to fetch activity", error);
            } finally {
                setLoadingActivity(false);
            }
        };

        const onSubmit = (data: any) => {
            setIsSaving(true);
            router.put(route("workspaces.update", current_workspace.id), data, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Integrations updated successfully");
                    setIsSaving(false);
                },
                onError: () => setIsSaving(false),
            });
        };

        const testConnection = async (type: 'slack' | 'discord') => {
            const currentUrl = getValues(type === 'slack' ? 'slack_webhook_url' : 'discord_webhook_url');
            if (!currentUrl) {
                toast.error(`Please enter a ${type} webhook URL first.`);
                return;
            }

            setTesting(type);
            try {
                const response = await axios.post(route('api.workspaces.webhooks.test', { workspace: current_workspace.id }), {
                    type,
                    url: currentUrl
                });
                toast.success(response.data.message);
                fetchActivity();
            } catch (error: any) {
                const message = error.response?.data?.message || error.message || `Failed to test ${type} connection`;
                toast.error(message, { duration: 6000 });
            } finally {
                setTesting(null);
            }
        };

        useEffect(() => {
            fetchActivity();
        }, []);

        return (
            <div className="space-y-6">
                <div className="bg-white dark:bg-neutral-800 shadow rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                        Webhook Integrations
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Configure Slack or Discord webhooks to receive real-time notifications about publication failures, approval requests, and more.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                        <div className="space-y-4">
                            <div>
                                <Input
                                    id="slack_webhook_url"
                                    label="Slack Webhook URL"
                                    register={register}
                                    placeholder="https://hooks.slack.com/services/..."
                                />
                                <div className="mt-2 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        buttonStyle="outline"
                                        size="sm"
                                        onClick={() => testConnection('slack')}
                                        loading={testing === 'slack'}
                                    >
                                        Test Slack
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Input
                                    id="discord_webhook_url"
                                    label="Discord Webhook URL"
                                    register={register}
                                    placeholder="https://discord.com/api/webhooks/..."
                                />
                                <div className="mt-2 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        buttonStyle="outline"
                                        size="sm"
                                        onClick={() => testConnection('discord')}
                                        loading={testing === 'discord'}
                                    >
                                        Test Discord
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" loading={isSaving} disabled={!canManageWorkspace}>
                                Save Integration Settings
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="bg-white dark:bg-neutral-800 shadow rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-neutral-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Notification Activity
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                            <thead className="bg-gray-50 dark:bg-neutral-900/50">
                                <tr>
                                    <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                    <th className="px-3 md:px-6 py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                                {activity.map((log) => (
                                    <tr key={log.id}>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900 dark:text-white uppercase">
                                            {log.channel}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={log.event_type}>
                                            {log.event_type}
                                        </td>
                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 md:py-1 text-[10px] md:text-xs rounded-full font-bold ${log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {log.success ? 'Sent' : 'Failed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {activity.length === 0 && !loadingActivity && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                            No recent notification activity found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const RolesManagement = () => (
        <div className="bg-white dark:bg-neutral-800 shadow rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-neutral-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Roles & Permissions
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Overview of available roles and their associated permissions in ContentFlow.
                </p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                {roles.map((role) => (
                    <div key={role.id} className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-2">
                            <div>
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center flex-wrap gap-2">
                                    {role.name}
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 font-mono">
                                        {role.slug}
                                    </span>
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {role.description || "No description provided."}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {role.permissions?.map((permission: any) => (
                                <div
                                    key={permission.id}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800"
                                    title={permission.description}
                                >
                                    {permission.name}
                                </div>
                            ))}
                            {(!role.permissions || role.permissions.length === 0) && (
                                <span className="text-sm text-gray-400 italic">No permissions assigned.</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title={`${current_workspace.name} - Settings`} />

            <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                Workspace Settings
                            </h1>
                            <p className="mt-1 text-sm md:text-base text-gray-600 dark:text-gray-400">
                                Manage {current_workspace.name} workspace
                            </p>
                        </div>
                        <div className="w-fit">
                            <WorkspaceInfoBadge variant="full" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <nav className="flex flex-wrap gap-2 md:gap-4 pb-px border-b border-gray-200 dark:border-neutral-700">
                        {[
                            { id: "general", label: "General", icon: SettingsIcon },
                            { id: "members", label: "Members", icon: Users },
                            { id: "roles", label: "Roles", icon: Shield },
                            { id: "integrations", label: "Integrations", icon: Share2 },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3 md:px-4 py-2.5 -mb-px border-b-2 transition-colors font-medium text-xs md:text-sm ${activeTab === tab.id
                                    ? "border-primary-600 text-primary-600 dark:text-primary-400"
                                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Integrations Alert */}
                {activeTab === 'integrations' && !isOwner && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                            Note: Integration settings can only be fully managed by workspace owners.
                        </p>
                    </div>
                )}

                {/* Content */}
                <div className="min-h-[400px]">
                    {activeTab === "general" && <GeneralSettings />}
                    {activeTab === "members" && <MembersManagement roles={roles} workspace={current_workspace} />}
                    {activeTab === "roles" && <RolesManagement />}
                    {activeTab === "integrations" && <IntegrationsSettings />}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

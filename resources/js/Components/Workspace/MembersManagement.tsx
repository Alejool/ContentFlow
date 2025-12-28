import InviteMemberModal from "@/Components/Workspace/InviteMemberModal";
import Select from "@/Components/common/Modern/Select";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Shield, Trash2, UserCog, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface MembersManagementProps {
    roles?: any[];
    workspace: any;
}

export default function MembersManagement({ roles = [], workspace }: MembersManagementProps) {
    const { auth } = usePage().props as any;
    // Use the passed workspace prop, fallback to global if somehow missing (though Settings ensures it)
    const current_workspace = workspace;

    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const fetchMembers = async () => {
        if (!current_workspace?.id) return;

        try {
            setIsLoading(true);
            const response = await axios.get(route('workspaces.members', current_workspace.id));
            setMembers(response.data.members || []);
        } catch (error) {
            console.error("Failed to fetch members", error);
            toast.error("Failed to load members list");
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
    const canManageMembers = ["owner", "admin"].includes(userRoleSlug) || Number(current_workspace.created_by) === Number(auth.user.id);

    const handleRoleChange = async (userId: number, newRoleId: number) => {
        if (!canManageMembers) return;
        try {
            await axios.put(route('workspaces.members.update-role', { workspace: current_workspace.id, user: userId }), {
                role_id: newRoleId
            });
            toast.success("Member role updated successfully");
            fetchMembers();
        } catch (error) {
            console.error("Failed to update role", error);
            toast.error("Failed to update member role");
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!canManageMembers) return;
        if (!confirm("Are you sure you want to remove this member from the workspace?")) return;

        try {
            await axios.delete(route('workspaces.members.remove', { workspace: current_workspace.id, user: userId }));
            toast.success("Member removed successfully");
            fetchMembers();
        } catch (error) {
            console.error("Failed to remove member", error);
            toast.error("Failed to remove member");
        }
    };

    const stats = [
        { label: "Total Members", value: members.length, icon: Users, color: "text-primary-600" },
        { label: "Owners", value: roleDistribution[roles.find(r => r.slug === 'owner')?.id] || 0, icon: Shield, color: "text-purple-600" },
        { label: "Admins", value: roleDistribution[roles.find(r => r.slug === 'admin')?.id] || 0, icon: Shield, color: "text-blue-600" },
        { label: "Members", value: roleDistribution[roles.find(r => r.slug === 'member')?.id] || 0, icon: UserCog, color: "text-green-600" },
    ];

    const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

    if (isLoading) {
        return (
            <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading members...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-neutral-800 rounded-lg p-3 md:p-4 border border-gray-200 dark:border-neutral-700 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                            </div>
                            <stat.icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color} opacity-80`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Workspace Members
                    </h3>
                    {canManageMembers && (
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs md:text-sm font-bold shadow-sm"
                        >
                            <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:inline">Invite Member</span>
                            <span className="md:hidden">Invite</span>
                        </button>
                    )}
                </div>

                <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {members.map((member: any) => {
                        const isMe = Number(member.id) === Number(auth.user.id);
                        const isCreator = Number(current_workspace.created_by) === Number(member.id);
                        const roleId = member.pivot?.role_id;
                        const currentRole = roles.find(r => r.id === roleId) || { name: 'Member', slug: 'member' };

                        return (
                            <div key={member.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden shrink-0 border border-gray-100 dark:border-neutral-600">
                                        {member.photo_url ? (
                                            <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-neutral-800">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                                            {member.name}
                                            {isMe && <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">You</span>}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{member.email}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 md:gap-4 w-full md:w-auto pl-14 md:pl-0">
                                    {isCreator || !canManageMembers ? (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${isCreator
                                            ? "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
                                            : "bg-gray-50 text-gray-600 border-gray-100 dark:bg-neutral-700 dark:text-gray-400 dark:border-neutral-600"
                                            }`}>
                                            {isCreator ? "Owner" : currentRole.name}
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
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                                            title="Remove Member"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {members.length === 0 && !isLoading && (
                        <div className="p-8 text-center text-gray-500">
                            No members found in this workspace.
                        </div>
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
        </div>
    );
}

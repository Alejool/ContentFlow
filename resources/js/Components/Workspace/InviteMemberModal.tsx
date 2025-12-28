import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import Modal from "@/Components/common/ui/Modal";
import { useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Mail, Shield, UserPlus } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    roles: any[];
    workspace: any;
}

const inviteSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    role_id: z.number().min(1, "Please select a role"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteMemberModal({ isOpen, onClose, onSuccess, roles, workspace }: InviteMemberModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            email: "",
            role_id: roles.find(r => r.slug === 'member')?.id || roles[0]?.id
        }
    });

    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.name,
        icon: <Shield className="w-4 h-4" />
    }));

    const onSubmit = async (data: InviteFormData) => {
        if (!workspace?.id) {
            toast.error("Workspace information is missing");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await axios.post(route('workspaces.invite', workspace.id), data);
            toast.success(response.data.message || "Member invited successfully");
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Invite error", error);
            if (error.response?.data?.errors) {
                // Get the first error message from the validation errors object
                const firstErrorField = Object.keys(error.response.data.errors)[0];
                const errorMessage = error.response.data.errors[firstErrorField][0];
                toast.error(errorMessage);
            } else {
                const message = error.response?.data?.message || "Failed to invite member";
                toast.error(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="p-4 md:p-6 overflow-x-hidden">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg w-fit shrink-0">
                        <UserPlus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                            Invite Member
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            Add a member to {workspace?.name}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                        id="email"
                        label="Email Address"
                        type="email"
                        placeholder="colleague@example.com"
                        register={register}
                        error={errors.email?.message}
                        icon={Mail}
                        required
                    />

                    <div className="space-y-1 relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Role
                        </label>
                        <Select
                            id="role_id"
                            options={roleOptions}
                            value={watch('role_id')}
                            onChange={(val) => setValue('role_id', Number(val), { shouldValidate: true })}
                            placeholder="Select a role"
                        />
                        {errors.role_id && <p className="text-xs text-red-500 mt-1">{errors.role_id.message}</p>}
                    </div>

                    <div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            type="button"
                            disabled={isSubmitting}
                            className="w-full md:w-auto order-2 md:order-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            icon={UserPlus}
                            className="w-full md:w-auto order-1 md:order-2"
                        >
                            Invite Member
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

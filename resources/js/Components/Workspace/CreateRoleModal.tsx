import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import Modal from "@/Components/common/ui/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CheckSquare, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRole: any) => void;
  workspace: any;
}

const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  permissions: z.array(z.number()).default([]),
  approval_participant: z.boolean().default(false),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export default function CreateRoleModal({
  isOpen,
  onClose,
  onSuccess,
  workspace,
}: CreateRoleModalProps) {
  const { t } = useTranslation();
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
      approval_participant: false,
    },
  });

  const selectedPermissions = watch("permissions");

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
      reset();
    }
  }, [isOpen, reset]);

  const fetchPermissions = async () => {
    try {
      setIsLoadingPermissions(true);
      const response = await axios.get(
        route("api.v1.workspaces.permissions", workspace.id),
      );
      setAllPermissions(response.data.data || []);
    } catch (error) {
      toast.error(t("workspace.roles_management.role_created_error"));
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleTogglePermission = (id: number) => {
    const current = selectedPermissions || [];
    const updated = current.includes(id)
      ? current.filter((p) => p !== id)
      : [...current, id];
    setValue("permissions", updated);
  };

  const onSubmit = async (data: CreateRoleFormData) => {
    try {
      const response = await axios.post(
        route("api.v1.workspaces.roles.store", workspace.id),
        data,
      );
      toast.success(t("workspace.roles_management.role_created_success"));
      onSuccess(response.data.role);
      onClose();
      reset();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t("workspace.roles_management.role_created_error"),
      );
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="lg">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("workspace.roles_management.create_role")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("workspace.roles_management.create_role_subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Input
                  id="role_name"
                  label={t("workspace.roles_management.role_name")}
                  placeholder={t(
                    "workspace.roles_management.role_name_placeholder",
                  )}
                  {...register("name")}
                  error={errors.name?.message}
                />
              </div>
              <Textarea
                id="role_description"
                label={t("workspace.roles_management.role_description")}
                placeholder={t(
                  "workspace.roles_management.role_description_placeholder",
                )}
                rows={3}
                {...register("description")}
                error={errors.description?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("workspace.roles_management.key_permissions_label")}
              </label>
              <div className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-800 rounded-lg p-3 h-[200px] overflow-y-auto space-y-2">
                {isLoadingPermissions ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  allPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedPermissions?.includes(permission.id)
                          ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
                          : "hover:bg-white dark:hover:bg-neutral-800"
                      }`}
                      onClick={() => handleTogglePermission(permission.id)}
                    >
                      <CheckSquare
                        className={`w-4 h-4 ${selectedPermissions?.includes(permission.id) ? "opacity-100" : "opacity-30"}`}
                      />
                      <div className="text-xs">
                        <div className="font-bold">{permission.name}</div>
                        <div className="opacity-70 truncate max-w-[200px]">
                          {permission.description}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <Button variant="ghost" onClick={onClose} type="button">
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting} icon={Save}>
              {t("workspace.roles_management.create_role")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

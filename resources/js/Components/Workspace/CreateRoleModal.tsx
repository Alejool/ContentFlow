import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Modal from "@/Components/common/ui/Modal";
import axios from "axios";
import { CheckSquare, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRole: any) => void;
  workspace: any;
}

export default function CreateRoleModal({
  isOpen,
  onClose,
  onSuccess,
  workspace,
}: CreateRoleModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen]);

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
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error(t("workspace.roles_management.name_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        route("api.v1.workspaces.roles.store", workspace.id),
        {
          name,
          description,
          permissions: selectedPermissions,
        },
      );
      toast.success(t("workspace.roles_management.role_created_success"));
      onSuccess(response.data.role);
      onClose();
      // Reset form
      setName("");
      setDescription("");
      setSelectedPermissions([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("workspace.roles_management.role_created_error"));
    } finally {
      setIsSubmitting(false);
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

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                id="role_name"
                label={t("workspace.roles_management.role_name")}
                placeholder={t("workspace.roles_management.role_name_placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("workspace.roles_management.role_description")}
                </label>
                <textarea
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t("workspace.roles_management.role_description_placeholder")}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
                        selectedPermissions.includes(permission.id)
                          ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
                          : "hover:bg-white dark:hover:bg-neutral-800"
                      }`}
                      onClick={() => handleTogglePermission(permission.id)}
                    >
                      <CheckSquare
                        className={`w-4 h-4 ${selectedPermissions.includes(permission.id) ? "opacity-100" : "opacity-30"}`}
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

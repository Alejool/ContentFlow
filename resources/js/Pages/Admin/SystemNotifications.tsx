import Button from "@/Components/common/Modern/Button";
import ModernCard from "@/Components/common/Modern/Card";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import Textarea from "@/Components/common/Modern/Textarea";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AdminNavigation from "@/Components/Admin/AdminNavigation";
import { Head, useForm } from "@inertiajs/react";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  Send,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SystemNotifications() {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors, reset } = useForm({
    title: "",
    message: "",
    description: "",
    type: "info",
    icon: "Bell",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route("admin.notifications.send"), {
      onSuccess: () => {
        reset();
      },
    });
  };

  const notificationTypes = [
    {
      value: "info",
      label: t("notifications.admin.form.types.info"),
      icon: <Info className="w-4 h-4" />,
    },
    {
      value: "success",
      label: t("notifications.admin.form.types.success"),
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      value: "warning",
      label: t("notifications.admin.form.types.warning"),
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      value: "error",
      label: t("notifications.admin.form.types.error"),
      icon: <XCircle className="w-4 h-4" />,
    },
  ];

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-center text-gray-900 dark:text-gray-100 text-3xl mt-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t("admin.system_notifications.page_title")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("admin.system_notifications.page_subtitle")}
            </p>
          </div>
        </div>
      }
    >
      <Head title={t("admin.system_notifications.page_title")} />

      <AdminNavigation currentRoute="/admin/system-notifications" />

      <div className="py-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ModernCard
            title={t("notifications.admin.card_title")}
            description={t("notifications.admin.card_description")}
            icon={Bell}
            headerColor="orange"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    id="title"
                    label={t("notifications.admin.form.title")}
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    error={errors.title}
                    placeholder={t(
                      "notifications.admin.form.title_placeholder",
                    )}
                    required
                  />

                  <Select
                    id="type"
                    label={t("notifications.admin.form.type")}
                    value={data.type}
                    onChange={(value: string | number | string[]) =>
                      setData("type", String(Array.isArray(value) ? value[0] : value))
                    }
                    error={errors.type}
                    options={notificationTypes}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Input
                    id="icon"
                    label={t("notifications.admin.form.icon")}
                    value={data.icon}
                    onChange={(e) => setData("icon", e.target.value)}
                    error={errors.icon}
                    placeholder={t("notifications.admin.form.icon_placeholder")}
                  />
                </div>
              </div>

              <Textarea
                id="message"
                label={t("notifications.admin.form.message")}
                value={data.message}
                onChange={(e) => setData("message", e.target.value)}
                error={errors.message}
                placeholder={t("notifications.admin.form.message_placeholder")}
                required
                rows={3}
              />

              <Textarea
                id="description"
                label={t("notifications.admin.form.description")}
                value={data.description}
                onChange={(e) => setData("description", e.target.value)}
                error={errors.description}
                placeholder={t(
                  "notifications.admin.form.description_placeholder",
                )}
                rows={4}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={processing}
                  icon={Send}
                >
                  {t("notifications.admin.form.submit")}
                </Button>
              </div>
            </form>
          </ModernCard>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

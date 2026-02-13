import Button from "@/Components/common/Modern/Button";
import ModernCard from "@/Components/common/Modern/Card";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import Textarea from "@/Components/common/Modern/Textarea";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
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
  const { theme } = useTheme();
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
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          {t("notifications.admin.page_title")}
        </h2>
      }
    >
      <Head title={t("notifications.admin.page_title")} />

      <div className="py-12">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
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
                    onChange={(value: string | number) =>
                      setData("type", String(value))
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

import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import GuestLayout from "@/Layouts/GuestLayout";
import { getErrorMessage } from "@/Utils/validation";
import { Head, useForm } from "@inertiajs/react";
import { CheckCircle, Lock } from "lucide-react";
import { FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

export default function ConfirmPassword() {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors, reset } = useForm({
    password: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();

    post(route("password.confirm"), {
      onFinish: () => reset("password"),
    });
  };

  return (
    <GuestLayout section="confirm-password">
      <Head title={t("confirm-password.title")} />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white ">
              {t("confirm-password.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t("confirm-password.description")}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <Input
                id="password"
                type="password"
                name="password"
                label={t("confirm-password.label")}
                value={data.password}
                className="mt-1 block w-full"
                placeholder={t("confirm-password.placeholder")}
                onChange={(e) => setData("password", e.target.value)}
                required
                autoFocus
                icon={Lock}
                error={getErrorMessage(errors.password, t, "password")}
              />
            </div>

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                loading={processing}
                loadingText={t("confirm-password.button")}
                fullWidth
                icon={CheckCircle as any}
                disabled={processing}
              >
                {t("confirm-password.button")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </GuestLayout>
  );
}

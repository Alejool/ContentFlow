import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import PhoneInput from "@/Components/common/Modern/PhoneInput";
import ConnectedAccounts from "@/Components/profile/Partials/ConnectedAccounts";
import AvatarSettings from "@/Pages/Profile/AvatarSettings";
import { useUser } from "@/Hooks/useUser";
import { Link } from "@inertiajs/react";
import {
  CheckCircle,
  Mail,
  MailWarning,
  Send,
  User as UserIcon,
} from "lucide-react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { CountryCode } from "libphonenumber-js";

// List of supported countries (LatAm + US + España)
const SUPPORTED_COUNTRIES: CountryCode[] = [
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "SV",
  "GT",
  "HT",
  "HN",
  "MX",
  "NI",
  "PA",
  "PY",
  "PE",
  "PR",
  "UY",
  "VE",
  "US",
  "ES",
];

interface UpdateProfileInformationProps {
  mustVerifyEmail: boolean;
  user: any;
  status: string | null | undefined;
  className?: string;
}

export default function UpdateProfileInformation({
  mustVerifyEmail,
  user: initialUser,
  status,
  className = "",
}: UpdateProfileInformationProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    hasChanges,
    user,
    control,
  } = useUser(initialUser);

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="">
        {/* Layout de dos columnas en md+ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Columna izquierda: Avatar */}
          <div className="md:col-span-4">
            <AvatarSettings user={user} />
          </div>

          {/* Columna derecha: Información */}
          <div className="md:col-span-8 space-y-8">
            {/* Sección: Información Personal */}
            <div>
              <div className="flex items-center gap-3 pb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("profile.information.sections.personal")}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Input
                  id="name"
                  label={t("profile.information.nameLabel")}
                  placeholder={t("profile.information.namePlaceholder")}
                  register={register}
                  error={errors.name?.message}
                  sizeType="lg"
                  variant="filled"
                  icon={UserIcon}
                  required
                />

                <div className="relative">
                  <Input
                    id="email"
                    label={t("profile.information.emailLabel")}
                    type="email"
                    register={register}
                    error={errors.email?.message}
                    placeholder={t("profile.information.emailPlaceholder")}
                    sizeType="lg"
                    variant="filled"
                    icon={Mail}
                    disabled
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div className="border-t border-gray-100 dark:border-neutral-800 pt-8">
              <div className="flex items-center gap-3 pb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("profile.information.sections.contact")}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value || ""}
                      onChange={field.onChange}
                      label={t("profile.information.phoneLabel")}
                      placeholder={t("profile.information.phonePlaceholder")}
                      error={errors.phone?.message}
                      disabled={isSubmitting}
                      countries={SUPPORTED_COUNTRIES}
                      defaultCountry="CO"
                      required={false}
                    />
                  )}
                />

                <Textarea
                  id="bio"
                  label={t("profile.information.bioLabel")}
                  placeholder={t("profile.information.bioPlaceholder")}
                  register={register}
                  name="bio"
                  error={errors.bio?.message}
                  rows={5}
                  variant="filled"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Conexiones */}
        <div className="border-t border-gray-100 dark:border-neutral-800 pt-8 mt-8">
          <div className="flex items-center gap-3 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("profile.connectedAccounts.title")}
            </h3>
          </div>
          <ConnectedAccounts />
        </div>

        {mustVerifyEmail && user?.email_verified_at === null && (
          <div className="rounded-lg p-6 shadow-inner bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
            <div className="flex items-center gap-3 font-bold text-amber-800 dark:text-amber-300">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <MailWarning className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-lg">
                {t("profile.statistics.emailStatus")}:{" "}
                {t("profile.statistics.unverified")}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <p className="text-sm flex-1 leading-relaxed text-amber-700 dark:text-amber-200/70 font-medium">
                {t("profile.information.emailUnverified")}
              </p>
              <Link
                href={route("verification.send")}
                method="post"
                as="button"
                className="px-6 py-3 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 bg-primary-600 hover:bg-primary-500 text-white border-0"
              >
                <Send className="w-4 h-4" />
                {t("profile.information.sendVerification")}
              </Link>
            </div>

            {status === "verification-link-sent" && (
              <div className="mt-4 text-sm font-bold flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                <CheckCircle className="w-5 h-5" />
                {t("profile.information.verificationSent")}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

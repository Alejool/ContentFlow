import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";
import ConnectedAccounts from "@/Components/profile/Partials/ConnectedAccounts";
import { useUser } from "@/Hooks/useUser";
import { Link } from "@inertiajs/react";
import {
  AlertTriangle,
  CheckCircle,
  Mail,
  MailWarning,
  Save,
  Send,
  ShieldCheck,
  TriangleAlert,
  User as UserIcon,
} from "lucide-react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// List of supported countries (LatAm + US)
const SUPPORTED_COUNTRIES = [
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
    watchedValues,
    setValue,
    control,
  } = useUser(initialUser);

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="">
        {/* Sección: Información Personal */}
        <div className="border-t border-gray-100 dark:border-neutral-800 pt-8">
          <div className="flex items-center gap-3 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("profile.information.sections.personal")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="border-t border-gray-100 dark:border-neutral-800 pt-8">
          <div className="flex items-center gap-3 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("profile.information.sections.contact")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.information.phoneLabel")}
              </label>
              <div
                className={`relative rounded-lg border bg-gray-50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-600 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 ${
                  errors.phone ? "border-red-500" : ""
                }`}
              >
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      {...field}
                      value={field.value || undefined}
                      international
                      defaultCountry="CO"
                      countries={SUPPORTED_COUNTRIES as any}
                      placeholder={t("profile.information.phonePlaceholder")}
                      disabled={isSubmitting}
                      className="modern-phone-input p-3 dark:text-white"
                    />
                  )}
                />
              </div>
              {errors.phone && (
                <div className="mt-2 text-red-600 text-sm flex items-center gap-2">
                  <TriangleAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.phone.message}</span>
                </div>
              )}

              <style>{`
                .modern-phone-input {
                  --PhoneInputCountryFlag-height: 1.25em;
                  --PhoneInputCountrySelect-marginRight: 0.5em;
                  --PhoneInputCountrySelectArrow-display: none;
                  --PhoneInputCountrySelect-width: 3em;
                  display: flex;
                  align-items: center;
                }
                .modern-phone-input input {
                  flex: 1;
                  background: transparent;
                  border: none;
                  outline: none;
                  color: inherit;
                  font-size: 1rem;
                  padding: 0 0.5rem;
                }
                .dark .modern-phone-input input::placeholder { color: #525252; }
                .modern-phone-input input::placeholder { color: #a3a3a3; }
                .PhoneInputCountrySelect {
                  cursor: pointer;
                }
                .PhoneInputCountryIcon--border {
                  box-shadow: none;
                  border-radius: 2px;
                }
              `}</style>
            </div>

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

        {/* Botón de Guardar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-gray-100 dark:border-neutral-800">
          <div className="hidden sm:block">
            {hasChanges && !isSubmitting && (
              <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
                <AlertTriangle className="w-4 h-4" />
                {t("profile.messages.unsavedChanges")}
              </div>
            )}
          </div>

          <Button
            disabled={isSubmitting}
            icon={Save}
            loading={isSubmitting}
            loadingText={t("common.saving")}
            className="w-full sm:w-auto min-w-[200px] rounded-lg font-medium bg-primary-600 hover:bg-primary-700 text-white"
            type="submit"
            size="lg"
          >
            {t("profile.actions.saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
}

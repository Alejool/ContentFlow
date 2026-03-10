import enFlag from "@/../assets/Icons/Flags/en.svg";
import esFlag from "@/../assets/Icons/Flags/es.svg";
import { Avatar } from "@/Components/common/Avatar";
import Dropdown from "@/Components/common/ui/Dropdown";
import { useSubscriptionUsage } from "@/Hooks/useSubscriptionUsage";
import { useTheme } from "@/Hooks/useTheme";
import { cssPropertiesManager } from "@/Utils/CSSCustomPropertiesManager";
import { transitionTheme } from "@/Utils/themeTransition";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import {
  Check,
  ChevronDown,
  FileText,
  Globe,
  HardDrive,
  LogOut,
  Moon,
  Palette,
  Sun,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ProfileDropdownProps {
  user: {
    name?: string;
    photo_url?: string;
    default_avatar_icon?: string;
    email?: string;
    [key: string]: any;
  };
  isProfileActive?: boolean;
}

export default function ProfileDropdown({
  user,
  isProfileActive = false,
}: ProfileDropdownProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { auth } = (usePage().props as any) || {};
  const { usage, loading: usageLoading } = useSubscriptionUsage();
  const [currentTheme, setCurrentTheme] = useState(
    user?.theme_color || "orange",
  );
  console.log('usage', usage);

  // Determinar si el usuario es owner del workspace actual
  const currentWorkspace = auth?.current_workspace;
  const isOwner =
    currentWorkspace &&
    (Number(currentWorkspace.created_by) === Number(user?.id) ||
      currentWorkspace.user_role_slug === "owner");

  const brandingColor = currentWorkspace?.white_label_primary_color;

  const colors = [
    { name: "orange", value: "orange", bg: "bg-warning-500" },
    { name: "blue", value: "blue", bg: "bg-blue-500" },
    { name: "purple", value: "purple", bg: "bg-purple-500" },
    { name: "pink", value: "pink", bg: "bg-pink-500" },
  ];

  if (brandingColor && brandingColor.startsWith("#")) {
    colors.unshift({
      name: "custom",
      value: brandingColor,
      bg: "",
      isCustom: true,
    } as any);
  }

  const languages = [
    { code: "en", name: "English", flag: enFlag },
    { code: "es", name: "Español", flag: esFlag },
  ];

  const getBaseLang = (lang: string) => lang.split("-")[0];
  const currentLangCode = getBaseLang(i18n.resolvedLanguage || i18n.language);

  const handleModeChange = (
    newTheme: "light" | "dark" | "system",
    e: React.MouseEvent,
  ) => {
    transitionTheme(() => setTheme(newTheme), { event: e });
  };

  const handleColorChange = async (color: string) => {
    setCurrentTheme(color);
    cssPropertiesManager.applyPrimaryColor(color);

    try {
      await axios.patch(route("api.v1.profile.theme.update"), {
        theme_color: color,
      });
      // La persistencia se maneja en el backend, la UI ya se actualizó visualmente
    } catch (error) {
      toast.error(t("common.error") || "Error al actualizar el tema");
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    i18n.changeLanguage(langCode);

    if (auth?.user) {
      try {
        await axios.patch(route("settings.locale"), { locale: langCode });
        // Toast de éxito eliminado - el cambio de idioma es inmediato y visible
      } catch (error) {
        toast.error(t("common.error") || "Error al actualizar el idioma");
      }
    }
  };

  const getPlanDisplayName = (planName: string) => {
    const planNames: Record<string, string> = {
      free: t("pricing.plans.free.name") || "Free",
      starter: t("pricing.plans.starter.name") || "Starter",
      growth: t("pricing.plans.growth.name") || "Growth",
      professional: t("pricing.plans.professional.name") || "Professional",
      enterprise: t("pricing.plans.enterprise.name") || "Enterprise",
    };
    return planNames[planName] || planName;
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <span className="block">
          <button
            type="button"
            className="group inline-flex items-center gap-3 py-1.5 pl-2 pr-3 rounded-full transition-all duration-300
                       bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700
                       dark:bg-neutral-800/80 dark:hover:bg-neutral-800 dark:border-neutral-700 dark:hover:border-neutral-600 dark:text-gray-200"
          >
            <div className="relative">
              <Avatar
                src={user?.photo_url}
                defaultIcon={user?.default_avatar_icon}
                name={user?.name}
                size="sm"
                showStatus
              />
            </div>

            <span className="hidden sm:block font-medium text-sm truncate max-w-[150px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {user?.name || "User"}
            </span>

            <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180 text-gray-400" />
          </button>
        </span>
      </Dropdown.Trigger>

      <Dropdown.Content
        align="right"
        width="72"
        contentClasses="py-2 bg-white/95 backdrop-blur-xl border border-white/20
                        dark:bg-neutral-900 dark:border-neutral-800/90"
      >
        <div className="px-4 mb-1">
          <div
            className="p-4 rounded-lg relative overflow-hidden group
                       bg-gradient-to-br from-gray-50 to-white border border-gray-100
                       dark:from-neutral-800 dark:to-neutral-900 dark:border-neutral-700/50"
          >
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <Avatar
                  src={user?.photo_url}
                  defaultIcon={user?.default_avatar_icon}
                  name={user?.name}
                  size="xl"
                  showStatus
                />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                  {user?.email}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 pt-3">
              <div className="flex items-center justify-between gap-2 p-1">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorChange(color.value);
                    }}
                    className={`group relative w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      currentTheme === color.value
                        ? "ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-neutral-900 scale-110"
                        : "hover:scale-110 opacity-70 hover:opacity-100"
                    } ${color.bg}`}
                    style={
                      (color as any).isCustom
                        ? { backgroundColor: color.value }
                        : {}
                    }
                    title={
                      (color as any).isCustom
                        ? t("workspace.white_label.title") || "Marca Blanca"
                        : t(`colors.${color.name}`) || color.name
                    }
                  >
                    {currentTheme === color.value && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Usage Summary */}
        {usage && !usageLoading && (
          <div className="px-2 pb-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border border-primary-200 dark:border-primary-800/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-bold text-primary-900 dark:text-primary-100">
                    {getPlanDisplayName(usage.plan)}
                  </span>
                </div>
                {/* Botón de actualizar solo visible para owners */}
                {isOwner && (
                  <Link
                    href={route("pricing")}
                    className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    {t("subscription.usage.upgradePlan", "Actualizar")}
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                {/* Publications */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <FileText className="w-3 h-3" />
                      <span>
                        {t("subscription.usage.publications", "Publicaciones")}
                      </span>
                    </div>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white">
                      {usage.publications.used} /{" "}
                      {usage.publications.total_available || usage.publications.limit !== -1
                        ? usage.publications.limit
                        : "∞"
                      }
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usage.publications.percentage >= 90
                          ? "bg-red-500"
                          : usage.publications.percentage >= 70
                            ? "bg-yellow-500"
                            : "bg-primary-500"
                      }`}
                      style={{
                        width: `${Math.min(usage.publications.percentage, 100)}%`,
                      }}
                    />
                  </div>
                  {/* Mostrar desglose de addons si existen */}
                  {usage.publications.addon_info && usage.publications.addon_info.total > 0 && (
                    <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                      <span className="font-medium">Plan:</span> {usage.publications.limit} + 
                      <span className="font-medium"> Addons:</span> {usage.publications.addon_info.remaining}/{usage.publications.addon_info.total}
                    </div>
                  )}
                </div>

                {/* Storage */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <HardDrive className="w-3 h-3" />
                      <span>
                        {t("subscription.usage.storage", "Almacenamiento")}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatBytes(usage.storage.used_bytes)} /{" "}
                      {usage.storage.total_available_gb || usage.storage.limit_gb} GB
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usage.storage.percentage >= 90
                          ? "bg-red-500"
                          : usage.storage.percentage >= 70
                            ? "bg-yellow-500"
                            : "bg-primary-500"
                      }`}
                      style={{
                        width: `${Math.min(usage.storage.percentage, 100)}%`,
                      }}
                    />
                  </div>
                  {/* Mostrar desglose de addons si existen */}
                  {usage.storage.addon_info && usage.storage.addon_info.total > 0 && (
                    <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                      <span className="font-medium">Plan:</span> {usage.storage.limit_gb} GB + 
                      <span className="font-medium"> Addons:</span> {usage.storage.addon_info.remaining}/{usage.storage.addon_info.total} GB
                    </div>
                  )}
                </div>
              </div>

              {usage.limits_reached && (
                <div className="mt-2 pt-2 border-t border-primary-200 dark:border-primary-800/30">
                  <Link
                    href={route("subscription.addons")}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-semibold">
                        {t("subscription.addons.buyCredits", "Comprar Créditos")}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 mb-2">
            {theme === "dark" ? (
              <Moon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            ) : theme === "system" ? (
              <Palette className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            )}
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t("profile.appearance.title") || "Apariencia"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleModeChange("light", e);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                theme === "light"
                  ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{t("profile.appearance.light") || "Claro"}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleModeChange("dark", e);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                theme === "dark"
                  ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{t("profile.appearance.dark") || "Oscuro"}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleModeChange("system", e);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                theme === "system"
                  ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>{t("profile.appearance.system") || "Sistema"}</span>
            </button>
          </div>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t("profile.language.title") || "Idioma"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLanguageChange(lang.code);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentLangCode === lang.code
                    ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 ring-2 ring-primary-500"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                <img
                  src={lang.flag}
                  alt={lang.name}
                  className="w-5 h-3.5 object-cover rounded-sm"
                />
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-2 space-y-1">
          <Dropdown.Link
            href={route("profile.edit")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full
              ${
                isProfileActive
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900dark:hover:text-white"
              }`}
          >
            <div
              className={`p-1.5 rounded-md ${
                isProfileActive
                  ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              <User className="h-4 w-4" />
            </div>
            {t("nav.profile")}
            {isProfileActive && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></div>
            )}
          </Dropdown.Link>

          <div className="h-px bg-gray-100 dark:bg-neutral-800 mx-2 my-2" />

          <Dropdown.Link
            href={route("logout")}
            method="post"
            as="button"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 !w-full mx-0 group"
          >
            <div className="p-1.5 rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            {t("nav.logout")}
          </Dropdown.Link>
        </div>
      </Dropdown.Content>
    </Dropdown>
  );
}

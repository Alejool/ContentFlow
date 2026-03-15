import enFlag from "@/../assets/Icons/Flags/en.svg";
import esFlag from "@/../assets/Icons/Flags/es.svg";
import { Avatar } from "@/Components/common/Avatar";
import { useSubscriptionUsage } from "@/Hooks/useSubscriptionUsage";
import { useTheme } from "@/Hooks/useTheme";
import { cssPropertiesManager } from "@/Utils/CSSCustomPropertiesManager";
import { transitionTheme } from "@/Utils/themeTransition";
import { Menu, MenuButton, MenuItems, Radio, RadioGroup } from "@headlessui/react";
import { Link as InertiaLink, Link, usePage } from "@inertiajs/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
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
import toast from "react-hot-toast";
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

export default function ProfileDropdown({ user, isProfileActive = false }: ProfileDropdownProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { auth } = (usePage().props as any) || {};
  const { usage, loading: usageLoading } = useSubscriptionUsage();
  const [currentTheme, setCurrentTheme] = useState(user?.theme_color || "orange");

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

  const handleModeChange = (newTheme: "light" | "dark" | "system") => {
    transitionTheme(() => setTheme(newTheme));
  };

  const queryClient = useQueryClient();

  const updateThemeColorMutation = useMutation({
    mutationFn: (color: string) =>
      axios.patch((route as any)("api.v1.profile.theme.update"), {
        theme_color: color,
      }),
    onError: () => toast.error(t("common.error") || "Error al actualizar el tema"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const updateLocaleMutation = useMutation({
    mutationFn: (locale: string) => axios.patch((route as any)("settings.locale"), { locale }),
    onError: () => toast.error(t("common.error") || "Error al actualizar el idioma"),
  });

  const handleColorChange = (color: string) => {
    setCurrentTheme(color);
    cssPropertiesManager.applyPrimaryColor(color);
    updateThemeColorMutation.mutate(color);
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    if (auth?.user) {
      updateLocaleMutation.mutate(langCode);
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
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <MenuButton className="group inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white py-1.5 pl-2 pr-3 text-gray-700 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-gray-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-800">
            <div className="relative">
              <Avatar
                src={user?.photo_url}
                defaultIcon={user?.default_avatar_icon}
                name={user?.name}
                size="sm"
                showStatus
              />
            </div>
            <span className="hidden max-w-[150px] truncate text-sm font-medium transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400 sm:block">
              {user?.name || "User"}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            />
          </MenuButton>

          <AnimatePresence>
            {open && (
              <MenuItems
                static
                as={motion.div}
                variants={{
                  hidden: { opacity: 0, scale: 0.96, y: -6 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { duration: 0.15, ease: "easeOut" },
                  },
                  exit: {
                    opacity: 0,
                    scale: 0.96,
                    y: -6,
                    transition: { duration: 0.1, ease: "easeIn" },
                  },
                }}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ originX: 1, originY: 0 }}
                className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl focus:outline-none dark:border-neutral-800/90 dark:bg-neutral-900"
              >
                {/* Header: Avatar + info + color picker */}
                <div className="px-4 pb-2 pt-4">
                  <div className="group relative overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-neutral-700/50 dark:from-neutral-800 dark:to-neutral-900">
                    <div className="relative flex items-center gap-4">
                      <Avatar
                        src={user?.photo_url}
                        defaultIcon={user?.default_avatar_icon}
                        name={user?.name}
                        size="xl"
                        showStatus
                      />
                      <div className="flex min-w-0 flex-col">
                        <p className="truncate text-base font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                          {user?.name || "User"}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-neutral-400">
                          {user?.email}
                        </p>
                        <div className="mt-1.5">
                          <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Color picker */}
                    <RadioGroup
                      value={currentTheme}
                      onChange={(val: string) => {
                        handleColorChange(val);
                      }}
                      className="mt-3 flex items-center gap-2 px-1"
                      aria-label={t("profile.appearance.color") || "Color"}
                    >
                      {colors.map((color) => (
                        <Radio
                          key={color.value}
                          value={color.value}
                          onClick={(e) => e.stopPropagation()}
                          className={({ checked }: { checked: boolean }) =>
                            `relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                              checked
                                ? "scale-110 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-900"
                                : "opacity-70 hover:scale-110 hover:opacity-100"
                            } ${color.bg}`
                          }
                          style={(color as any).isCustom ? { backgroundColor: color.value } : {}}
                          title={
                            (color as any).isCustom
                              ? t("workspace.white_label.title") || "Marca Blanca"
                              : t(`colors.${color.name}`) || color.name
                          }
                        >
                          {({ checked }: { checked: boolean }) =>
                            checked ? <Check className="h-3 w-3 text-white" /> : null
                          }
                        </Radio>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                {/* Plan Usage */}
                {usage && !usageLoading && (
                  <div className="px-4 pb-3">
                    <div className="rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100/50 p-3 dark:border-primary-800/30 dark:from-primary-900/20 dark:to-primary-800/10">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm font-bold text-primary-900 dark:text-primary-100">
                            {getPlanDisplayName(usage.plan)}
                          </span>
                        </div>
                        {isOwner && (
                          <Link
                            href={route("pricing")}
                            className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            {t("subscription.usage.upgradePlan") || "Actualizar"}
                          </Link>
                        )}
                      </div>

                      <div className="space-y-2">
                        {/* Publications */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                              <FileText className="h-3 w-3" />
                              <span>{t("subscription.usage.publications") || "Publicaciones"}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                              {usage.publications.limit === -1
                                ? `${usage.publications.used} / ∞`
                                : `${usage.publications.used} / ${usage.publications.total_available || usage.publications.limit}`}
                            </span>
                          </div>
                          {usage.publications.limit !== -1 && (
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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
                          )}
                          {usage.publications.addon_info &&
                            usage.publications.addon_info.total > 0 && (
                              <div className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                                <span className="font-medium">Plan:</span>{" "}
                                {usage.publications.limit} +{" "}
                                <span className="font-medium">Addons:</span>{" "}
                                {usage.publications.addon_info.remaining}/
                                {usage.publications.addon_info.total}
                              </div>
                            )}
                        </div>

                        {/* Storage */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                              <HardDrive className="h-3 w-3" />
                              <span>{t("subscription.usage.storage") || "Almacenamiento"}</span>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {usage.storage.limit_gb === -1
                                ? `${formatBytes(usage.storage.used_bytes)} / ∞`
                                : `${formatBytes(usage.storage.used_bytes)} / ${usage.storage.total_available_gb || usage.storage.limit_gb} GB`}
                            </span>
                          </div>
                          {usage.storage.limit_gb !== -1 && (
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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
                          )}
                          {usage.storage.addon_info && usage.storage.addon_info.total > 0 && (
                            <div className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                              <span className="font-medium">Plan:</span> {usage.storage.limit_gb} GB
                              + <span className="font-medium">Addons:</span>{" "}
                              {usage.storage.addon_info.remaining}/{usage.storage.addon_info.total}{" "}
                              GB
                            </div>
                          )}
                        </div>
                      </div>

                      {usage.limits_reached && (
                        <div className="mt-2 border-t border-primary-200 pt-2 dark:border-primary-800/30">
                          <Link
                            href={route("subscription.addons")}
                            className="group flex items-center justify-between gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-2 text-white transition-all hover:from-primary-600 hover:to-primary-700"
                          >
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              <span className="text-xs font-semibold">
                                {t("subscription.addons.buyCredits") || "Comprar Créditos"}
                              </span>
                            </div>
                            <ChevronDown className="h-3 w-3 -rotate-90 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Appearance */}
                <div className="px-4 pb-3">
                  <div className="mb-2 flex items-center gap-2">
                    {theme === "dark" ? (
                      <Moon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    ) : theme === "system" ? (
                      <Palette className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {t("profile.appearance.title") || "Apariencia"}
                    </span>
                  </div>
                  <RadioGroup
                    value={theme}
                    onChange={(val: "light" | "dark" | "system") => handleModeChange(val)}
                    className="grid grid-cols-3 gap-2"
                    aria-label={t("profile.appearance.title") || "Apariencia"}
                  >
                    {(["light", "dark", "system"] as const).map((mode) => {
                      const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Palette;
                      const label =
                        mode === "light"
                          ? t("profile.appearance.light") || "Claro"
                          : mode === "dark"
                            ? t("profile.appearance.dark") || "Oscuro"
                            : t("profile.appearance.system") || "Sistema";
                      return (
                        <Radio
                          key={mode}
                          value={mode}
                          onClick={(e) => e.stopPropagation()}
                          className={({ checked }: { checked: boolean }) =>
                            `flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                              checked
                                ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500 dark:bg-primary-900/40 dark:text-primary-400"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-700"
                            }`
                          }
                        >
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </Radio>
                      );
                    })}
                  </RadioGroup>
                </div>

                {/* Language */}
                <div className="px-4 pb-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {t("profile.language.title") || "Idioma"}
                    </span>
                  </div>
                  <RadioGroup
                    value={currentLangCode}
                    onChange={(val: string) => handleLanguageChange(val)}
                    className="flex items-center gap-2"
                    aria-label={t("profile.language.title") || "Idioma"}
                  >
                    {languages.map((lang) => (
                      <Radio
                        key={lang.code}
                        value={lang.code}
                        onClick={(e) => e.stopPropagation()}
                        className={({ checked }: { checked: boolean }) =>
                          `flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                            checked
                              ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500 dark:bg-primary-900/40 dark:text-primary-400"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-700"
                          }`
                        }
                      >
                        <img
                          src={lang.flag}
                          alt={lang.name}
                          className="h-3.5 w-5 rounded-sm object-cover"
                        />
                        <span>{lang.name}</span>
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>

                {/* Links */}
                <div className="space-y-1 px-2 pb-2">
                  <InertiaLink
                    href={route("profile.edit")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isProfileActive
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                    }`}
                  >
                    <div
                      className={`rounded-md p-1.5 ${
                        isProfileActive
                          ? "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
                          : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400"
                      }`}
                    >
                      <User className="h-4 w-4" />
                    </div>
                    {t("nav.profile")}
                    {isProfileActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />
                    )}
                  </InertiaLink>

                  <div className="mx-2 h-px bg-gray-100 dark:bg-neutral-800" />

                  <InertiaLink
                    href={route("logout")}
                    method="post"
                    as="button"
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/10 dark:hover:text-red-400"
                  >
                    <div className="rounded-md bg-gray-100 p-1.5 text-gray-500 transition-colors group-hover:bg-red-100 group-hover:text-red-500 dark:bg-neutral-800 dark:text-gray-400 dark:group-hover:bg-red-900/30 dark:group-hover:text-red-400">
                      <LogOut className="h-4 w-4" />
                    </div>
                    {t("nav.logout")}
                  </InertiaLink>
                </div>
              </MenuItems>
            )}
          </AnimatePresence>
        </>
      )}
    </Menu>
  );
}

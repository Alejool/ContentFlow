import { Avatar } from "@/Components/common/Avatar";
import Dropdown from "@/Components/common/ui/Dropdown";
import { useTheme } from "@/Hooks/useTheme";
import { LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileDropdownProps {
  user: {
    name?: string;
    photo_url?: string;
    email?: string;
    [key: string]: any;
  };
  isProfileActive?: boolean;
}

export default function ProfileDropdown({
  user,
  isProfileActive = false,
}: ProfileDropdownProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <span className="block">
          <button
            type="button"
            className={`group inline-flex items-center gap-3 py-1.5 pl-2 pr-3 rounded-full transition-all duration-300
                        ${
                          theme === "dark"
                            ? "bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-gray-200"
                            : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700"
                        } shadow-sm hover:shadow-md`}
          >
            <div className="relative">
              <Avatar
                src={user?.photo_url}
                name={user?.name}
                size="sm"
                className="ring-2 ring-white dark:ring-neutral-900 shadow-sm"
                showStatus
              />
            </div>

            <span className="hidden sm:block font-medium text-sm truncate max-w-[100px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {user.name || "User"}
            </span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              className={`h-4 w-4 transition-transform duration-300 group-hover:rotate-180 ${
                theme === "dark" ? "text-gray-400" : "text-gray-400"
              }`}
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </span>
      </Dropdown.Trigger>

      <Dropdown.Content
        align="right"
        width="64"
        contentClasses={`py-2
                  ${
                    theme === "dark"
                      ? "bg-neutral-900/95 backdrop-blur-xl border border-neutral-800"
                      : "bg-white/95 backdrop-blur-xl border border-white/20"
                  }`}
      >
        <div className="px-2 pt-2 pb-3 mb-2">
          <div
            className={`p-4 rounded-lg relative overflow-hidden group ${
              theme === "dark"
                ? "bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50"
                : "bg-gradient-to-br from-gray-50 to-white border border-gray-100"
            }`}
          >
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-primary-500/10 blur-2xl group-hover:bg-primary-500/20 transition-all duration-500"></div>

            <div className="relative flex items-center gap-4">
              <div className="relative">
                <Avatar
                  src={user?.photo_url}
                  name={user?.name}
                  size="xl"
                  className="shadow-md ring-4 ring-white dark:ring-neutral-800"
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
          </div>
        </div>

        <div className="px-2 space-y-1">
          <Dropdown.Link
            href={route("profile.edit")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full
              ${
                isProfileActive
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
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

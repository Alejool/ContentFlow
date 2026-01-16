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

interface CustomAvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function CustomAvatar({
  src,
  name = "User",
  size = "md",
  className = "",
}: CustomAvatarProps) {
  const { theme } = useTheme();

  const getInitials = (name: string) => {
    if (!name.trim()) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const avatarBgClass =
    theme === "dark"
      ? "bg-gradient-to-br from-primary-900/30 to-purple-900/30"
      : "bg-gradient-to-br from-primary-100 to-purple-100";

  const avatarTextClass =
    theme === "dark" ? "text-primary-200" : "text-primary-800";

  return (
    <div
      className={`${sizeClasses[size]} ${className} relative rounded-full overflow-hidden flex items-center justify-center font-bold shadow-lg ${avatarBgClass}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = "none";
            const fallback = document.createElement("div");
            fallback.className = `w-full h-full flex items-center justify-center ${avatarTextClass} font-bold`;
            fallback.textContent = getInitials(name);

            const parent = img.parentElement;
            if (parent) {
              const existingFallback = parent.querySelector(".avatar-fallback");
              if (existingFallback) {
                parent.removeChild(existingFallback);
              }

              fallback.className += " avatar-fallback";
              parent.appendChild(fallback);
            }
          }}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center ${avatarTextClass} avatar-fallback`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

export default function ProfileDropdown({
  user,
  isProfileActive = false,
}: ProfileDropdownProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const colorNoActive = `${
    theme === "dark"
      ? "text-white hover:text-orange-600 hover:bg-neutral-600/40"
      : "text-gray-700 hover:text-orange-600 hover:bg-gray-200/40"
  }`;

  const colorActive = `${
    theme === "dark"
      ? "bg-primary-900/30 text-primary-300"
      : "bg-primary-100 text-primary-700"
  }`;

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <span className="block">
          <button
            type="button"
            className={`inline-flex items-center p-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md
                        ${
                          theme === "dark"
                            ? "text-gray-200 hover:bg-neutral-800"
                            : "text-gray-700 hover:bg-beige-300"
                        }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`rounded-full ring-2 shadow-lg ${
                  theme === "dark" ? "ring-purple-900/50" : "ring-green-200"
                } ${
                  isProfileActive
                    ? theme === "dark"
                      ? "ring-primary-500"
                      : "ring-primary-600"
                    : ""
                }`}
              >
                <CustomAvatar
                  src={user?.photo_url}
                  name={user?.name}
                  size="md"
                />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="font-medium truncate max-w-[120px]">
                  {user.name || "User"}
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className={`ml-1 h-4 w-4 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </button>
        </span>
      </Dropdown.Trigger>

      <Dropdown.Content
        align="right"
        width="72"
        contentClasses={`shadow-xl
                  ${
                    theme === "dark"
                      ? "bg-neutral-800 text-white"
                      : "bg-white text-gray-700"
                  }`}
      >
        <div
          className={`p-3 border-b border-neutral-700/50 dark:border-gray-200/10 $`}
        >
          <div className="flex items-center gap-3">
            <CustomAvatar src={user?.photo_url} name={user?.name} size="md" />
            <div className="flex flex-col min-w-0">
              <p className="font-medium line-clamp-1 break-all">
                {user?.name || "User"}
              </p>
              <p
                className={`text-xs truncate ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <Dropdown.Link
          href={route("profile.edit")}
          className={`flex items-center space-x-2 px-3 py-2.5 transition-colors  ${colorNoActive}
                    ${isProfileActive ? colorActive : ""}`}
        >
          <User
            className={`h-4 w-4 ${
              isProfileActive
                ? theme === "dark"
                  ? "text-primary-400"
                  : "text-primary-600"
                : ""
            }`}
          />
          <span className={`${isProfileActive ? "font-semibold " : ``}`}>
            {t("nav.profile")}
          </span>
          {isProfileActive && (
            <span className="ml-auto">
              <div
                className={`w-2 h-2 rounded-full ${
                  theme === "dark" ? "bg-primary-400" : "bg-primary-600"
                }`}
              ></div>
            </span>
          )}
        </Dropdown.Link>

        <div className="border-t border-gray-100 dark:border-gray-700/50 my-1"></div>

        <Dropdown.Link
          href={route("logout")}
          method="post"
          as="button"
          className={`flex items-center space-x-2 px-3 py-2.5 transition-colors ${colorNoActive}`}
        >
          <LogOut className="h-4 w-4" />
          <span className={``}>{t("nav.logout")}</span>
        </Dropdown.Link>
      </Dropdown.Content>
    </Dropdown>
  );
}

export { CustomAvatar };

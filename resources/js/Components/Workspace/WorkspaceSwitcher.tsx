import { useForm, usePage } from "@inertiajs/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import WorkspaceDropdown from "./WorkspaceDropdown";

export default function WorkspaceSwitcher({
  isSidebarOpen,
}: {
  isSidebarOpen: boolean;
}) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const workspaces = auth?.workspaces || [];
  const current_workspace = auth?.current_workspace || null;
  const [isOpen, setIsOpen] = useState(false);
  const { post } = useForm();
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('current_workspace:', current_workspace);
  console.log('workspaces:', workspaces);
  console.log('auth:', auth);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = (slug: string) => {
    post(route("workspaces.switch", slug), {
      onSuccess: () => setIsOpen(false),
    });
  };

  if (!current_workspace) return null;

  return (
    <div className="relative px-4 py-2 z-5" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
                    w-full flex items-center justify-center gap-3 p-3 rounded-lg
                    transition-all duration-300 group
                    ${isOpen ? "bg-primary-600 shadow-lg scale-[1.02]" : "hover:bg-gray-100 dark:hover:bg-neutral-800/50"}
                `}
      >
        <div
          className={`
                    h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg
                    transition-all duration-300 overflow-hidden
                    ${isOpen ? "bg-white text-primary-600" : "bg-primary-600 text-white shadow-md group-hover:scale-110"}
                `}
        >
          {current_workspace?.white_label_logo_url  ? (
            <img
              src={current_workspace?.white_label_logo_url}
              alt={current_workspace.name}
              className="h-full w-full object-cover"
            />
          ) : (
            current_workspace.name.charAt(0).toUpperCase()
          )}
        </div>

        {isSidebarOpen && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p
                className={`text-sm font-semibold truncate ${isOpen ? "text-white" : "text-gray-700 dark:text-neutral-200"}`}
              >
                {current_workspace.name}
              </p>
              <div className="flex items-center gap-2">
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${isOpen ? "text-primary-100" : "text-primary-600 dark:text-primary-400"}`}
                >
                  {current_workspace.role?.name || t("workspace.member")}
                </p>
                <span
                  className={`w-1 h-1 rounded-full ${isOpen ? "bg-primary-200" : "bg-gray-300 dark:bg-neutral-600"}`}
                />
                <p
                  className={`text-[10px] truncate ${isOpen ? "text-primary-100" : "text-gray-500 dark:text-neutral-400"}`}
                >
                  {workspaces.length}{" "}
                  {t("workspace.workspaces", { count: workspaces.length })}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : "text-gray-400 dark:text-neutral-400"}`}
            />
          </>
        )}

        {!isSidebarOpen && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10 translate-x-1 group-hover:translate-x-0">
            {current_workspace.name}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-neutral-800 rotate-45" />
          </div>
        )}
      </button>

      {isOpen && (
        <WorkspaceDropdown
          workspaces={workspaces}
          current_workspace={current_workspace}
          isSidebarOpen={isSidebarOpen}
          onSwitch={handleSwitch}
          hasCurrentWorkspace={!!auth.user.current_workspace_id}
        />
      )}
    </div>
  );
}

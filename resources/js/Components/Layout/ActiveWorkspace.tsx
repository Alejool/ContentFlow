import { useTheme } from "@/Hooks/useTheme";
import { Link, usePage } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ActiveWorkspace() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { props } = usePage();
  const auth = props.auth as any;

  return (
    <Link
      href={route("workspaces.index")}
      className={`
                group flex items-center justify-center gap-2 px-4 py-1.5 w-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300
                ${
                  theme === "dark"
                    ? "bg-primary-900/40 text-primary-200 hover:bg-primary-900/60"
                    : "bg-primary-600 text-white hover:bg-primary-700"
                }
            `}
    >
      <span className="opacity-70">{t("workspace.active_context")}:</span>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse flex-shrink-0" />
        <span className="truncate max-w-[200px] md:max-w-none">
          {auth?.current_workspace?.name || "..."}
        </span>
      </div>
      <ChevronRight className="h-3 w-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

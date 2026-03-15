import { useTheme } from "@/Hooks/useTheme";
import { Link, usePage } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ActiveWorkspace() {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const { props } = usePage();
  const auth = props.auth as any;

  return (
    <Link
      href={route("workspaces.index")}
      className={`group flex w-full items-center justify-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
        actualTheme === "dark"
          ? "bg-primary-900/40 text-primary-200 hover:bg-primary-900/60"
          : "bg-primary-600 text-white hover:bg-primary-700"
      } `}
    >
      <span className="opacity-70">{t("workspace.active_context")}:</span>
      <div className="flex items-center gap-1.5">
        {auth?.current_workspace?.white_label_logo_url ? (
          <img
            src={auth.current_workspace.white_label_logo_url}
            alt=""
            className="h-4 w-4 object-contain"
          />
        ) : (
          <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-current" />
        )}
        <span className="max-w-[200px] truncate md:max-w-none">
          {auth?.current_workspace?.name || "..."}
        </span>
      </div>
      <ChevronRight className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

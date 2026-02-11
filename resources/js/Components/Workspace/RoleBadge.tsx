import { Shield } from "lucide-react";

interface RoleBadgeProps {
  role: any;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const RoleBadge = ({ role, showIcon = false, size = "md" }: RoleBadgeProps) => {
  const roleColors: Record<string, string> = {
    owner:
      "bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50",
    admin:
      "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50",
    member:
      "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50",
    viewer:
      "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800/50",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
  };

  const roleSlug = role?.slug || "member";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} font-semibold uppercase tracking-wider rounded-full shadow-sm ${roleColors[roleSlug]}`}
    >
      {showIcon && roleSlug === "owner" && <Shield className="h-3 w-3" />}
      {role?.name || "Member"}
    </span>
  );
};

export default RoleBadge;

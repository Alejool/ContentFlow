import { Eye, PencilLine, Shield, User, UserStar } from "lucide-react";

export type RoleSlug = "owner" | "admin" | "editor" | "member" | "viewer";

export const ROLE_STYLES: Record<
  string,
  {
    gradient: string;
    badge: string;
    icon: any;
    color: string;
    dotColor: string; // For simple dots or borders
  }
> = {
  owner: {
    gradient: "bg-gradient-to-br from-primary-500 to-primary-600",
    badge:
      "bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800",
    icon: UserStar,
    color: "text-primary-600",
    dotColor: "bg-primary-500",
  },
  admin: {
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
    badge:
      "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    icon: Shield,
    color: "text-blue-600",
    dotColor: "bg-blue-500",
  },
  editor: {
    gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
    badge:
      "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    icon: PencilLine,
    color: "text-purple-600",
    dotColor: "bg-purple-500",
  },
  member: {
    gradient: "bg-gradient-to-br from-emerald-500 to-green-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    icon: User, // Changed from UserCog to match generic member
    color: "text-emerald-600",
    dotColor: "bg-emerald-500",
  },
  viewer: {
    gradient: "bg-gradient-to-br from-slate-500 to-gray-500",
    badge:
      "bg-gray-50 text-gray-600 border-gray-100 dark:bg-neutral-700 dark:text-gray-400 dark:border-neutral-600",
    icon: Eye,
    color: "text-gray-600",
    dotColor: "bg-gray-500",
  },
  // Fallback
  default: {
    gradient: "bg-gradient-to-br from-slate-500 to-gray-500",
    badge:
      "bg-gray-50 text-gray-600 border-gray-100 dark:bg-neutral-700 dark:text-gray-400 dark:border-neutral-600",
    icon: User,
    color: "text-gray-600",
    dotColor: "bg-gray-500",
  },
};

export const getRoleStyle = (slug: string) => {
  return ROLE_STYLES[slug] || ROLE_STYLES.default;
};

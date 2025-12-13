import { PageProps } from "@/../../app/Types/inertia";
import ModernCard from "@/Components/common/Modern/Card";
import { useTheme } from "@/Hooks/useTheme";
import { Link, usePage } from "@inertiajs/react";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  LucideIcon,
  MailWarning,
  Send,
  Shield,
} from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  last_login_at?: string | null;
  [key: string]: any;
}

interface AccountStatisticsProps {
  className?: string;
  status?: string | null;
}

interface StatItem {
  icon: LucideIcon;
  title: string;
  value: string;
  color: string;
  bgColor: string;
  iconElement?: React.ReactNode;
}

export default function AccountStatistics({
  className = "",
  status = null,
}: AccountStatisticsProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const page = usePage<PageProps>();
  const user = page.props.auth.user;
  const [recentlySent, setRecentlySent] = useState<boolean>(false);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return t("profile.statistics.notAvailable");
    try {
      return new Date(dateString).toLocaleDateString(i18n.language, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return t("profile.statistics.notAvailable");
    }
  };

  const getDaysSinceJoining = (dateString: string | null): number => {
    if (!dateString) return 0;
    try {
      const joined = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - joined.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const statisticsItems: StatItem[] = [
    {
      icon: Calendar,
      title: t("profile.statistics.memberSince"),
      value: formatDate(user?.created_at || null),
      color: theme === "dark" ? "text-blue-400" : "text-blue-600",
      bgColor:
        theme === "dark"
          ? "bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-800/30"
          : "bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-100",
    },
    {
      icon: Clock,
      title: t("profile.statistics.daysActive"),
      value: `${getDaysSinceJoining(user?.created_at || null)} ${t(
        "profile.statistics.days"
      )}`,
      color: theme === "dark" ? "text-primary-400" : "text-primary-600",
      bgColor:
        theme === "dark"
          ? "bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-800/30"
          : "bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-100",
    },
    {
      icon: Shield,
      title: t("profile.statistics.accountStatus"),
      value: t("profile.statistics.active"),
      iconElement: (
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
      ),
      color: theme === "dark" ? "text-green-400" : "text-green-600",
      bgColor:
        theme === "dark"
          ? "bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-800/30"
          : "bg-gradient-to-r from-green-50 to-green-100/50 border border-green-100",
    },
  ];

  return (
    <ModernCard
      title={t("profile.statistics.title")}
      description={t("profile.statistics.description")}
      icon={BarChart3}
      headerColor="blue"
      className={className}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statisticsItems.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] ${item.bgColor}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    theme === "dark" ? "bg-white/10" : "bg-white/80"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <p
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {item.title}
                </p>
              </div>
              <div className="flex items-center">
                {item.iconElement}
                <p
                  className={`text-lg font-bold ${
                    theme === "dark" ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`p-4 rounded-lg border transition-colors duration-300
          ${
            theme === "dark"
              ? "bg-gradient-to-r from-yellow-900/10 to-primary-900/10 border-yellow-800/30"
              : "bg-gradient-to-r from-yellow-50 to-primary-50/50 border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MailWarning
                className={`w-5 h-5 ${
                  theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                }`}
              />
              <p
                className={`font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("profile.statistics.emailStatus")}
              </p>
            </div>

            {user?.email_verified_at ? (
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                ${
                  theme === "dark"
                    ? "bg-green-900/30 text-green-300 border border-green-800/50"
                    : "bg-green-100 text-green-800 border border-green-200"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {t("profile.statistics.verified")}
              </div>
            ) : (
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                ${
                  theme === "dark"
                    ? "bg-yellow-900/30 text-yellow-300 border border-yellow-800/50"
                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                }`}
              >
                <MailWarning className="w-4 h-4" />
                {t("profile.statistics.unverified")}
              </div>
            )}
          </div>

          {!user?.email_verified_at && (
            <div className="space-y-3">
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-yellow-400/80" : "text-yellow-700"
                }`}
              >
                {t("profile.information.emailUnverified")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  href={route("verification.send")}
                  method="post"
                  as="button"
                  onClick={() => setRecentlySent(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto
                    ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-yellow-700/30 to-yellow-800/30 text-yellow-300 border border-yellow-700/30 hover:from-yellow-700/40 hover:to-yellow-800/40 hover:border-yellow-600/50"
                        : "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 hover:from-yellow-200 hover:to-yellow-300"
                    }`}
                >
                  <Send className="w-4 h-4" />
                  {t("profile.information.sendVerification")}
                </Link>

                {(status === "verification-link-sent" || recentlySent) && (
                  <div
                    className={`text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg
                    ${
                      theme === "dark"
                        ? "bg-green-900/20 text-green-300 border border-green-800/30"
                        : "bg-green-50 text-green-700 border border-green-200"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t("profile.information.verificationSent")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModernCard>
  );
}

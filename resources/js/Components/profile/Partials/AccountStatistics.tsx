import { PageProps } from "@/../../app/Types/inertia";
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

  const statisticsItems = [
    {
      icon: Calendar,
      title: t("profile.statistics.memberSince"),
      value: formatDate(user?.created_at || null),
      iconColor: "text-blue-500 dark:text-blue-400",
      bgClasses:
        "from-blue-50 to-white dark:from-blue-900/20 dark:to-neutral-900 border-blue-100 dark:border-blue-800/30",
    },
    {
      icon: Clock,
      title: t("profile.statistics.daysActive"),
      value: `${getDaysSinceJoining(user?.created_at || null)} ${t(
        "profile.statistics.days",
      )}`,
      iconColor: "text-primary-500 dark:text-primary-400",
      bgClasses:
        "from-primary-50 to-white dark:from-primary-900/20 dark:to-neutral-900 border-primary-100 dark:border-primary-800/30",
    },
    {
      icon: Shield,
      title: t("profile.statistics.accountStatus"),
      value: t("profile.statistics.active"),
      iconElement: (
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
      ),
      iconColor: "text-green-500 dark:text-green-400",
      bgClasses:
        "from-green-50 to-white dark:from-green-900/20 dark:to-neutral-900 border-green-100 dark:border-green-800/30",
    },
  ];

  return (
    <div className={className}>
      <header className="mb-6 border-b border-gray-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("profile.statistics.title")}
          </h2>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          {statisticsItems.map((item, index) => (
            <div
              key={index}
              className={`group p-4 rounded-2xl border transition-all duration-300 ${item.bgClasses.replace("from-blue-50 to-white", "bg-white/40 dark:bg-neutral-800/40").replace("from-primary-50 to-white", "bg-white/40 dark:bg-neutral-800/40").replace("from-green-50 to-white", "bg-white/40 dark:bg-neutral-800/40")}`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-gray-100 dark:border-neutral-700">
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {item.title}
                  </p>
                  <div className="flex items-center">
                    {item.iconElement}
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl border border-primary-200 dark:border-primary-800/30 bg-primary-50/30 dark:bg-primary-900/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <MailWarning className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="font-bold text-gray-800 dark:text-gray-200">
                {t("profile.statistics.emailStatus")}
              </p>
            </div>

            {user?.email_verified_at ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                <CheckCircle className="w-4 h-4" />
                {t("profile.statistics.verified")}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50">
                <MailWarning className="w-4 h-4" />
                {t("profile.statistics.unverified")}
              </div>
            )}
          </div>

          {!user?.email_verified_at && (
            <div className="space-y-4">
              <p className="text-sm text-primary-700 dark:text-primary-400 font-medium leading-relaxed">
                {t("profile.information.emailUnverified")}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href={route("verification.send")}
                  method="post"
                  as="button"
                  onClick={() => setRecentlySent(true)}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-primary-500/20"
                >
                  <Send className="w-4 h-4" />
                  {t("profile.information.sendVerification")}
                </Link>

                {(status === "verification-link-sent" || recentlySent) && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800/30">
                    <CheckCircle className="w-4 h-4" />
                    {t("profile.information.verificationSent")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

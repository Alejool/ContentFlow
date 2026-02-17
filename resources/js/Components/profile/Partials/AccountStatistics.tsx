import { PageProps } from "@/../../app/Types/inertia";
import { Link, usePage } from "@inertiajs/react";
import {
  Calendar,
  CheckCircle,
  Clock,
  LucideIcon,
  MailWarning,
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
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Clock,
      title: t("profile.statistics.daysActive"),
      value: `${getDaysSinceJoining(user?.created_at || null)} ${t(
        "profile.statistics.days",
      )}`,
      iconColor: "text-primary-600 dark:text-primary-400",
    },
    {
      icon: Shield,
      title: t("profile.statistics.accountStatus"),
      value: t("profile.statistics.active"),
      iconElement: user?.email_verified_at ? (
        <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
      ) : null,
      iconColor: "text-green-600 dark:text-green-400",
    },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {statisticsItems.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-700">
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {item.title}
                </p>
                <div className="flex items-center gap-1">
                  {item.iconElement}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!user?.email_verified_at && (
        <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <MailWarning className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                {t("profile.information.emailUnverified")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={route("verification.send")}
                  method="post"
                  as="button"
                  onClick={() => setRecentlySent(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                >
                  {t("profile.information.sendVerification")}
                </Link>
                {(status === "verification-link-sent" || recentlySent) && (
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    {t("profile.information.verificationSent")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

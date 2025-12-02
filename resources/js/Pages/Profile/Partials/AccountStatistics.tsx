import React, { useState } from "react";
import { usePage, Link } from "@inertiajs/react";
import ModernCard from "@/Components/Modern/ModernCard";
import { useTranslation } from "react-i18next";

const ChartIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

export default function AccountStatistics({ className = "", status = null }) {
  const { t, i18n } = useTranslation();
  const user = usePage().props.auth.user;
  const [recentlySent, setRecentlySent] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate days since joining
  const getDaysSinceJoining = (dateString) => {
    if (!dateString) return 0;
    const joined = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - joined);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ModernCard
      title={t("profile.statistics.title")}
      description={t("profile.statistics.description")}
      icon={ChartIcon}
      headerColor="green"
      className={className}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            {t("profile.statistics.memberSince")}
          </p>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {formatDate(user.created_at)}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            {t("profile.statistics.daysActive")}
          </p>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {getDaysSinceJoining(user.created_at)}{" "}
            {t("profile.statistics.days")}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            {t("profile.statistics.accountStatus")}
          </p>
          <div className="flex items-center mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            <p className="text-lg font-bold text-gray-800">
              {t("profile.statistics.active")}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">
            {t("profile.statistics.emailStatus")}
          </p>
          <div className="mt-1">
            {user.email_verified_at ? (
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-lg font-bold text-gray-800">
                  {t("profile.statistics.verified")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-yellow-500 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-lg font-bold text-gray-800">
                    {t("profile.statistics.unverified")}
                  </p>
                </div>
                <Link
                  href={route("verification.send")}
                  method="post"
                  as="button"
                  onClick={() => setRecentlySent(true)}
                  className="w-full px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-medium rounded-md transition-colors shadow-sm"
                >
                  {t("profile.information.sendVerification")}
                </Link>
                {(status === "verification-link-sent" || recentlySent) && (
                  <div className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {t("profile.information.verificationSent")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModernCard>
  );
}

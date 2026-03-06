import { BadgeCheck, Headphones, MessageSquare, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EnterpriseSupportTab() {
  const { t } = useTranslation();

  const features = [
    {
      title:
        t("workspace.enterprise.dedicated_support.title") ||
        "Dedicated Support Manager",
      description:
        t("workspace.enterprise.dedicated_support.description") ||
        "As an Enterprise customer, you have a dedicated account manager available via WhatsApp or email for priority assistance.",
      icon: Headphones,
      action:
        t("workspace.enterprise.dedicated_support.action") || "Contact Manager",
      color: "blue",
    },
    {
      title:
        t("workspace.enterprise.sla.title") || "Service Level Agreement (SLA)",
      description:
        t("workspace.enterprise.sla.description") ||
        "Your workspace is covered by our 99.9% uptime guarantee. We provide monthly availability reports upon request.",
      icon: BadgeCheck,
      action: t("workspace.enterprise.sla.action") || "View SLA Terms",
      color: "green",
    },
    {
      title:
        t("workspace.enterprise.integrations.title") || "Custom Integrations",
      description:
        t("workspace.enterprise.integrations.description") ||
        "Need to connect ContentFlow with your own CRM or ERP? Our team can build custom integrations tailored to your workflow.",
      icon: Zap,
      action:
        t("workspace.enterprise.integrations.action") || "Request Integration",
      color: "amber",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-neutral-800 shadow sm:rounded-lg border border-neutral-200 dark:border-neutral-700 flex flex-col"
          >
            <div className="px-4 py-5 sm:p-6 flex-1">
              <div
                className={`p-2 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 rounded-lg w-fit mb-4`}
              >
                <feature.icon
                  className={`h-6 w-6 text-${feature.color}-600 dark:text-${feature.color}-400`}
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
                {feature.description}
              </p>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-900/50 px-4 py-4 sm:px-6 border-t border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                className={`text-sm font-semibold text-${feature.color}-600 dark:text-${feature.color}-400 hover:text-${feature.color}-700 dark:hover:text-${feature.color}-300 flex items-center gap-2`}
              >
                <MessageSquare className="h-4 w-4" />
                {feature.action}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-800 shadow sm:rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t("workspace.enterprise.info_title") ||
              "Enterprise Workspace Status"}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 dark:border-neutral-700">
              <span className="text-gray-500 dark:text-neutral-400">
                {t("workspace.enterprise.priority_queues") ||
                  "Priority Publishing Queues"}
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {t("common.active") || "Active"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-neutral-100 dark:border-neutral-700">
              <span className="text-gray-500 dark:text-neutral-400">
                {t("workspace.enterprise.custom_onboarding") ||
                  "Custom Onboarding Session"}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {t("common.completed") || "Completed"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-gray-500 dark:text-neutral-400">
                {t("workspace.enterprise.legal_review") ||
                  "Data Processing Agreement (DPA)"}
              </span>
              <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                {t("common.available") || "Available for download"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

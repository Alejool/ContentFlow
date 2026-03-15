import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  Package,
  Home,
  HardDrive,
  Sparkles,
  FileText,
  Users,
} from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import AddonsSummary from "@/Components/Addons/AddonsSummary";

interface AddonPurchaseData {
  addon_sku: string;
  addon_name: string;
  addon_type: string;
  amount: number;
  price: number | string;
  session_id: string;
  purchase_date: string;
}

interface Props {
  purchase: AddonPurchaseData;
}

export default function AddonPurchaseSuccess({ purchase }: Props) {
  const { t } = useTranslation();

  const getAddonIcon = (type: string) => {
    switch (type) {
      case "storage":
        return HardDrive;
      case "ai_credits":
        return Sparkles;
      case "publications":
        return FileText;
      case "team_members":
        return Users;
      default:
        return Package;
    }
  };

  const formatAmount = (type: string, amount: number) => {
    switch (type) {
      case "storage":
        return `${amount} GB`;
      case "ai_credits":
        return `${amount.toLocaleString()} ${t("payment.addonPurchaseSuccess.addonTypes.ai_credits")}`;
      case "publications":
        return `${amount.toLocaleString()} ${t("payment.addonPurchaseSuccess.addonTypes.publications")}`;
      case "team_members":
        return `${amount} ${t("payment.addonPurchaseSuccess.addonTypes.team_members")}`;
      default:
        return amount.toString();
    }
  };

  const getAddonTypeName = (type: string) => {
    return (
      t(`payment.addonPurchaseSuccess.addonTypes.${type}`) ||
      purchase.addon_name
    );
  };

  return (
    <AuthenticatedLayout>
      <Head title={t("payment.addonPurchaseSuccess.title")} />

      <div className="py-12 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("payment.addonPurchaseSuccess.title")}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t("payment.addonPurchaseSuccess.subtitle")}
            </p>
          </div>

          {/* Purchase Details Card */}
          <Card className="mb-8 shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-green-800 dark:text-green-200">
                <Package className="w-6 h-6" />
                {t("payment.addonPurchaseSuccess.details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Addon Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      {(() => {
                        const IconComponent = getAddonIcon(purchase.addon_type);
                        return (
                          <IconComponent className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        );
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {getAddonTypeName(purchase.addon_type)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatAmount(purchase.addon_type, purchase.amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Purchase Info */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("payment.addonPurchaseSuccess.amount")}:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(purchase.addon_type, purchase.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("payment.addonPurchaseSuccess.price")}:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      $
                      {typeof purchase.price === "number"
                        ? purchase.price.toFixed(2)
                        : parseFloat(purchase.price || "0").toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("payment.addonPurchaseSuccess.date")}:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("payment.addonPurchaseSuccess.sessionId")}:
                    </span>
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {purchase.session_id.substring(0, 20)}...
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addon Usage Summary */}
          <Card className="mb-8 shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                {t(
                  "payment.addonPurchaseSuccess.addonUsage",
                  "Estado de tus Addons",
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddonsSummary />
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8 shadow-lg border-0 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                {t("payment.addonPurchaseSuccess.nextSteps")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center border-2 border-primary-200 dark:border-primary-800">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      1
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 pt-1">
                    {t("payment.addonPurchaseSuccess.step1")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center border-2 border-primary-200 dark:border-primary-800">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      2
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 pt-1">
                    {t("payment.addonPurchaseSuccess.step2")}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center border-2 border-primary-200 dark:border-primary-800">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      3
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 pt-1">
                    {t("payment.addonPurchaseSuccess.step3")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/subscription/addons">
              <Button
                variant="primary"
                size="lg"
                icon={Package}
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
              >
                {t("payment.addonPurchaseSuccess.viewAddons")}
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                buttonStyle="outline"
                size="lg"
                icon={Home}
                className="w-full sm:w-auto border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t("payment.addonPurchaseSuccess.backToDashboard")}
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="text-center">
            <div className="">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("payment.addonPurchaseSuccess.support")}{" "}
                <a
                  href="mailto:support@contentflow.com"
                  className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  support@contentflow.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

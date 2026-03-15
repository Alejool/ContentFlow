import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Package, Home, HardDrive, Sparkles, FileText, Users } from 'lucide-react';
import Button from '@/Components/common/Modern/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AddonsSummary from '@/Components/Addons/AddonsSummary';

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
      case 'storage':
        return HardDrive;
      case 'ai_credits':
        return Sparkles;
      case 'publications':
        return FileText;
      case 'team_members':
        return Users;
      default:
        return Package;
    }
  };

  const formatAmount = (type: string, amount: number) => {
    switch (type) {
      case 'storage':
        return `${amount} GB`;
      case 'ai_credits':
        return `${amount.toLocaleString()} ${t('payment.addonPurchaseSuccess.addonTypes.ai_credits')}`;
      case 'publications':
        return `${amount.toLocaleString()} ${t('payment.addonPurchaseSuccess.addonTypes.publications')}`;
      case 'team_members':
        return `${amount} ${t('payment.addonPurchaseSuccess.addonTypes.team_members')}`;
      default:
        return amount.toString();
    }
  };

  const getAddonTypeName = (type: string) => {
    return t(`payment.addonPurchaseSuccess.addonTypes.${type}`) || purchase.addon_name;
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('payment.addonPurchaseSuccess.title')} />

      <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 shadow-lg dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {t('payment.addonPurchaseSuccess.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t('payment.addonPurchaseSuccess.subtitle')}
            </p>
          </div>

          {/* Purchase Details Card */}
          <Card className="mb-8 border-0 bg-white shadow-lg dark:bg-gray-800">
            <CardHeader className="rounded-t-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardTitle className="flex items-center gap-3 text-green-800 dark:text-green-200">
                <Package className="h-6 w-6" />
                {t('payment.addonPurchaseSuccess.details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Addon Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      {(() => {
                        const IconComponent = getAddonIcon(purchase.addon_type);
                        return (
                          <IconComponent className="h-6 w-6 text-primary-600 dark:text-primary-400" />
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
                      {t('payment.addonPurchaseSuccess.amount')}:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatAmount(purchase.addon_type, purchase.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('payment.addonPurchaseSuccess.price')}:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      $
                      {typeof purchase.price === 'number'
                        ? purchase.price.toFixed(2)
                        : parseFloat(purchase.price || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('payment.addonPurchaseSuccess.date')}:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('payment.addonPurchaseSuccess.sessionId')}:
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {purchase.session_id.substring(0, 20)}...
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addon Usage Summary */}
          <Card className="mb-8 border-0 bg-white shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                {t('payment.addonPurchaseSuccess.addonUsage', 'Estado de tus Addons')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddonsSummary />
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8 border-0 bg-white shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                {t('payment.addonPurchaseSuccess.nextSteps')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary-200 bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      1
                    </span>
                  </div>
                  <p className="pt-1 text-gray-700 dark:text-gray-300">
                    {t('payment.addonPurchaseSuccess.step1')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary-200 bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      2
                    </span>
                  </div>
                  <p className="pt-1 text-gray-700 dark:text-gray-300">
                    {t('payment.addonPurchaseSuccess.step2')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary-200 bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      3
                    </span>
                  </div>
                  <p className="pt-1 text-gray-700 dark:text-gray-300">
                    {t('payment.addonPurchaseSuccess.step3')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/subscription/addons">
              <Button
                variant="primary"
                size="lg"
                icon={Package}
                className="w-full shadow-lg transition-shadow hover:shadow-xl sm:w-auto"
              >
                {t('payment.addonPurchaseSuccess.viewAddons')}
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                buttonStyle="outline"
                size="lg"
                icon={Home}
                className="w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 sm:w-auto"
              >
                {t('payment.addonPurchaseSuccess.backToDashboard')}
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="text-center">
            <div className="">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('payment.addonPurchaseSuccess.support')}{' '}
                <a
                  href="mailto:support@contentflow.com"
                  className="font-medium text-primary-600 hover:underline dark:text-primary-400"
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

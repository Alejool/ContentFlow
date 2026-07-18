import AddonsSummary from '@/Components/Addons/AddonsSummary';
import Button from '@/Components/common/Modern/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate } from '@/Utils/formatters/date';
import { formatCurrency } from '@/Utils/formatters/number';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle, FileText, HardDrive, Home, Package, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

      <div className="min-h-screen bg-gray-50 py-12 dark:bg-neutral-900">
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 shadow-lg dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {t('payment.addonPurchaseSuccess.title')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-neutral-400">
              {t('payment.addonPurchaseSuccess.subtitle')}
            </p>
          </div>

          {/* Purchase Details Card */}
          <Card className="mb-8 border-0 bg-white shadow-lg dark:bg-neutral-800">
            <CardHeader className="rounded-t-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardTitle className="flex items-center gap-3 text-green-800 dark:text-green-200">
                <Package className="h-6 w-6" />
                {t('payment.addonPurchaseSuccess.details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
                {/* Addon Info (takes 2 columns on md) */}
                <div className="flex flex-col justify-center md:col-span-2">
                  <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-6 text-center shadow-sm dark:border-neutral-700 dark:from-neutral-800/50 dark:to-neutral-800">
                    <div className="bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400 flex h-16 w-16 items-center justify-center rounded-lg shadow-inner">
                      {(() => {
                        const IconComponent = getAddonIcon(purchase.addon_type);
                        return <IconComponent className="h-8 w-8" strokeWidth={1.5} />;
                      })()}
                    </div>
                    <div>
                      <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
                        {getAddonTypeName(purchase.addon_type)}
                      </h3>
                      <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium">
                        {formatAmount(purchase.addon_type, purchase.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase Info (takes 3 columns on md) */}
                <div className="md:col-span-3">
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/50">
                    <h4 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-neutral-400">
                      {t('payment.addonPurchaseSuccess.details')}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-neutral-700/50">
                        <span className="text-sm text-gray-600 dark:text-neutral-400">
                          {t('payment.addonPurchaseSuccess.amount')}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatAmount(purchase.addon_type, purchase.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-neutral-700/50">
                        <span className="text-sm text-gray-600 dark:text-neutral-400">
                          {t('payment.addonPurchaseSuccess.price')}
                        </span>
                        <span className="text-base font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(Number(purchase.price) || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-neutral-400">
                          {t('payment.addonPurchaseSuccess.date')}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(purchase.purchase_date, 'medium')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addon Usage Summary */}
          <Card className="mb-8 border-0 bg-white shadow-lg dark:bg-neutral-800">
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
          <Card className="mb-8 border-0 bg-white shadow-lg dark:bg-neutral-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                {t('payment.addonPurchaseSuccess.nextSteps')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="border-primary-200 bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2">
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">
                      1
                    </span>
                  </div>
                  <p className="pt-1 text-gray-700 dark:text-neutral-300">
                    {t('payment.addonPurchaseSuccess.step1')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="border-primary-200 bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2">
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">
                      2
                    </span>
                  </div>
                  <p className="pt-1 text-gray-700 dark:text-neutral-300">
                    {t('payment.addonPurchaseSuccess.step2')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="border-primary-200 bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2">
                    <span className="text-primary-600 dark:text-primary-400 text-sm font-bold">
                      3
                    </span>
                  </div>
                  <p className="pt-1 text-gray-700 dark:text-neutral-300">
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
                className="w-full border-gray-300 hover:bg-gray-50 sm:w-auto dark:border-neutral-600 dark:hover:bg-gray-700"
              >
                {t('payment.addonPurchaseSuccess.backToDashboard')}
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="text-center">
            <div className="">
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {t('payment.addonPurchaseSuccess.support')}{' '}
                <a
                  href="mailto:support@Intellipost.com"
                  className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  support@Intellipost.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

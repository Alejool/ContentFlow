import Button from '@/Components/common/Modern/Button';
import { Card, CardContent } from '@/Components/ui/card';
import { Link } from '@inertiajs/react';
import { ArrowRight, Bell, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminQuickActions() {
  const { t } = useTranslation();

  const quickActions = [
    {
      title: t('admin.navigation.system_settings'),
      description: t('admin.system_settings.page_description'),
      icon: Settings,
      href: '/admin/system-settings',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: t('admin.navigation.system_notifications'),
      description: t('admin.system_notifications.page_subtitle'),
      icon: Bell,
      href: '/admin/system-notifications',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {t('admin.dashboard.quick_actions')}
      </h3>
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Card
            key={action.title}
            className="group border-gray-200 bg-white transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-xl p-3 ${action.iconBg} transition-transform group-hover:scale-110`}
                  >
                    <Icon className={`h-6 w-6 ${action.iconColor}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                  </div>
                </div>
                <Link href={action.href}>
                  <Button
                    className="transition-transform group-hover:translate-x-1"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    {t('admin.dashboard.access')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

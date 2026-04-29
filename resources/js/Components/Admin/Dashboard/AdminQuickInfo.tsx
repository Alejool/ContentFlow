import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminQuickInfo() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          {t('admin.dashboard.quick_info')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {t('admin.dashboard.info.exclusive_access')}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {t('admin.dashboard.info.exclusive_description')}
          </p>
        </div>
        <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {t('admin.dashboard.info.realtime_changes')}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {t('admin.dashboard.info.realtime_description')}
          </p>
        </div>
        <div className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {t('admin.dashboard.info.full_audit')}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {t('admin.dashboard.info.audit_description')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

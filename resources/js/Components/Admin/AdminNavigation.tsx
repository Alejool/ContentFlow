import SettingsTabs from '@/Components/Workspace/SettingsTabs';
import { router } from '@inertiajs/react';
import { Bell, CreditCard, LayoutDashboard, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminNavigationProps {
  currentRoute?: string;
}

export default function AdminNavigation({ currentRoute }: AdminNavigationProps) {
  const { t } = useTranslation();

  const navItems = [
    {
      id: 'dashboard',
      label: t('admin.navigation.dashboard'),
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'system-settings',
      label: t('admin.navigation.system_settings'),
      href: '/admin/system-settings',
      icon: Settings,
    },
    {
      id: 'system-notifications',
      label: t('admin.navigation.system_notifications'),
      href: '/admin/system-notifications',
      icon: Bell,
    },
    {
      id: 'subscription-control',
      label: 'Control de Suscripciones',
      href: '/admin/subscription-control',
      icon: CreditCard,
    },
  ];

  const activeTab = navItems.find((item) => item.href === currentRoute)?.id || 'dashboard';

  const handleTabChange = (tabId: string) => {
    const item = navItems.find((nav) => nav.id === tabId);
    if (item) {
      router.visit(item.href);
    }
  };

  return (
    <div className="bg-white shadow-sm dark:bg-gray-800">
      <div className="">
        <SettingsTabs
          tabs={navItems.map((item) => ({
            id: item.id,
            label: item.label,
            icon: item.icon,
            enabled: true,
          }))}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isDraggable={false}
        />
      </div>
    </div>
  );
}

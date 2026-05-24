import type { Tab as TabNavigationType } from '@/Components/common/TabNavigation';
import { TabNavigation } from '@/Components/common/TabNavigation';

import type { SettingsTab } from '@/types/settings.types';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  planRequired?: string[];
  locked?: boolean;
  enabled?: boolean;
  badge?: string | number;
}

interface SettingsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: SettingsTab) => void;
  onTabOrderChange?: (newOrder: string[]) => void;
  tabOrder?: string[];
  isDraggable?: boolean;
  currentPlan?: string;
}

export default function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
  onTabOrderChange,
  tabOrder,
  isDraggable = false,
  currentPlan = 'demo',
}: SettingsTabsProps) {
  const navigationTabs: TabNavigationType[] = tabs.map((tab) => {
    const navTab: TabNavigationType = {
      key: tab.id,
      label: tab.label,
      icon: tab.icon,
    };

    if (tab.enabled !== undefined) navTab.enabled = tab.enabled;
    if (tab.planRequired !== undefined) navTab.planRequired = tab.planRequired;
    if (tab.locked !== undefined) navTab.locked = tab.locked;
    if (tab.badge !== undefined) navTab.badge = tab.badge;

    return navTab;
  });

  return (
    <div className="mb-8">
      <TabNavigation
        tabs={navigationTabs}
        activeTab={activeTab}
        onTabChange={(key) => onTabChange(key as SettingsTab)}
        {...(onTabOrderChange && { onTabOrderChange })}
        {...(tabOrder && { tabOrder })}
        isDraggable={isDraggable}
        currentPlan={currentPlan}
        variant="draggable"
      />
    </div>
  );
}

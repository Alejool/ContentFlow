import {
  TabNavigation,
  Tab as TabNavigationType,
} from "@/Components/common/TabNavigation";

interface Tab {
  id: string;
  label: string;
  icon: any;
  planRequired?: string[];
  locked?: boolean;
  enabled?: boolean;
  badge?: string | number;
}

interface SettingsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
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
  currentPlan = "demo",
}: SettingsTabsProps) {
  // Convertir tabs al formato esperado por TabNavigation
  const navigationTabs: TabNavigationType[] = tabs.map((tab) => ({
    key: tab.id,
    label: tab.label,
    icon: tab.icon,
    enabled: tab.enabled,
    planRequired: tab.planRequired,
    locked: tab.locked,
    badge: tab.badge,
  }));

  return (
    <div className="mb-8">
      <TabNavigation
        tabs={navigationTabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTabOrderChange={onTabOrderChange}
        tabOrder={tabOrder}
        isDraggable={isDraggable}
        currentPlan={currentPlan}
        variant="draggable"
      />
    </div>
  );
}

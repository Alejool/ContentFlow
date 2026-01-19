interface Tab {
  id: string;
  label: string;
  icon: any;
}

interface SettingsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  const TabButton = ({ id, label, icon: Icon }: Tab) => (
    <button
      onClick={() => onTabChange(id)}
      className={`flex items-center gap-3 px-5 py-3.5 rounded-lg transition-all duration-300 ${
        activeTab === id
          ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/25"
          : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${
          activeTab === id
            ? "text-white"
            : "text-gray-500 dark:text-neutral-400"
        }`}
      />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <TabButton key={tab.id} {...tab} active={activeTab} />
        ))}
      </div>
    </div>
  );
}

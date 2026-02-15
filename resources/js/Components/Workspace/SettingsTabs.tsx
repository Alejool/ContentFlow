import Button from "@/Components/common/Modern/Button";

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
  return (
    <div className="mb-8">
      <div className="inline-flex items-center p-2 rounded-lg bg-white dark:bg-neutral-800 backdrop-blur-sm gap-1 overflow-x-auto max-w-full shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <div key={tab.id} className="flex items-center gap-1 group/tab">
              <Button
                onClick={() => onTabChange(tab.id)}
                variant={isActive ? "primary" : "ghost"}
                buttonStyle={isActive ? "solid" : "ghost"}
                size="lg"
                className={`flex items-center justify-center p-0 rounded-lg text-sm font-bold transition-all duration-200 select-none border-0 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20 ring-1 ring-primary-500/50"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "opacity-70"
                    }`}
                  />
                  <span>{tab.label}</span>
                </div>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

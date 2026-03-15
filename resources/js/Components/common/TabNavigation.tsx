import DraggableTabs, { DraggableTab } from "@/Components/common/DraggableTabs";
import Button from "@/Components/common/Modern/Button";
import { LucideIcon } from "lucide-react";

export interface Tab {
  id?: string;
  key?: string;
  label: string;
  icon?: LucideIcon;
  enabled?: boolean;
  hidden?: boolean;
  badge?: string | number;
  locked?: boolean;
  planRequired?: string[];
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: "default" | "pills" | "underline" | "draggable" | "horizontal";
  size?: "sm" | "md" | "lg";
  className?: string;
  onTabOrderChange?: (newOrder: string[]) => void;
  tabOrder?: string[];
  isDraggable?: boolean;
  currentPlan?: string;
}

function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = "underline",
  size = "md",
  className = "",
  onTabOrderChange,
  tabOrder,
  isDraggable = false,
  currentPlan = "demo",
}: TabNavigationProps) {
  // Normalizar tabs para soportar tanto 'id' como 'key', y 'hidden' como 'enabled'
  const normalizedTabs = tabs.map((tab) => ({
    ...tab,
    key: tab.key || tab.id || "",
    enabled: tab.enabled !== false,
  }));

  // Filtrar tabs ocultos y deshabilitados
  const visibleTabs = normalizedTabs.filter((tab) => tab.enabled !== false && tab.hidden !== true);

  // Si es draggable o variant es 'draggable', usar DraggableTabs
  if (isDraggable || variant === "draggable") {
    const draggableTabs: DraggableTab[] = visibleTabs.map((tab) => ({
      id: tab.key,
      label: tab.label,
      icon: tab.icon,
      badge: tab.badge,
      enabled: tab.enabled,
      locked: tab.locked,
      planRequired: tab.planRequired,
    }));

    return (
      <DraggableTabs
        tabs={draggableTabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTabOrderChange={onTabOrderChange}
        tabOrder={tabOrder}
        isDraggable={true}
        currentPlan={currentPlan}
        className={className}
      />
    );
  }

  // Modo estático tradicional - usar visibleTabs en lugar de enabledTabs

  // Variante horizontal (styled like ContentPage)
  if (variant === "horizontal") {
    return (
      <div className={`mb-8 overflow-x-auto ${className}`}>
        <div className="inline-flex min-w-max items-center gap-1 rounded-lg border border-gray-200/60 bg-white p-1.5 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-800">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20 ring-1 ring-primary-500/50"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-neutral-700/50 dark:hover:text-gray-200"
                }`}
              >
                {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-white" : "opacity-70"}`} />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const getVariantClasses = (isActive: boolean) => {
    switch (variant) {
      case "pills":
        return isActive
          ? "bg-primary-500 text-white"
          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700";
      case "underline":
        return `border-b-2 rounded-none ${
          isActive
            ? "border-primary-500 text-primary-600 dark:text-primary-400"
            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`;
      default:
        return isActive
          ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-primary-500"
          : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800";
    }
  };

  const containerClasses = {
    default: "flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg",
    pills: "flex gap-2 flex-wrap",
    underline: "flex -mb-px border-b border-gray-200 dark:border-gray-700",
  };

  return (
    <nav className={`${containerClasses[variant]} ${className}`}>
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <Button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            variant={isActive ? "primary" : "ghost"}
            size={size}
            className={`${getVariantClasses(isActive)} ${variant === "underline" ? "flex-1" : ""}`}
            icon={Icon}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </Button>
        );
      })}
    </nav>
  );
}

export { TabNavigation };
export default TabNavigation;

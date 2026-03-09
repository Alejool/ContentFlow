import { LucideIcon } from 'lucide-react';
import DraggableTabs, { DraggableTab } from '@/Components/common/DraggableTabs';
import Button from '@/Components/common/Modern/Button';

export interface Tab {
    key: string;
    label: string;
    icon?: LucideIcon;
    enabled?: boolean;
    badge?: string | number;
    locked?: boolean;
    planRequired?: string[];
}

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
    variant?: 'default' | 'pills' | 'underline' | 'draggable';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onTabOrderChange?: (newOrder: string[]) => void;
    isDraggable?: boolean;
    currentPlan?: string;
}

export function TabNavigation({
    tabs,
    activeTab,
    onTabChange,
    variant = 'underline',
    size = 'md',
    className = '',
    onTabOrderChange,
    isDraggable = false,
    currentPlan = 'demo',
}: TabNavigationProps) {
    // Si es draggable o variant es 'draggable', usar DraggableTabs
    if (isDraggable || variant === 'draggable') {
        const draggableTabs: DraggableTab[] = tabs.map(tab => ({
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
                isDraggable={true}
                currentPlan={currentPlan}
                className={className}
            />
        );
        
    }


    // Modo estático tradicional
    const enabledTabs = tabs.filter(tab => tab.enabled !== false);

    const getVariantClasses = (isActive: boolean) => {
        switch (variant) {
            case 'pills':
                return isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
            case 'underline':
                return `border-b-2 rounded-none ${
                    isActive
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`;
            default:
                return isActive
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-primary-500'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';
        }
    };

    const containerClasses = {
        default: 'flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg',
        pills: 'flex gap-2 flex-wrap',
        underline: 'flex -mb-px border-b border-gray-200 dark:border-gray-700',
    };

    return (
        <nav className={`${containerClasses[variant]} ${className}`}>
            {enabledTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                    <Button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        variant={isActive ? 'primary' : 'ghost'}
                        size={size}
                        className={`${getVariantClasses(isActive)} ${
                            variant === 'underline' ? 'flex-1' : ''
                        }`}
                        icon={Icon}
                    >
                        <span className="flex items-center gap-2">
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>
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

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, LucideIcon } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
} from 'react-aria-components';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  locked?: boolean;
  content?: ReactNode;
}

interface SortableTabItemProps {
  tab: TabItem;
  isActive: boolean;
  isDraggable: boolean;
  variant: 'default' | 'pills' | 'underline' | 'boxed';
  size: 'sm' | 'md' | 'lg';
  iconSizes: Record<string, string>;
  sizeClasses: Record<string, string>;
}

const SortableTabItem = ({
  tab,
  isActive,
  isDraggable,
  variant,
  size,
  iconSizes,
  sizeClasses,
}: SortableTabItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
    disabled: Boolean(!isDraggable || tab.locked || tab.disabled),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = tab.icon;
  const hasBadge = tab.badge !== undefined && tab.badge !== null;
  const badgeValue = typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge;

  return (
    <div ref={setNodeRef} style={style} className="group/tab flex items-center">
      <AriaTab
        id={tab.id}
        isDisabled={tab.disabled}
        {...(isDraggable && !tab.locked && !tab.disabled ? attributes : {})}
        {...(isDraggable && !tab.locked && !tab.disabled ? listeners : {})}
        className={({
          isSelected,
          isHovered,
          isFocusVisible,
          isDisabled,
        }: {
          isSelected: boolean;
          isHovered: boolean;
          isFocusVisible: boolean;
          isDisabled: boolean;
        }) => {
          const baseClasses = `flex select-none items-center justify-center gap-2 whitespace-nowrap font-bold transition-all duration-200 ${sizeClasses[size]} ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isFocusVisible ? 'outline-none ring-2 ring-primary-500 ring-offset-2' : ''} `;

          if (variant === 'boxed') {
            return `${baseClasses} rounded-lg ${
              isSelected
                ? 'bg-primary-600 text-white shadow-md ring-1 ring-primary-500/50'
                : isHovered && !isDisabled
                  ? 'bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
            }`;
          }

          return baseClasses;
        }}
      >
        {({ isSelected }: { isSelected: boolean }) => (
          <>
            {isDraggable && !tab.locked && (
              <GripHorizontal
                className={`h-3 w-3 cursor-grab opacity-0 transition-opacity active:cursor-grabbing group-hover/tab:opacity-60 ${
                  isSelected ? 'text-white' : 'text-gray-400'
                }`}
              />
            )}
            {Icon && (
              <Icon className={`${iconSizes[size]} ${isSelected ? 'text-white' : 'opacity-70'}`} />
            )}
            <span>{tab.label}</span>
            {hasBadge && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {badgeValue}
              </span>
            )}
          </>
        )}
      </AriaTab>
    </div>
  );
};

interface TabsProps {
  tabs: TabItem[];
  defaultSelectedKey?: string;
  selectedKey?: string;
  onSelectionChange?: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'boxed';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  disabledKeys?: string[];
  isDraggable?: boolean;
  onTabOrderChange?: (newOrder: string[]) => void;
  tabOrder?: string[];
}

export default function Tabs({
  tabs: initialTabs,
  defaultSelectedKey,
  selectedKey,
  onSelectionChange,
  variant = 'underline',
  size = 'md',
  orientation = 'horizontal',
  className = '',
  disabledKeys = [],
  isDraggable = false,
  onTabOrderChange,
  tabOrder,
}: TabsProps) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-5 py-3',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const getOrderedTabs = useMemo(() => {
    return (tabs: TabItem[], order?: string[]) => {
      if (!order || order.length === 0) return tabs;
      const tabMap = new Map(tabs.map((tab) => [tab.id, tab]));
      const ordered = order
        .map((id) => tabMap.get(id))
        .filter((tab): tab is TabItem => tab !== undefined);
      const remainingTabs = tabs.filter((tab) => !order.includes(tab.id));
      return [...ordered, ...remainingTabs];
    };
  }, []);

  const [orderedTabs, setOrderedTabs] = useState<TabItem[]>(() =>
    getOrderedTabs(initialTabs, tabOrder),
  );

  useEffect(() => {
    const newOrderedTabs = getOrderedTabs(initialTabs, tabOrder);
    const currentIds = orderedTabs.map((t) => t.id).join(',');
    const newIds = newOrderedTabs.map((t) => t.id).join(',');
    if (currentIds !== newIds) {
      setOrderedTabs(newOrderedTabs);
    }
  }, [tabOrder, initialTabs, getOrderedTabs, orderedTabs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedTabs.findIndex((tab) => tab.id === active.id);
    const newIndex = orderedTabs.findIndex((tab) => tab.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrderedTabs = arrayMove(orderedTabs, oldIndex, newIndex);
      setOrderedTabs(newOrderedTabs);
      if (onTabOrderChange) {
        onTabOrderChange(newOrderedTabs.map((tab) => tab.id));
      }
    }
  };

  const tabsToRender = isDraggable ? orderedTabs : initialTabs;

  const TabListContent = () => (
    <AriaTabList
      aria-label="Tabs"
      className={`flex ${
        orientation === 'vertical'
          ? 'flex-col gap-1'
          : variant === 'underline'
            ? 'gap-0 border-b border-gray-200 dark:border-neutral-700'
            : 'gap-2'
      } ${variant === 'boxed' ? 'min-w-max items-center gap-1 rounded-lg border border-gray-200/60 bg-white p-1.5 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-800' : ''}`}
    >
      {tabsToRender.map((tab) => {
        if (isDraggable && variant === 'boxed') {
          return (
            <SortableTabItem
              key={tab.id}
              tab={tab}
              isActive={selectedKey === tab.id}
              isDraggable={isDraggable}
              variant={variant}
              size={size}
              iconSizes={iconSizes}
              sizeClasses={sizeClasses}
            />
          );
        }

        const Icon = tab.icon;
        const isDisabled = disabledKeys.includes(tab.id) || tab.disabled;

        return (
          <AriaTab
            key={tab.id}
            id={tab.id}
            isDisabled={isDisabled}
            className={({
              isSelected,
              isHovered,
              isFocusVisible,
              isDisabled: disabled,
            }: {
              isSelected: boolean;
              isHovered: boolean;
              isFocusVisible: boolean;
              isDisabled: boolean;
            }) => {
              const baseClasses = `flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all duration-200 ${sizeClasses[size]} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isFocusVisible ? 'outline-none ring-2 ring-primary-500 ring-offset-2' : ''} `;

              if (variant === 'pills') {
                return `${baseClasses} rounded-lg ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-md'
                    : isHovered && !disabled
                      ? 'bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                }`;
              }

              if (variant === 'underline') {
                return `${baseClasses} rounded-none border-b-2 ${
                  isSelected
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : isHovered && !disabled
                      ? 'border-gray-300 text-gray-900 dark:border-neutral-600 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400'
                }`;
              }

              if (variant === 'boxed') {
                return `${baseClasses} rounded-lg ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-md ring-1 ring-primary-500/50'
                    : isHovered && !disabled
                      ? 'bg-gray-100 text-gray-900 dark:bg-neutral-700 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                }`;
              }

              return `${baseClasses} rounded-lg border ${
                isSelected
                  ? 'border-primary-500 bg-white text-primary-600 shadow-sm dark:bg-neutral-800 dark:text-primary-400'
                  : isHovered && !disabled
                    ? 'border-gray-300 bg-gray-50 text-gray-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-400'
              }`;
            }}
          >
            {({ isSelected }: { isSelected: boolean }) => (
              <>
                {Icon && (
                  <Icon
                    className={`${iconSizes[size]} ${isSelected ? 'opacity-100' : 'opacity-70'}`}
                  />
                )}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-neutral-700 dark:text-gray-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </>
            )}
          </AriaTab>
        );
      })}
    </AriaTabList>
  );

  return (
    <AriaTabs
      className={className}
      defaultSelectedKey={defaultSelectedKey}
      selectedKey={selectedKey}
      onSelectionChange={(key: React.Key) => onSelectionChange?.(key as string)}
      orientation={orientation}
    >
      {isDraggable && variant === 'boxed' ? (
        <div className="mb-8 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tabsToRender.map((tab) => tab.id)}
              strategy={horizontalListSortingStrategy}
            >
              <TabListContent />
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <TabListContent />
      )}

      {tabsToRender.map((tab) => (
        <AriaTabPanel
          key={tab.id}
          id={tab.id}
          className="mt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {tab.content}
        </AriaTabPanel>
      ))}
    </AriaTabs>
  );
}

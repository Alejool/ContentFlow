import Button from "@/Components/common/Modern/Button";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export interface DraggableTab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number | string;
  enabled?: boolean;
  locked?: boolean; // No se puede reorganizar
  planRequired?: string[]; // Planes que requieren este tab
}

interface SortableTabProps {
  tab: DraggableTab;
  isActive: boolean;
  onTabChange: (id: string) => void;
  isDraggable: boolean;
}

const SortableTab = ({
  tab,
  isActive,
  onTabChange,
  isDraggable,
}: SortableTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: tab.id,
    disabled: !isDraggable || tab.locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = tab.icon;
  const hasBadge = tab.badge !== undefined && tab.badge !== null;
  const badgeValue = typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 group/tab"
    >
      <Button
        onClick={() => onTabChange(tab.id)}
        variant={isActive ? "primary" : "ghost"}
        buttonStyle={isActive ? "solid" : "ghost"}
        size="lg"
        {...(isDraggable && !tab.locked ? attributes : {})}
        {...(isDraggable && !tab.locked ? listeners : {})}
        className={`flex items-center justify-center p-0 rounded-lg text-sm font-bold transition-all duration-200 select-none border-0 ${
          isActive
            ? "bg-primary-600 text-white shadow-md shadow-primary-500/20 ring-1 ring-primary-500/50"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isDraggable && !tab.locked && (
            <GripHorizontal
              className={`w-3 h-3 opacity-0 group-hover/tab:opacity-40 transition-opacity cursor-grab active:cursor-grabbing mr-[-4px] ${
                isActive ? "text-white" : ""
              }`}
            />
          )}
          {Icon && (
            <Icon
              className={`w-4 h-4 ${isActive ? "text-white" : "opacity-70"}`}
            />
          )}
          <span>{tab.label}</span>
          {hasBadge && (
            <span
              className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {badgeValue}
            </span>
          )}
        </div>
      </Button>
    </div>
  );
};

interface DraggableTabsProps {
  tabs: DraggableTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabOrderChange?: (newOrder: string[]) => void;
  isDraggable?: boolean;
  currentPlan?: string;
  className?: string;
}

export default function DraggableTabs({
  tabs: initialTabs,
  activeTab,
  onTabChange,
  onTabOrderChange,
  isDraggable = false,
  currentPlan = "demo",
  className = "",
}: DraggableTabsProps) {
  // Estado interno para manejar el orden de los tabs
  const [orderedTabs, setOrderedTabs] = useState<DraggableTab[]>(initialTabs);

  // Actualizar cuando cambien los tabs externos
  useEffect(() => {
    setOrderedTabs(initialTabs);
  }, [initialTabs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar tabs según plan y enabled
  const visibleTabs = orderedTabs.filter((tab) => {
    // Si está deshabilitado, no mostrar
    if (tab.enabled === false) return false;

    // Si requiere un plan específico, verificar
    if (tab.planRequired && tab.planRequired.length > 0) {
      return tab.planRequired.includes(currentPlan);
    }

    return true;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = visibleTabs.findIndex((tab) => tab.id === active.id);
    const newIndex = visibleTabs.findIndex((tab) => tab.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrderedTabs = arrayMove(visibleTabs, oldIndex, newIndex);
      
      // Actualizar estado interno
      setOrderedTabs(newOrderedTabs);
      
      // Notificar al padre
      if (onTabOrderChange) {
        const newOrderIds = newOrderedTabs.map((tab) => tab.id);
        onTabOrderChange(newOrderIds);
      }
    }
  };

  if (!isDraggable) {
    // Modo estático (sin drag & drop)
    return (
      <div className={`inline-flex items-center p-2 rounded-lg bg-white dark:bg-neutral-800 backdrop-blur-sm gap-1 overflow-x-auto max-w-full shadow-sm ${className}`}>
        {visibleTabs.map((tab) => (
          <SortableTab
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onTabChange={onTabChange}
            isDraggable={false}
          />
        ))}
      </div>
    );
  }

  // Modo con drag & drop
  return (
    <div className={`inline-flex items-center p-2 rounded-lg bg-white dark:bg-neutral-800 backdrop-blur-sm gap-1 overflow-x-auto max-w-full shadow-sm ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleTabs.map((tab) => tab.id)}
          strategy={horizontalListSortingStrategy}
        >
          {visibleTabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onTabChange={onTabChange}
              isDraggable={true}
            />
          ))}
          
        </SortableContext>
      </DndContext>
    </div>
  );
}

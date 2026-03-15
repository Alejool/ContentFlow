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
import { useEffect, useMemo, useState } from "react";

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
  const badgeValue =
    typeof tab.badge === "number" && tab.badge > 99 ? "99+" : tab.badge;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center group/tab">
      <button
        onClick={() => onTabChange(tab.id)}
        {...(isDraggable && !tab.locked ? attributes : {})}
        {...(isDraggable && !tab.locked ? listeners : {})}
        className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap select-none ${
          isActive
            ? "bg-primary-600 text-white shadow-md shadow-primary-500/20 ring-1 ring-primary-500/50"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
        }`}
      >
        {isDraggable && !tab.locked && (
          <GripHorizontal
            className={`w-3 h-3 opacity-0 group-hover/tab:opacity-60 transition-opacity cursor-grab active:cursor-grabbing ${
              isActive ? "text-white" : "text-gray-400"
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
            className={`px-2 py-0.5 text-xs font-bold rounded-full ${
              isActive
                ? "bg-white/20 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {badgeValue}
          </span>
        )}
      </button>
    </div>
  );
};

interface DraggableTabsProps {
  tabs: DraggableTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabOrderChange?: (newOrder: string[]) => void;
  tabOrder?: string[]; // Orden externo de los tabs
  isDraggable?: boolean;
  currentPlan?: string;
  className?: string;
}

export default function DraggableTabs({
  tabs: initialTabs,
  activeTab,
  onTabChange,
  onTabOrderChange,
  tabOrder,
  isDraggable = false,
  currentPlan = "demo",
  className = "",
}: DraggableTabsProps) {
  // Si hay un tabOrder externo, usarlo para ordenar los tabs
  const getOrderedTabs = useMemo(() => {
    return (tabs: DraggableTab[], order?: string[]) => {
      if (!order || order.length === 0) return tabs;

      // Crear un mapa de tabs por id
      const tabMap = new Map(tabs.map((tab) => [tab.id, tab]));

      // Ordenar según el array de orden
      const ordered = order
        .map((id) => tabMap.get(id))
        .filter((tab): tab is DraggableTab => tab !== undefined);

      // Agregar tabs que no están en el orden al final
      const remainingTabs = tabs.filter((tab) => !order.includes(tab.id));

      return [...ordered, ...remainingTabs];
    };
  }, []);

  // Estado interno para manejar el orden de los tabs
  const [orderedTabs, setOrderedTabs] = useState<DraggableTab[]>(() =>
    getOrderedTabs(initialTabs, tabOrder),
  );

  // Actualizar cuando cambien los tabs externos o el orden
  useEffect(() => {
    const newOrderedTabs = getOrderedTabs(initialTabs, tabOrder);
    // Solo actualizar si realmente cambió el orden
    const currentIds = orderedTabs.map((t) => t.id).join(",");
    const newIds = newOrderedTabs.map((t) => t.id).join(",");

    if (currentIds !== newIds) {
      setOrderedTabs(newOrderedTabs);
    }
  }, [tabOrder, initialTabs, getOrderedTabs, orderedTabs]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      // Reordenar todos los tabs (no solo los visibles)
      const allTabsOldIndex = orderedTabs.findIndex(
        (tab) => tab.id === active.id,
      );
      const allTabsNewIndex = orderedTabs.findIndex(
        (tab) => tab.id === over.id,
      );

      const newOrderedTabs = arrayMove(
        orderedTabs,
        allTabsOldIndex,
        allTabsNewIndex,
      );

      // Actualizar estado interno
      setOrderedTabs(newOrderedTabs);

      // Notificar al padre con el nuevo orden
      if (onTabOrderChange) {
        const newOrderIds = newOrderedTabs.map((tab) => tab.id);
        onTabOrderChange(newOrderIds);
      }
    }
  };

  if (!isDraggable) {
    // Modo estático (sin drag & drop)
    return (
      <div className={`mb-8 overflow-x-auto ${className}`}>
        <div className="inline-flex items-center p-1.5 rounded-lg bg-white dark:bg-neutral-800 backdrop-blur-sm border border-gray-200/60 dark:border-neutral-700/60 gap-1 shadow-sm min-w-max">
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
      </div>
    );
  }

  // Modo con drag & drop
  return (
    <div className={`mb-8 overflow-x-auto ${className}`}>
      <div className="inline-flex items-center p-1.5 rounded-lg bg-white dark:bg-neutral-800 backdrop-blur-sm border border-gray-200/60 dark:border-neutral-700/60 gap-1 shadow-sm min-w-max">
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
    </div>
  );
}

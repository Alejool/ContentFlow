/**
 * DraggableTabs Component - Ejemplos de Uso
 *
 * Componente reutilizable para tabs con drag & drop, badges, y filtrado por plan.
 * Usado en: Settings, Content, y cualquier lugar que necesite tabs reorganizables.
 */

import { useState } from 'react';
import DraggableTabs, { DraggableTab } from './DraggableTabs';
import {
  Folder,
  Calendar,
  FileText,
  Target,
  CheckCircle,
  Sparkles,
  Settings,
  Users,
  Shield,
  Share2,
  Palette,
  Key,
} from 'lucide-react';

// ============================================
// EJEMPLO 1: Tabs de Content (con drag & drop y badges)
// ============================================
export function ContentTabsExample() {
  const [activeTab, setActiveTab] = useState('publications');
  const [tabOrder, setTabOrder] = useState<string[]>([]);

  const tabs: DraggableTab[] = [
    {
      id: 'publications',
      label: 'Publicaciones',
      icon: Folder,
      badge: 12, // Número de publicaciones
    },
    {
      id: 'calendar',
      label: 'Calendario',
      icon: Calendar,
    },
    {
      id: 'logs',
      label: 'Registros',
      icon: FileText,
      badge: 5, // Publicaciones fallidas
    },
    {
      id: 'campaigns',
      label: 'Campañas',
      icon: Target,
      badge: 3,
    },
    {
      id: 'approvals',
      label: 'Aprobaciones',
      icon: CheckCircle,
      badge: 8, // Pendientes de aprobación
      planRequired: ['professional', 'enterprise'], // Solo en estos planes
    },
  ];

  const handleTabOrderChange = (newOrder: string[]) => {
    setTabOrder(newOrder);
    // Guardar en localStorage o backend
    localStorage.setItem('content_tab_order', JSON.stringify(newOrder));
  };

  return (
    <DraggableTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onTabOrderChange={handleTabOrderChange}
      isDraggable={true} // Habilitar drag & drop
      currentPlan="professional" // Plan actual del usuario
    />
  );
}

// ============================================
// EJEMPLO 2: Tabs de Settings (con restricciones por plan)
// ============================================
export function SettingsTabsExample() {
  const [activeTab, setActiveTab] = useState('overview');
  const currentPlan = 'enterprise'; // Puede ser: demo, professional, enterprise

  const tabs: DraggableTab[] = [
    {
      id: 'overview',
      label: 'Vista General',
      icon: Sparkles,
      locked: true, // No se puede reorganizar (siempre primero)
    },
    {
      id: 'usage',
      label: 'Uso del Plan',
      icon: Sparkles,
    },
    {
      id: 'general',
      label: 'General',
      icon: Settings,
    },
    {
      id: 'members',
      label: 'Miembros',
      icon: Users,
      badge: 5, // Número de miembros
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: Shield,
    },
    {
      id: 'integrations',
      label: 'Integraciones',
      icon: Share2,
    },
    {
      id: 'white-label',
      label: 'White-label',
      icon: Palette,
      planRequired: ['enterprise'], // Solo enterprise
    },
    {
      id: 'api',
      label: 'API Access',
      icon: Key,
      planRequired: ['enterprise'], // Solo enterprise
    },
  ];

  return (
    <DraggableTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isDraggable={true}
      currentPlan={currentPlan}
      onTabOrderChange={(newOrder) => {
        console.log('Nuevo orden:', newOrder);
      }}
    />
  );
}

// ============================================
// EJEMPLO 3: Tabs estáticos (sin drag & drop)
// ============================================
export function StaticTabsExample() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs: DraggableTab[] = [
    { id: 'all', label: 'Todas', icon: Folder, badge: 50 },
    { id: 'scheduled', label: 'Programadas', icon: Calendar, badge: 12 },
    { id: 'published', label: 'Publicadas', icon: CheckCircle, badge: 35 },
    { id: 'failed', label: 'Fallidas', icon: FileText, badge: 3 },
  ];

  return (
    <DraggableTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isDraggable={false} // Sin drag & drop
    />
  );
}

// ============================================
// EJEMPLO 4: Tabs con algunos deshabilitados
// ============================================
export function DisabledTabsExample() {
  const [activeTab, setActiveTab] = useState('basic');

  const tabs: DraggableTab[] = [
    {
      id: 'basic',
      label: 'Básico',
      icon: Folder,
      enabled: true,
    },
    {
      id: 'advanced',
      label: 'Avanzado',
      icon: Settings,
      enabled: false, // Este tab no se mostrará
    },
    {
      id: 'premium',
      label: 'Premium',
      icon: Sparkles,
      enabled: true,
    },
  ];

  return <DraggableTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
}

// ============================================
// EJEMPLO 5: Tabs con filtrado por plan
// ============================================
export function PlanFilteredTabsExample() {
  const [activeTab, setActiveTab] = useState('basic');
  const [currentPlan, setCurrentPlan] = useState<'demo' | 'professional' | 'enterprise'>('demo');

  const tabs: DraggableTab[] = [
    {
      id: 'basic',
      label: 'Básico',
      icon: Folder,
      // Disponible en todos los planes
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Target,
      planRequired: ['professional', 'enterprise'], // Solo pro y enterprise
    },
    {
      id: 'advanced',
      label: 'Avanzado',
      icon: Settings,
      planRequired: ['enterprise'], // Solo enterprise
    },
    {
      id: 'api',
      label: 'API',
      icon: Key,
      planRequired: ['enterprise'], // Solo enterprise
    },
  ];

  return (
    <div>
      {/* Selector de plan para demo */}
      <div className="mb-4 flex gap-2">
        <button onClick={() => setCurrentPlan('demo')}>Demo</button>
        <button onClick={() => setCurrentPlan('professional')}>Professional</button>
        <button onClick={() => setCurrentPlan('enterprise')}>Enterprise</button>
      </div>

      <DraggableTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentPlan={currentPlan}
      />

      <div className="mt-4 text-sm text-gray-600">Plan actual: {currentPlan}</div>
    </div>
  );
}

// ============================================
// EJEMPLO 6: Tabs con badges dinámicos
// ============================================
export function DynamicBadgesExample() {
  const [activeTab, setActiveTab] = useState('pending');
  const [counts, setCounts] = useState({
    pending: 12,
    approved: 45,
    rejected: 3,
  });

  const tabs: DraggableTab[] = [
    {
      id: 'pending',
      label: 'Pendientes',
      icon: FileText,
      badge: counts.pending,
    },
    {
      id: 'approved',
      label: 'Aprobados',
      icon: CheckCircle,
      badge: counts.approved,
    },
    {
      id: 'rejected',
      label: 'Rechazados',
      icon: Target,
      badge: counts.rejected,
    },
  ];

  return (
    <div>
      <DraggableTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Simular actualización de badges */}
      <button
        onClick={() =>
          setCounts((prev) => ({
            ...prev,
            pending: prev.pending + 1,
          }))
        }
        className="mt-4"
      >
        Agregar pendiente
      </button>
    </div>
  );
}

// ============================================
// EJEMPLO 7: Persistir orden en localStorage
// ============================================
export function PersistentOrderExample() {
  const [activeTab, setActiveTab] = useState('tab1');

  // Cargar orden guardado
  const savedOrder = localStorage.getItem('my_tab_order');
  const initialOrder = savedOrder ? JSON.parse(savedOrder) : null;

  const tabs: DraggableTab[] = [
    { id: 'tab1', label: 'Tab 1', icon: Folder },
    { id: 'tab2', label: 'Tab 2', icon: Calendar },
    { id: 'tab3', label: 'Tab 3', icon: FileText },
    { id: 'tab4', label: 'Tab 4', icon: Target },
  ];

  // Reordenar tabs según el orden guardado
  const orderedTabs = initialOrder
    ? initialOrder.map((id: string) => tabs.find((t) => t.id === id)).filter(Boolean)
    : tabs;

  const handleTabOrderChange = (newOrder: string[]) => {
    localStorage.setItem('my_tab_order', JSON.stringify(newOrder));
  };

  return (
    <DraggableTabs
      tabs={orderedTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onTabOrderChange={handleTabOrderChange}
      isDraggable={true}
    />
  );
}

// ============================================
// PROPS DEL COMPONENTE
// ============================================
/**
 * DraggableTabsProps:
 *
 * @param tabs - Array de tabs a mostrar
 *   - id: string (identificador único)
 *   - label: string (texto a mostrar)
 *   - icon?: LucideIcon (icono opcional)
 *   - badge?: number | string (badge opcional)
 *   - enabled?: boolean (si es false, el tab no se muestra)
 *   - locked?: boolean (si es true, no se puede reorganizar)
 *   - planRequired?: string[] (planes que requieren este tab)
 *
 * @param activeTab - ID del tab activo actualmente
 *
 * @param onTabChange - Callback cuando se cambia de tab
 *   - Recibe: (id: string) => void
 *
 * @param onTabOrderChange - Callback cuando se reorganizan los tabs
 *   - Recibe: (newOrder: string[]) => void
 *
 * @param isDraggable - Si es true, permite drag & drop
 *   - Default: false
 *
 * @param currentPlan - Plan actual del usuario
 *   - Usado para filtrar tabs según planRequired
 *   - Default: "demo"
 *
 * @param className - Clases CSS adicionales
 */

// ============================================
// DIFERENCIAS CON TabNavigation
// ============================================
/**
 * TabNavigation vs DraggableTabs:
 *
 * TabNavigation:
 * - Más simple y ligero
 * - 3 variantes visuales (default, pills, underline)
 * - No soporta drag & drop
 * - Ideal para navegación simple
 *
 * DraggableTabs:
 * - Más complejo y potente
 * - Solo 1 estilo visual (pills con grip)
 * - Soporta drag & drop
 * - Soporta badges dinámicos
 * - Filtrado por plan
 * - Tabs bloqueados (locked)
 * - Ideal para configuraciones y content management
 */

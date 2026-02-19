/**
 * EJEMPLO DE USO: Lazy Loading y Virtual Scrolling
 * 
 * Este archivo muestra cómo usar las optimizaciones implementadas
 */

import { useState } from "react";
import { 
  LazyAiAssistant, 
  LazyCommandPalette,
  LazyNotificationsModal 
} from "@/Components/LazyComponents";
import { VirtualList, VirtualGrid } from "@/Components/common/ui/VirtualList";

// Ejemplo 1: Lazy Loading de Componentes Pesados
export function LazyComponentExample() {
  const [showAI, setShowAI] = useState(false);
  const [showCommands, setShowCommands] = useState(false);

  return (
    <div>
      <button onClick={() => setShowAI(true)}>
        Abrir AI Assistant
      </button>
      
      {/* El componente solo se carga cuando showAI es true */}
      {showAI && <LazyAiAssistant onClose={() => setShowAI(false)} />}
      
      {/* Atajo de teclado para command palette */}
      <button onClick={() => setShowCommands(true)}>
        Abrir Command Palette (Cmd+K)
      </button>
      
      {showCommands && (
        <LazyCommandPalette 
          isOpen={showCommands}
          onClose={() => setShowCommands(false)}
        />
      )}
    </div>
  );
}

// Ejemplo 2: Virtual List para listas largas
export function VirtualListExample() {
  // Simular 10,000 items
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    title: `Item ${i}`,
    description: `Descripción del item ${i}`,
  }));

  return (
    <div style={{ height: "600px" }}>
      <VirtualList
        items={items}
        estimatedItemSize={80}
        overscan={5}
        renderItem={(item) => (
          <div 
            key={item.id}
            className="p-4 border-b hover:bg-gray-50"
          >
            <h3 className="font-bold">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        )}
        emptyState={
          <div className="text-center py-8">
            No hay items para mostrar
          </div>
        }
      />
    </div>
  );
}

// Ejemplo 3: Virtual Grid para cards
export function VirtualGridExample() {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    title: `Card ${i}`,
    image: `https://picsum.photos/300/200?random=${i}`,
  }));

  return (
    <div style={{ height: "calc(100vh - 200px)" }}>
      <VirtualGrid
        items={items}
        columns={4}
        overscan={2}
        renderItem={(item) => (
          <div 
            key={item.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <img 
              src={item.image} 
              alt={item.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold">{item.title}</h3>
            </div>
          </div>
        )}
      />
    </div>
  );
}

// Ejemplo 4: Combinando Lazy Loading con Virtual Scrolling
export function CombinedExample() {
  const [showModal, setShowModal] = useState(false);
  
  const notifications = Array.from({ length: 500 }, (_, i) => ({
    id: i,
    title: `Notificación ${i}`,
    message: `Mensaje de la notificación ${i}`,
    read: Math.random() > 0.5,
  }));

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Ver Notificaciones ({notifications.length})
      </button>

      {/* Modal se carga lazy, contenido usa virtual scrolling */}
      {showModal && (
        <LazyNotificationsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// Ejemplo 5: Lazy Loading de Rutas
export function LazyRouteExample() {
  /**
   * En app.tsx ya está configurado el lazy loading de rutas:
   * 
   * resolve: (name) => {
   *   return resolvePageComponent(
   *     `./Pages/${name}.tsx`,
   *     import.meta.glob("./Pages/**\/*.tsx")
   *   );
   * }
   * 
   * Esto significa que cada página se carga solo cuando se navega a ella.
   * No necesitas hacer nada adicional.
   */
  
  return (
    <div>
      <p>Las rutas ya están optimizadas con lazy loading automático</p>
      <ul>
        <li>Dashboard - Se carga al navegar a /dashboard</li>
        <li>Analytics - Se carga al navegar a /analytics</li>
        <li>Calendar - Se carga al navegar a /calendar</li>
      </ul>
    </div>
  );
}

// Ejemplo 6: Configuración Avanzada de Virtual List
export function AdvancedVirtualListExample() {
  const items = Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    type: i % 3 === 0 ? "large" : "small",
    content: `Item ${i}`,
  }));

  return (
    <div style={{ height: "700px" }}>
      <VirtualList
        items={items}
        // Altura estimada - ajustar según tu contenido
        estimatedItemSize={100}
        // Overscan: cuántos items renderizar fuera del viewport
        // Mayor = más suave pero más memoria
        overscan={10}
        renderItem={(item) => (
          <div 
            key={item.id}
            className={`p-4 border-b ${
              item.type === "large" ? "h-32" : "h-20"
            }`}
          >
            <div className="font-bold">{item.content}</div>
            <div className="text-sm text-gray-500">
              Tipo: {item.type}
            </div>
          </div>
        )}
        // Header fijo en la parte superior
        header={
          <div className="bg-gray-100 p-4 font-bold sticky top-0">
            Total: {items.length} items
          </div>
        }
        // Footer al final de la lista
        footer={
          <div className="bg-gray-100 p-4 text-center text-sm">
            Fin de la lista
          </div>
        }
      />
    </div>
  );
}

// Ejemplo 7: Performance Tips
export function PerformanceTips() {
  return (
    <div className="prose">
      <h2>Tips de Rendimiento</h2>
      
      <h3>1. Lazy Loading</h3>
      <ul>
        <li>Usa lazy loading para componentes que no se ven inicialmente</li>
        <li>Modales, sidebars, tabs inactivos son buenos candidatos</li>
        <li>No uses lazy loading para componentes críticos above-the-fold</li>
      </ul>

      <h3>2. Virtual Scrolling</h3>
      <ul>
        <li>Usa virtual scrolling para listas con más de 50 items</li>
        <li>Ajusta estimatedItemSize lo más cercano posible al tamaño real</li>
        <li>Overscan de 3-5 es suficiente para la mayoría de casos</li>
        <li>Para items de altura variable, usa un promedio</li>
      </ul>

      <h3>3. Cuándo NO usar</h3>
      <ul>
        <li>Listas pequeñas (menos de 20 items)</li>
        <li>Componentes muy pequeños (menos de 5KB)</li>
        <li>Contenido crítico que debe estar disponible inmediatamente</li>
      </ul>

      <h3>4. Medición</h3>
      <ul>
        <li>Usa React DevTools Profiler para medir re-renders</li>
        <li>Lighthouse para métricas de carga</li>
        <li>Performance API para métricas custom</li>
      </ul>
    </div>
  );
}

/**
 * Ejemplo de uso del hook useSafeNavigation
 * 
 * Este componente demuestra cómo usar el hook useSafeNavigation
 * para prevenir errores de "Transition was skipped" en Inertia.js
 */

import { Button } from '@/Components/ui/Button';
import { useSafeNavigation } from '@/Hooks/useSafeNavigation';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export function SafeNavigationExample() {
  const { safeVisit, safePost, isNavigating } = useSafeNavigation();
  const [formData, setFormData] = useState({ name: '', email: '' });

  // ✅ Ejemplo 1: Navegación simple con botón
  const handleNavigateToDashboard = () => {
    safeVisit('/dashboard', {
      preserveState: true,
      onSuccess: () => {
        console.log('Navegación exitosa');
      },
    });
  };

  // ✅ Ejemplo 2: Navegación con POST (formulario)
  const handleSubmitForm = () => {
    safePost('/api/users', formData, {
      preserveScroll: true,
      onSuccess: () => {
        console.log('Formulario enviado');
        setFormData({ name: '', email: '' });
      },
      onError: (errors) => {
        console.error('Errores de validación:', errors);
      },
    });
  };

  // ✅ Ejemplo 3: Navegación condicional
  const handleConditionalNavigation = () => {
    if (formData.name && formData.email) {
      safeVisit('/profile', {
        data: formData,
        preserveState: true,
      });
    } else {
      alert('Por favor completa todos los campos');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Ejemplos de Navegación Segura</h2>

      {/* Ejemplo 1: Botón simple */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">1. Navegación Simple</h3>
        <Button
          onClick={handleNavigateToDashboard}
          disabled={isNavigating}
        >
          {isNavigating ? 'Navegando...' : 'Ir al Dashboard'}
        </Button>
      </div>

      {/* Ejemplo 2: Formulario */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">2. Envío de Formulario</h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border p-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border p-2"
          />
          <Button
            onClick={handleSubmitForm}
            disabled={isNavigating}
          >
            {isNavigating ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>

      {/* Ejemplo 3: Navegación condicional */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">3. Navegación Condicional</h3>
        <Button
          onClick={handleConditionalNavigation}
          disabled={isNavigating}
        >
          Ir al Perfil (requiere datos)
        </Button>
      </div>

      {/* Estado de navegación */}
      <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <p className="text-sm">
          <strong>Estado de navegación:</strong>{' '}
          <span className={isNavigating ? 'text-yellow-600' : 'text-green-600'}>
            {isNavigating ? '🔄 Navegando...' : '✅ Listo'}
          </span>
        </p>
      </div>

      {/* Notas */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
          💡 Notas Importantes
        </h4>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>El hook previene navegaciones duplicadas automáticamente</li>
          <li>Usa <code>isNavigating</code> para deshabilitar botones durante navegación</li>
          <li>Todos los callbacks de Inertia están soportados (onSuccess, onError, etc.)</li>
          <li>Compatible con todos los métodos HTTP (GET, POST, PUT, DELETE)</li>
        </ul>
      </div>
    </div>
  );
}

// ❌ ANTI-PATRÓN: No hacer esto
export function BadNavigationExample() {
  const handleBadNavigation = () => {
    // ❌ MAL: Múltiples navegaciones sin control
    router.visit('/page1');
    router.visit('/page2'); // Esto cancelará la primera navegación
  };

  const handleBadDoubleClick = () => {
    // ❌ MAL: Sin protección contra doble clic
    router.visit('/dashboard');
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-red-600">❌ Anti-patrones (NO USAR)</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Múltiples navegaciones</h3>
        <button onClick={handleBadNavigation}>
          Navegación Múltiple (MAL)
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Sin protección de doble clic</h3>
        <button onClick={handleBadDoubleClick}>
          Sin Protección (MAL)
        </button>
      </div>
    </div>
  );
}

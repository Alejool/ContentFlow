import { Popover } from '@/Components/common/Modern/Popover';
import { X } from 'lucide-react';

/**
 * Ejemplo simple de modal usando Popover
 * 
 * Este ejemplo muestra cómo crear un modal básico con:
 * - Botón de cierre
 * - Header con título
 * - Contenido
 * - Footer con acciones
 */
export function SimpleModalExample() {
  const trigger = (
    <button className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
      Abrir Modal
    </button>
  );

  return (
    <Popover trigger={trigger} placement="center" className="w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-neutral-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Título del Modal
        </h2>
        <button
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <p className="text-gray-600 dark:text-gray-300">
          Este es el contenido del modal. Puedes agregar cualquier componente aquí.
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-neutral-700">
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800">
          Cancelar
        </button>
        <button className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
          Confirmar
        </button>
      </div>
    </Popover>
  );
}

/**
 * Ejemplo de dropdown de acciones usando Popover
 */
export function ActionsDropdownExample() {
  const trigger = (
    <button className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-800">
      Acciones ▼
    </button>
  );

  return (
    <Popover trigger={trigger} placement="bottom end" className="w-48">
      <div className="py-1">
        <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800">
          Editar
        </button>
        <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800">
          Duplicar
        </button>
        <div className="my-1 h-px bg-gray-200 dark:bg-neutral-700" />
        <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10">
          Eliminar
        </button>
      </div>
    </Popover>
  );
}

/**
 * Ejemplo de tooltip usando Popover
 */
export function TooltipExample() {
  const trigger = (
    <button className="rounded-lg bg-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-300 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600">
      Hover me
    </button>
  );

  return (
    <Popover trigger={trigger} placement="top" offset={4} className="max-w-xs">
      <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
        Este es un tooltip simple usando Popover. Puedes agregar cualquier contenido aquí.
      </div>
    </Popover>
  );
}

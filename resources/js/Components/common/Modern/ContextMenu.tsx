import { Popover } from '@/Components/common/Modern/Popover';
import { ReactNode } from 'react';

interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface MenuSection {
  items: MenuItem[];
}

interface ContextMenuProps {
  trigger: ReactNode;
  sections: MenuSection[];
  placement?: 'bottom' | 'bottom start' | 'bottom end' | 'top' | 'top start' | 'top end';
}

/**
 * ContextMenu usando React Aria Popover
 * 
 * Menú contextual con:
 * - Secciones separadas por dividers
 * - Variantes de items (default, danger)
 * - Estados disabled
 * - Iconos opcionales
 * - Navegación por teclado
 * 
 * @example
 * <ContextMenu
 *   trigger={<button>Acciones</button>}
 *   sections={[
 *     {
 *       items: [
 *         { label: 'Editar', icon: <Edit />, onClick: handleEdit },
 *         { label: 'Duplicar', icon: <Copy />, onClick: handleDuplicate }
 *       ]
 *     },
 *     {
 *       items: [
 *         { label: 'Eliminar', icon: <Trash />, onClick: handleDelete, variant: 'danger' }
 *       ]
 *     }
 *   ]}
 * />
 */
export function ContextMenu({ trigger, sections, placement = 'bottom end' }: ContextMenuProps) {
  return (
    <Popover trigger={trigger} placement={placement} className="min-w-[200px]">
      <div className="py-1">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {sectionIndex > 0 && (
              <div className="my-1 h-px bg-gray-200 dark:bg-neutral-700" />
            )}
            {section.items.map((item, itemIndex) => (
              <button
                key={itemIndex}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                  item.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : item.variant === 'danger'
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800'
                }`}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </Popover>
  );
}

/**
 * Ejemplo de uso con acciones comunes de contenido
 */
export function ContentActionsMenu({
  onEdit,
  onDuplicate,
  onPublish,
  onDelete,
  canEdit = true,
  canPublish = true,
  canDelete = true,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onPublish: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canPublish?: boolean;
  canDelete?: boolean;
}) {
  return (
    <ContextMenu
      trigger={
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      }
      sections={[
        {
          items: [
            {
              label: 'Editar',
              onClick: onEdit,
              disabled: !canEdit,
            },
            {
              label: 'Duplicar',
              onClick: onDuplicate,
            },
            {
              label: 'Publicar',
              onClick: onPublish,
              disabled: !canPublish,
            },
          ],
        },
        {
          items: [
            {
              label: 'Eliminar',
              onClick: onDelete,
              variant: 'danger',
              disabled: !canDelete,
            },
          ],
        },
      ]}
    />
  );
}

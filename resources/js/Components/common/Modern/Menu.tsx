import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger,
  Popover,
  Separator,
  type MenuItemProps,
  type MenuProps,
} from 'react-aria-components';

interface ModernMenuProps<T> extends Omit<MenuProps<T>, 'children'> {
  children: ReactNode;
  trigger: ReactNode;
  placement?: 'bottom' | 'bottom start' | 'bottom end' | 'top' | 'top start' | 'top end';
}

interface ModernMenuItemProps extends MenuItemProps {
  icon?: LucideIcon;
  variant?: 'default' | 'danger';
  children: ReactNode;
}

interface ModernMenuSeparatorProps {
  className?: string;
}

export function Menu<T extends object>({
  children,
  trigger,
  placement = 'bottom end',
  ...props
}: ModernMenuProps<T>) {
  return (
    <MenuTrigger>
      {trigger}
      <Popover
        placement={placement}
        className="min-w-[12rem] overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-2xl outline-none dark:border-neutral-800 dark:bg-neutral-900"
      >
        <AriaMenu {...props} className="outline-none">
          {children}
        </AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}

export function MenuItem({
  icon: Icon,
  variant = 'default',
  children,
  ...props
}: ModernMenuItemProps) {
  const variantStyles = {
    default: 'text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-800',
    danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
  };

  return (
    <AriaMenuItem
      {...props}
      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus:bg-primary-50 focus:text-primary-600 dark:focus:bg-primary-900/20 dark:focus:text-primary-400 ${variantStyles[variant]}`}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <span>{children}</span>
    </AriaMenuItem>
  );
}

export function MenuSeparator({ className = '' }: ModernMenuSeparatorProps) {
  return (
    <Separator className={`my-1 border-t border-gray-200 dark:border-neutral-800 ${className}`} />
  );
}

// Export compound component
Menu.Item = MenuItem;
Menu.Separator = MenuSeparator;

export default Menu;

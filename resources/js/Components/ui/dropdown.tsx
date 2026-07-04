import * as React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { cn } from '@/lib/common/utils';

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

const Dropdown = ({ trigger, children, align = 'right', className }: DropdownProps) => (
  <Menu as="div" className={cn('relative inline-block text-left', className)}>
    <MenuButton as={React.Fragment}>{trigger}</MenuButton>
    <MenuItems
      transition
      className={cn(
        'absolute z-50 mt-2 min-w-48 origin-top rounded-lg border border-neutral-200 bg-white p-1 shadow-lg transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-neutral-700 dark:bg-neutral-900',
        align === 'right' ? 'right-0' : 'left-0',
      )}
    >
      {children}
    </MenuItems>
  </Menu>
);

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

const DropdownItem = ({ className, destructive = false, ...props }: DropdownItemProps) => (
  <MenuItem>
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors data-[focus]:bg-neutral-100 dark:data-[focus]:bg-neutral-800',
        destructive
          ? 'text-error-600 dark:text-error-500'
          : 'text-neutral-700 dark:text-neutral-200',
        className,
      )}
      {...props}
    />
  </MenuItem>
);

export { Dropdown, DropdownItem };

import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export interface CommandItem {
  id: string;
  name: string;
  description?: string;
  href?: string;
  action?: () => void;
  icon: React.ComponentType<any>;
  category: 'navigation' | 'actions' | 'accounts' | 'settings' | 'billing' | 'theme';
  keywords?: string[];
}

export function useCommandPalette(commands: CommandItem[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // ESC to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const onOpenEvent = () => setIsOpen(true);

    window.addEventListener('keydown', onKeydown);
    window.addEventListener('open-command-palette', onOpenEvent);

    return () => {
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('open-command-palette', onOpenEvent);
    };
  }, [isOpen]);

  // Filter commands based on query
  const filteredCommands =
    query === ''
      ? commands
      : commands.filter((item) => {
          const searchText = query.toLowerCase();
          const nameMatch = item.name.toLowerCase().includes(searchText);
          const descMatch = item.description?.toLowerCase().includes(searchText);
          const keywordMatch = item.keywords?.some((kw) => kw.toLowerCase().includes(searchText));
          return nameMatch || descMatch || keywordMatch;
        });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    setQuery('');

    if (item.href) {
      router.visit(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    query,
    setQuery,
    filteredCommands,
    groupedCommands,
    handleSelect,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

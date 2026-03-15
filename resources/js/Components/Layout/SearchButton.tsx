import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchButtonProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export default function SearchButton({ className = '', variant = 'default' }: SearchButtonProps) {
  const { t } = useTranslation();

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200 ${className}`}
        aria-label={t('common.search')}
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group relative flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-500 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-gray-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 md:w-64 ${className}`}
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">{t('common.search')}...</span>
      <kbd className="hidden h-5 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100 transition-opacity group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-400 md:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

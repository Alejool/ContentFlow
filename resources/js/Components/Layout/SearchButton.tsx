import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchButtonProps {
    className?: string;
    variant?: "default" | "compact";
}

export default function SearchButton({ className = "", variant = "default" }: SearchButtonProps) {
    const { t } = useTranslation();

    const handleClick = () => {
        window.dispatchEvent(new CustomEvent('open-command-palette'));
    };

    if (variant === "compact") {
        return (
            <button
                onClick={handleClick}
                className={`p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${className}`}
                aria-label={t('common.search')}
            >
                <Search className="w-5 h-5" />
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`group relative flex items-center gap-2 px-3 py-1.5 w-full md:w-64 
                bg-gray-100 dark:bg-neutral-800/50 
                border border-gray-200 dark:border-neutral-700/50 
                rounded-lg text-sm text-gray-500 dark:text-gray-400 
                hover:border-gray-300 dark:hover:border-neutral-600 
                hover:bg-gray-50 dark:hover:bg-neutral-800 
                transition-all duration-200 ${className}`}
        >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">{t('common.search')}...</span>
            <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400 opacity-100 group-hover:opacity-100 transition-opacity">
                <span className="text-xs">⌘</span>K
            </kbd>
        </button>
    );
}

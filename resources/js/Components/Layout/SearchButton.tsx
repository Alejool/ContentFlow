import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchButtonProps {
  className?: string;
  variant?: "default" | "compact";
}

export default function SearchButton({
  className = "",
  variant = "default",
}: SearchButtonProps) {
  const { t } = useTranslation();

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        buttonStyle="ghost"
        size="sm"
        onClick={handleClick}
        className={`p-2 !border-none !shadow-none text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ${className}`}
        aria-label={t("common.search")}
        icon={Search}
        shadow="none"
      >
        {""}
      </Button>
    );
  }

  return (
    <div
      className={`relative group md:w-48 ${className}`}
      onClick={handleClick}
    >
      <Input
        id="search-trigger"
        readOnly
        sizeType="sm"
        placeholder={`${t("common.search")}...`}
        icon={Search}
        containerClassName="cursor-pointer"
        className="cursor-pointer !bg-gray-100/50 dark:!bg-neutral-800/30 !border-gray-200/80 dark:!border-neutral-700/30 hover:!border-gray-300 dark:hover:!border-neutral-600/70 text-gray-500 dark:text-gray-400 text-xs !h-8"
        suffix={
          <kbd className="hidden md:inline-flex h-4 items-center gap-0.5 rounded border border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900/50 px-1 font-mono text-[9px] font-medium text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        }
      />
    </div>
  );
}

import { Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className = "",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === options.length
      ? "All"
      : `${selected.length} selected`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 flex items-center justify-between hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select options. ${selected.length} of ${options.length} selected`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center justify-between transition-colors"
                role="option"
                aria-selected={isSelected}
              >
                <span className="capitalize">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-primary-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

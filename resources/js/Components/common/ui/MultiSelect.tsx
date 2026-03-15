import { Check, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
  placeholder = 'Select...',
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === options.length
        ? 'All'
        : `${selected.length} selected`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:border-primary-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:border-primary-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select options. ${selected.length} of ${options.length} selected`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
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
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700"
                role="option"
                aria-selected={isSelected}
              >
                <span className="capitalize">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 text-primary-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

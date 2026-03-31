import RadioInput from '@/Components/common/Modern/RadioInput';
import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';

interface PlatformCardProps {
  value: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  selected?: boolean;
  onSelect: (value: string) => void;
}

export default function PlatformCard({
  value,
  label,
  description,
  icon: Icon,
  iconColor = 'text-primary-500',
  iconBgColor = 'bg-primary-50 dark:bg-primary-900/20',
  selected = false,
  onSelect,
}: PlatformCardProps) {
  const inputId = `platform-card-${value}`;

  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-gray-200 p-5 transition-all hover:border-primary-500 dark:border-neutral-700"
    >
      <div className={`h-10 w-10 ${iconBgColor} mb-3 flex items-center justify-center rounded-lg`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <span className="text-center font-medium text-gray-900 dark:text-white">{label}</span>
      {description && (
        <span className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          {description}
        </span>
      )}
      <div
        className={`mt-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>
      <RadioInput
        id={inputId}
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        aria-label={label}
      />
    </label>
  );
}

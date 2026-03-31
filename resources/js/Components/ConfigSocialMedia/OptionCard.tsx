import RadioInput from '@/Components/common/Modern/RadioInput';
import { Check, LucideIcon } from 'lucide-react';

interface OptionCardProps {
  value: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  selected?: boolean;
  onSelect: (value: string) => void;
  iconColor?: string;
  iconBgColor?: string;
}

export default function OptionCard({
  value,
  label,
  description,
  icon: Icon,
  selected = false,
  onSelect,
  iconColor = 'text-primary-500',
  iconBgColor = 'bg-primary-50 dark:bg-primary-900/20',
}: OptionCardProps) {
  const inputId = `option-card-${value}`;

  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-500 dark:border-neutral-700"
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 ${iconBgColor} flex items-center justify-center rounded-lg`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <span className="block font-medium text-gray-900 dark:text-white">{label}</span>
          {description && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>
          )}
        </div>
      </div>
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
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

import { LucideIcon } from "lucide-react";

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
  iconColor = "text-primary-500",
  iconBgColor = "bg-primary-50 dark:bg-primary-900/20",
}: OptionCardProps) {
  return (
    <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <span className="font-medium text-gray-900 dark:text-white block">
            {label}
          </span>
          {description && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </span>
          )}
        </div>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected
            ? "border-primary-500 bg-primary-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        {selected && (
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <input
        type="radio"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="hidden"
      />
    </label>
  );
}

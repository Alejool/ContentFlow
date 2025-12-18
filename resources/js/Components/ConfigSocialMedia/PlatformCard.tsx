import { LucideIcon } from "lucide-react";

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
  iconColor = "text-primary-500",
  iconBgColor = "bg-primary-50 dark:bg-primary-900/20",
  selected = false,
  onSelect,
}: PlatformCardProps) {
  return (
    <label className="flex flex-col items-center p-5 border-2 border-gray-200 dark:border-neutral-700 rounded-xl hover:border-primary-500 cursor-pointer transition-all">
      <div
        className={`w-10 h-10 ${iconBgColor} rounded-lg flex items-center justify-center mb-3`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span className="font-medium text-gray-900 dark:text-white text-center">
        {label}
      </span>
      {description && (
        <span className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
          {description}
        </span>
      )}
      <div
        className={`mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
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

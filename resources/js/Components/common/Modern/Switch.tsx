interface SwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Switch({
  id,
  label,
  description,
  checked,
  onChange,
}: SwitchProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              clipRule="evenodd"
            />
          </svg>
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
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`block w-12 h-6 rounded-full transition-colors duration-200 ${
            checked ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-700"
          }`}
        >
          <div
            className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${
              checked ? "translate-x-6" : ""
            }`}
          ></div>
        </div>
      </div>
    </label>
  );
}

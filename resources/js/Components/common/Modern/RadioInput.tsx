import { InputHTMLAttributes, forwardRef } from "react";

interface RadioInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

const RadioInput = forwardRef<HTMLInputElement, RadioInputProps>(
  ({ label, description, className = "", id, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <input
          ref={ref}
          type="radio"
          id={id}
          className={`
            sr-only
            peer
            ${className}
          `}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className="flex items-center cursor-pointer select-none"
          >
            <div className="relative flex items-center justify-center w-5 h-5 mr-3">
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-all" />
              <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {label}
              </span>
              {description && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </span>
              )}
            </div>
          </label>
        )}
      </div>
    );
  }
);

RadioInput.displayName = "RadioInput";

export default RadioInput;

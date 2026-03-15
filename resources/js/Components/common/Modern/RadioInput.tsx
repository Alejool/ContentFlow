import { InputHTMLAttributes, forwardRef } from "react";

interface RadioInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

const RadioInput = forwardRef<HTMLInputElement, RadioInputProps>(
  ({ label, description, className = "", id, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <input ref={ref} type="radio" id={id} className={`peer sr-only ${className} `} {...props} />
        {label && (
          <label htmlFor={id} className="flex cursor-pointer select-none items-center">
            <div className="relative mr-3 flex h-5 w-5 items-center justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 transition-all peer-checked:border-primary-500 peer-checked:bg-primary-500 dark:border-gray-600" />
              <div className="absolute h-2 w-2 rounded-full bg-white opacity-0 transition-opacity peer-checked:opacity-100" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
              {description && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>
              )}
            </div>
          </label>
        )}
      </div>
    );
  },
);

RadioInput.displayName = "RadioInput";

export default RadioInput;

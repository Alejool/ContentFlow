import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, InputHTMLAttributes, ChangeEvent } from 'react';

// Define the props for the TextInput component
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    isFocused?: boolean;
    label?: string;
    error?: string;
    showPasswordToggle?: boolean;
}

// Define the type for the ref methods that can be called from parent components
export interface TextInputRef {
    focus: () => void;
}

// Eye icons as SVG components
const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
);

const TextInput = forwardRef<TextInputRef, TextInputProps>(function TextInput(
    { 
        type = 'text', 
        className = '', 
        isFocused = false, 
        value, 
        onChange, 
        label,
        error,
        showPasswordToggle = false,
        id,
        placeholder,
        ...props 
    },
    ref
) {
    const localRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Determine the input type based on password visibility
    const inputType = type === "password" && showPassword ? "text" : type;

    // Expose the focus method to parent components via the ref
    useImperativeHandle(ref, () => ({
        focus: () => {
            localRef.current?.focus();
        },
    }));

    // Focus the input element if isFocused is true
    useEffect(() => {
        if (isFocused && localRef.current) {
            localRef.current.focus();
        }
    }, [isFocused]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e);
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-gray-900">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    {...props}
                    id={id}
                    type={inputType}
                    value={value}
                    placeholder={placeholder}
                    className={`
                        block w-full px-4 py-3 text-gray-900 placeholder-gray-400
                        bg-white border-2 rounded-xl shadow-sm transition-all duration-200
                        focus:outline-none focus:ring-0 hover:shadow-md
                        ${
                            error
                                ? "border-red-300 focus:border-red-500 bg-red-50"
                                : "border-gray-200 focus:border-blue-500 focus:bg-gray-50"
                        }
                        ${showPasswordToggle ? "pr-12" : ""}
                        ${className}
                    `}
                    onChange={handleChange}
                    ref={localRef}
                />
                {showPasswordToggle && type === "password" && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                )}
            </div>
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
});

export default TextInput;
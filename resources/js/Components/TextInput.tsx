import React, { forwardRef, useEffect, useImperativeHandle, useRef, InputHTMLAttributes, ChangeEvent } from 'react';

// Define the props for the TextInput component
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    isFocused?: boolean;
    // onChange is already part of InputHTMLAttributes<HTMLInputElement>
}

// Define the type for the ref methods that can be called from parent components
export interface TextInputRef {
    focus: () => void;
}

const TextInput = forwardRef<TextInputRef, TextInputProps>(function TextInput(
    { type = 'text', className = '', isFocused = false, value, onChange, ...props },
    ref
) {
    const localRef = useRef<HTMLInputElement>(null);

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
    }, [isFocused]); // Dependency array ensures this runs when isFocused changes

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e);
        }
    };

    return (
        <input
            {...props}
            type={type}
            value={value}
            className={
                `block w-full rounded-md border-gray-300 shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ` +
                className
            }
            onChange={handleChange}
            ref={localRef}
        />
    );
});

export default TextInput;
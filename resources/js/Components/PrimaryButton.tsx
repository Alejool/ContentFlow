import React, { ButtonHTMLAttributes, ReactNode, ElementType } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    disabled?: boolean;
    children?: ReactNode; // children can also be optional if the button might only have an icon
    icon?: ElementType; // For passing an SVG component or similar
}

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    icon: Icon, // Destructure icon prop and alias it to Icon for use as a component
    ...props
}: PrimaryButtonProps) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center gap-2 rounded-md border border-transparent bg-gray-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-gray-900 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
}
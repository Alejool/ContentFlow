import React from 'react';
import IconSave from '/public/Icons/profile.svg'; // Asegúrate de que la ruta sea correcta

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    icon: Icon, 
    ...props
}) {
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
            {Icon && <Icon className="w-4 h-4" />} {/* Usamos el componente SVG aquí */}
            {children}
        </button>
    );
}
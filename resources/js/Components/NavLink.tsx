import React, { ReactNode, ComponentProps } from 'react';
import { Link } from '@inertiajs/react';

interface NavLinkProps extends ComponentProps<typeof Link> {
    active?: boolean;
    className?: string;
    children: ReactNode; // href is part of ComponentProps<typeof Link>
}

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props // props will include href and other LinkProps
}: NavLinkProps) {
    return (
        <Link
            {...props} // href should be passed here
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-indigo-400 text-gray-900 focus:border-indigo-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700') +
                ' ' + // Added space for better class concatenation
                className
            }
        >
            {children}
        </Link>
    );
}

import React, { ReactNode, ComponentProps } from 'react';
import { Link } from '@inertiajs/react';

interface ResponsiveNavLinkProps extends ComponentProps<typeof Link> {
    active?: boolean;
    className?: string;
    children: ReactNode;
}

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: ResponsiveNavLinkProps) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start  py-2 pe-4 ps-3
                text-base transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}

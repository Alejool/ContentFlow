import React, { ReactNode, ComponentProps } from 'react';
import { Link } from '@inertiajs/react';

interface NavLinkProps extends ComponentProps<typeof Link> {
    active?: boolean;
    className?: string;
    children: ReactNode; 
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
                'inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' + 
                className
            }
        >
            {children}
        </Link>
    );
}

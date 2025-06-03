import React, { ReactNode } from 'react'; // Imported ReactNode
import ApplicationLogo from '@/Components/ApplicationLogo.tsx';
import { Link } from '@inertiajs/react';

import Bg from '@/../assets/background.svg';
// Logo is imported but not used in the original code, will keep it commented
// import Logo from '@/../assets/logo.png';

interface GuestLayoutProps {
    children: ReactNode;
}

export default function GuestLayout({ children }: GuestLayoutProps) { // Added type for children
    return (
        <div className=" min-h-screen flex-col items-center 
                sm:justify-center sm:pt-0 bg-cover bg-center h-screen"
              style={{ backgroundImage: `url(${Bg})`}}
        >
            <div>
                <Link href="/">
                    {/* The ApplicationLogo was commented out in the original, keeping it that way. */}
                    {/* <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" /> */}
                </Link>
            </div>

            <div className="bg-gray-50 bg-opacity-60 ">
                {children}
            </div>
        </div>
    );
}

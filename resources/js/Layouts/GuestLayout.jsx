import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

import Bg from '@/../assets/background.svg';
import Logo from '@/../assets/logo.png';

export default function GuestLayout({ children }) {
    return (
        <div className=" min-h-screen flex-col items-center 
                sm:justify-center sm:pt-0 bg-cover bg-center h-screen"
              style={{ backgroundImage: `url(${Bg})`}}
        >
            <div>
                <Link href="/">
                    {/* <img src={Logo} alt="logo" className="h-40 w-auto fill-current text-gray-800" /> */}
                    {/* <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" /> */}

                    {/* <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" /> */}
                </Link>
            </div>

            <div className="bg-gray-50 bg-opacity-60 ">
                {children}
            </div>
        </div>
    );
}

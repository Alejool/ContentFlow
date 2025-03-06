import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Bg from '@/../assets/background.svg';
import Logo from '@/../assets/logo-v2.svg';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Estado para controlar el sidebar

    return (
        <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${Bg})` }}>
            {/* Sidebar para pantallas grandes */}
            <div className={`hidden lg:block
                    fixed inset-y-16 bg-gray-800 bg-opacity-90
                     text-red-500 pb-10 transition-all duration-300 
                      ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="flex items-center justify-between p-4">
                    <Link href="/" className="flex items-center">
                        {/* <img src={Logo} alt="logo" className={`h-16 fill-current w-auto ${!isSidebarOpen && 'hidden'}`} /> */}
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:text-white focus:outline-none"
                    >
                        {isSidebarOpen ? (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Contenido del sidebar */}
                <nav className={` 
                flex flex-col justify-between h-[calc(100vh-13rem)] `}> {/* Ajusta la altura para que el Log Out quede abajo */}
                    <div className="flex flex-col   mt-10">
                        <NavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            className="flex items-center text-white px-6 py-3 text-sm hover:bg-gray-800 hover:text-red-500"
                        >
                            <div className="w-8 flex-shrink-0"> {/* Ancho fijo para el ícono */}
                                <svg className="h-12 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <span className={`ml-3 ${!isSidebarOpen && 'invisible'}`}>Dashboard</span>
                        </NavLink>
                        <NavLink
                            href={route('profile.edit')}
                            active={route().current('profile.edit')}
                            className="flex items-center px-6 py-3
                             text-white text-sm hover:bg-gray-800
                             hover:text-red-500"
                        >
                            <div className="w-8 flex-shrink-0"> 
                                <svg className="h-12 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <span className={`ml-3 ${!isSidebarOpen && 'invisible'}`}>Profile</span>
                        </NavLink>
                    </div>

                    {/* Log Out en la parte inferior */}
                    {/* <div className="mb-4 flex w-full">  */}
                        <NavLink
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex items-center px-6 
                                py-3   text-sm text-white
                                 hover:bg-gray-800 hover:text-red-500"
                            >
                            <div className="w-8 flex-shrink-0"> {/* Ancho fijo para el ícono */}
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <span className={`ml-3 ${!isSidebarOpen && 'invisible'}`}>Log Out</span>
                        </NavLink>
                    {/* </div> */}
                </nav>
            </div>

            {/* Navbar para dispositivos móviles */}
            <nav className="lg:hidden bg-gray-800 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center">
                            <button
                                onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
                                className="inline-flex items-center justify-center rounded-md p-2 hover:text-red-500 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-md border 
                                            border-transparent bg-gray-700 px-3 py-2 text-sm font-medium leading-4 text-white hover:bg-red-600 focus:outline-none"
                                        >
                                            {user.name}
                                            <svg
                                                className="-me-0.5 ms-2 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* Menú desplegable para móviles */}
                <div className={`${showingNavigationDropdown ? 'block' : 'hidden'} lg:hidden`}>
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            className="text-gray-300 hover:bg-gray-700 hover:text-red-500"
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('profile.edit')}
                            active={route().current('profile.edit')}
                            className="text-gray-300 hover:bg-gray-700 hover:text-red-500"
                        >
                            Profile
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-gray-300 hover:bg-gray-700 hover:text-red-500"
                        >
                            Log Out
                        </ResponsiveNavLink>
                    </div>
                </div>
            </nav>

            {/* Contenido principal */}
            <main className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {header && (
                    <header className="bg-white shadow">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
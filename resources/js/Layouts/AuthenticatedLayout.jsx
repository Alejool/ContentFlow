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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-cover bg-center bg-" style={{ backgroundImage: `url(${Bg})` }}>
            {/* Sidebar para pantallas grandes */}
            <div
                className={`hidden lg:block fixed inset-y-0 bg-gray-800 bg-opacity-90
                     text-red-500 pb-10 transition-all duration-300 ease-in-out ${
                    isSidebarOpen ? 'w-64' : 'w-20'
                }`}
            >
                <div className="flex items-center justify-between p-4">
                    <Link href="/" className="flex items-center">
                        <img
                            src={Logo}
                            alt="logo"
                            className={`h-16 w-auto ${!isSidebarOpen && 'hidden'}`}
                        />
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
                <nav className="flex flex-col justify-between h-[calc(100vh-8rem)]">
                    <div className="flex flex-col mt-10">
                        {/* Dashboard */}
                        <NavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            className="flex items-center text-white px-6 py-3 text-sm hover:bg-gray-700 hover:text-red-500"
                        >
                            <div className="w-8 flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    />
                                </svg>
                            </div>
                            <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>Dashboard</span>
                        </NavLink>

                        {/* Profile */}
                        <NavLink
                            href={route('profile.edit')}
                            active={route().current('profile.edit')}
                            className="flex items-center text-white px-6 py-3 text-sm hover:bg-gray-700 hover:text-red-500"
                        >
                            <div className="w-8 flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>
                            <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>Profile</span>
                        </NavLink>

                        {/* Manage Content */}
                        <NavLink
                            href={route('manage-content.index')}
                            active={route().current('manage-content.index')}
                            className="flex items-center text-white px-6 py-3 text-sm hover:bg-gray-700 hover:text-red-500"
                        >
                            <div className="w-8 flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>Manage Content</span>
                        </NavLink>

                        {/* Analytics */}
                        <NavLink
                            href={route('analytics.index')}
                            active={route().current('analytics.index')}
                            className="flex items-center text-white px-6 py-3 text-sm hover:bg-gray-700 hover:text-red-500"
                        >
                            <div className="w-8 flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>Analytics</span>
                        </NavLink>

                        {/* AI Chat */}
                        <NavLink
                            href={route('ai-chat.index')}
                            active={route().current('ai-chat.index')}
                            className="flex items-center text-white px-6 py-3 text-sm hover:bg-gray-700 hover:text-red-500"
                        >
                            <div className="w-8 flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                            </div>
                            <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>AI Chat</span>
                        </NavLink>
                    </div>

                    {/* Log Out */}
                    <NavLink
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex items-center text-white px-6 py-3 text-sm hover:bg-gray-700 hover:text-red-500"
                    >
                        <div className="w-8 flex-shrink-0">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                        </div>
                        <span className={`ml-3 ${!isSidebarOpen && 'hidden'}`}>Log Out</span>
                    </NavLink>
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
                                            className="inline-flex items-center rounded-md border border-transparent bg-gray-700 px-3 py-2 text-sm font-medium leading-4 text-white hover:bg-red-600 focus:outline-none"
                                        >
                                            {user.name ?? 'unknown'}
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
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
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
                            href={route('manage-content.index')}
                            active={route().current('manage-content.index')}
                            className="text-gray-300 hover:bg-gray-700 hover:text-red-500"
                        >
                            Manage Content
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('analytics.index')}
                            active={route().current('analytics.index')}
                            className="text-gray-300 hover:bg-gray-700 hover:text-red-500"
                        >
                            Analytics
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('ai-chat.index')}
                            active={route().current('ai-chat.index')}
                            className="text-gray-300 hover:bg-gray-700 hover:text-red-500"
                        >
                            AI Chat
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
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
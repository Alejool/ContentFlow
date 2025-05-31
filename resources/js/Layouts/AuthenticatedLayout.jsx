import ApplicationLogo from '@/Components/ApplicationLogo.tsx';
import Dropdown from '@/Components/Dropdown.tsx';
import NavLink from '@/Components/NavLink.tsx';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink.tsx';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from './Components/Sidebar';
import MobileNavbar from './Components/MobileNavbar';
import Bg from '@/../assets/background.svg';
import Logo from '@/../assets/logo.png';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user || {};
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
      <div
        className="min-h-screen relative overflow-hidden"
            style={{
               backgroundImage: `url(${Bg})`,
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               backgroundRepeat: 'no-repeat'
               }
            }
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-cover bg-center" />

        {/* Sidebar para pantallas grandes */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Navbar para dispositivos móviles */}
        <MobileNavbar
          user={user}
          showingNavigationDropdown={showingNavigationDropdown}
          setShowingNavigationDropdown={setShowingNavigationDropdown}
        />

        {/* Contenido principal */}
        <main
          className={`transition-all duration-500 ease-in-out relative z-10 ${
            isSidebarOpen ? "lg:ml-80" : "lg:ml-20"
          }`}
        >
          {header && (
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
              <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  {header}
                </div>
              </div>
            </header>
          )}
          <div className="p-6 min-h-screen">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>
      </div>
    );
}
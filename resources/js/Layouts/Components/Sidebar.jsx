import { Link } from '@inertiajs/react';
import NavLink from '@/Components/NavLink';
import Logo from '@/../assets/logo.png';

const navigationItems = [
    {
        name: 'Dashboard',
        href: 'dashboard',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        emoji: '🏠'
    },
    {
        name: 'Profile',
        href: 'profile.edit',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        emoji: '👤'
    },
    {
        name: 'Manage Content',
        href: 'manage-content.index',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        emoji: '📋'
    },
    {
        name: 'Analytics',
        href: 'analytics.index',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        emoji: '📊'
    },
    {
        name: 'AI Chat',
        href: 'ai-chat.index',
        icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
        emoji: '🤖'
    }
];

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
    return (
      <div
        className={`hidden lg:block fixed inset-y-0 z-50 transition-all duration-500 ease-in-out ${
          isSidebarOpen ? "w-80" : "w-32"
        }`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl" />

        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <Link
              href="/"
              className={`flex items-center transition-all duration-300 ${
                !isSidebarOpen && "justify-center"
              }`}
            >
              <div
                className="w-12 h-12 bg-gradient-to-r
                 from-red-500 to-orange-700 
                rounded-2xl flex items-center justify-center flex-shrink-0"
              >
                <img
                  src={Logo}
                  alt="logo"
                  className="w-8 h-8 object-contain filter brightness-0 invert"
                />
              </div>
              {isSidebarOpen && (
                <div className="ml-4 opacity-100 transition-opacity duration-300">
                  <h1
                    className="text-xl font-bold bg-gradient-to-r
                                 from-gray-900 to-gray-600 bg-clip-text text-transparent"
                  >
                    ContentFlow
                  </h1>
                  <p className="text-xs text-gray-500">Social Media Manager</p>
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 group"
            >
              <div className="relative">
                {isSidebarOpen ? (
                  <svg
                    className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.href}
                href={route(item.href)}
                active={route().current(item.href)}
                className={`group w-full flex items-center 
                    d-flex 
                    align-center
                    px-4 py-3 text-sm 
                    ${isSidebarOpen ? "" : "justify-center"}
                    font-medium rounded-2xl transition-all duration-300 
                    hover:bg-gradient-to-r 
                    text-gray-700
                    hover:text-red-600
                    hover:bg-orange-50
                    hover:shadow-lg 
                    hover:scale-105 
                    ${
                      route().current(item.href)
                        ? "bg-gradient-to-r from-red-600 to-orange-600  hover:text-white text-white shadow-lg"
                        : "text-gray-700 hover:text-red-600"
                    }`}
              >
                <div
                  className={`flex items-center justify-center rounded-full 
                  h-10  transition-all duration-300 ${
                    route().current(item.href)
                      ? "bg-gradient-to-r  text-white shadow-lg"
                      : "text-gray-700 hover:text-red-600"
                  }`}
                >
                  {isSidebarOpen ? (
                    <span 
                      className="text-lg "
                    >
                      {item.emoji}
                      </span>
                  ) : (
                    <div
                      className={`transition-colors  ${
                        route().current(item.href)
                          ? "bg-gradient-to-r from-red-600 to-orange-600 w-90 text-white shadow-lg"
                          : "text-gray-700 hover:text-red-600"
                      }`}
                    >
                      {item.icon}
                    </div>
                  )}
                </div>

                {isSidebarOpen && (
                  <span className="ml-4 transition-all duration-300">
                    {item.name}
                  </span>
                )}

                {!isSidebarOpen && (
                  <div
                    className="absolute left-full ml-2 px-3 py-2 
                    bg-gray-900 text-white text-sm rounded-lg 
                    opacity-0 group-hover:opacity-100 transition-opacity 
                    duration-200 pointer-events-none whitespace-nowrap 
                    z-50"
                  >
                    {item.name}
                    <div
                      className="absolute left-0 top-1/2 transform 
                    -translate-y-1/2 -translate-x-1 w-2 h-2
                     bg-gray-900 rotate-45"
                    ></div>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200/50">
            <NavLink
              href={route("logout")}
              method="post"
              as="button"
              className="group w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 text-red-600 hover:bg-red-50 hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 group-hover:bg-red-200 transition-all duration-300">
                {isSidebarOpen ? (
                  <span className="text-lg">🚪</span>
                ) : (
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                )}
              </div>

              {isSidebarOpen && (
                <span className="ml-4 transition-all duration-300">
                  Log Out
                </span>
              )}

              {!isSidebarOpen && (
                <div
                  className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white 
                text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
                >
                  Log Out
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </NavLink>
          </div>
        </div>
      </div>
    );
}
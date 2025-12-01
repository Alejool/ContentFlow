import Dropdown from "@/Components/Dropdown";
import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import { Home, User, FileText, BarChart3, Bot, LogOut } from "lucide-react";

interface MobileNavbarProps {
  user: {
    name?: string;
    [key: string]: any;
  };
  showingNavigationDropdown: boolean;
  setShowingNavigationDropdown: (show: boolean) => void;
}

const mobileNavigationItems = [
  { name: "Dashboard", href: "dashboard", lucideIcon: Home },
  { name: "Profile", href: "profile.edit", lucideIcon: User },
  {
    name: "Manage Content",
    href: "manage-content.index",
    lucideIcon: FileText,
  },
  { name: "Analytics", href: "analytics.index", lucideIcon: BarChart3 },
  { name: "AI Chat", href: "ai-chat.index", lucideIcon: Bot },
];

export default function MobileNavbar({
  user,
  showingNavigationDropdown,
  setShowingNavigationDropdown,
}: MobileNavbarProps) {
  return (
    <>
      {/* Navbar for mobile devices */}
      <nav className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 justify-between items-center">
            {/* Menu Button */}
            <button
              onClick={() =>
                setShowingNavigationDropdown(!showingNavigationDropdown)
              }
              className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 group"
            >
              <svg
                className="h-6 w-6 text-gray-700 
                                group-hover:text-blue-600
                                 transition-colors"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  className={
                    !showingNavigationDropdown ? "inline-flex" : "hidden"
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  className={
                    showingNavigationDropdown ? "inline-flex" : "hidden"
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 bg-gradient-to-r 
                                from-red-500 
                                to-orange-700 rounded-xl flex items-center justify-center"
              >
                <span className="text-white font-bold text-lg">MI</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  ContentFlow
                </h1>
              </div>
            </div>

            {/* User Dropdown */}
            <div className="flex items-center">
              <Dropdown>
                <Dropdown.Trigger>
                  <span className="inline-flex rounded-2xl">
                    <button
                      type="button"
                      className="inline-flex items-center 
                                            px-4 py-2 bg-gradient-to-r
                                            from-gray-50 to-gray-100
                                            hover:from-gray-100 
                                            hover:to-gray-200 rounded-2xl 
                                            ml-[55px]
                                            text-sm font-medium text-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div
                        className="w-8 h-8 mr-3 bg-gradient-to-r
                                                 from-red-500 to-orange-700 
                                                 rounded-full flex items-center justify-center "
                      >
                        <span
                          className="text-white 
                                                    text-sm font-bold"
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <span className="hidden sm:block">
                        {user.name || "User"}
                      </span>
                      <svg
                        className="ml-2 h-4 w-4 text-gray-500"
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
                  <Dropdown.Link
                    href={route("profile.edit")}
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Dropdown.Link>
                  <Dropdown.Link
                    href={route("logout")}
                    method="post"
                    as="button"
                    className="flex items-center space-x-2 text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </Dropdown.Link>
                </Dropdown.Content>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Dropdown menu for mobile */}
        <div
          className={`${
            showingNavigationDropdown ? "block" : "hidden"
          } border-t border-gray-200/50 bg-white/95 backdrop-blur-xl`}
        >
          <div className="px-4 py-6 space-y-2">
            {mobileNavigationItems.map((item) => (
              <ResponsiveNavLink
                key={item.href}
                href={route(item.href)}
                active={route().current(item.href)}
                className={`flex items-center 
                                    space-x-3 px-4 py-3 rounded-2xl 
                                    transition-all duration-300
                                     ${
                                       route().current(item.href)
                                         ? "bg-gradient-to-r from-red-600 to-orange-700 text-white shadow-lg"
                                         : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 hover:text-orange-600"
                                     }`}
              >
                <item.lucideIcon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </ResponsiveNavLink>
            ))}

            <div className="pt-4 border-t border-gray-200/50">
              <ResponsiveNavLink
                href={route("logout")}
                method="post"
                as="button"
                className="flex items-center space-x-3 px-4 py-3 rounded-2xl
                                 text-red-600 hover:bg-red-50 transition-all duration-300 w-full"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Log Out</span>
              </ResponsiveNavLink>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

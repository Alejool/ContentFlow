import { Head, Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Bg from "@/../assets/background.svg";
import Logo from "@/../assets/logo.png";

// Component for SVG icons
const CustomIcon = ({ children, className = "" }) => (
  <div
    className={`flex items-center justify-center rounded-full bg-red-50 ${className}`}
  >
    {children}
  </div>
);

// Component for feature cards
const FeatureCard = ({
  href,
  icon,
  title,
  description,
  tags,
  featured = false,
  className = "",
}) => (
  <a
    href={href}
    className={`group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg ring-1 ring-gray-200/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:ring-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:bg-gray-900/80 dark:ring-gray-700/50 dark:hover:ring-red-700 ${className}`}
  >
    {featured && (
      <div className="absolute top-4 right-4 z-10">
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          Featured
        </span>
      </div>
    )}

    <div className="flex items-start gap-4">
      <CustomIcon className="w-12 h-12 shrink-0 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </CustomIcon>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>

        {tags && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <svg
        className="w-5 h-5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  </a>
);

// Component for image gallery
const ImageGallery = () => (
  <div className="relative w-full overflow-hidden rounded-xl">
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-2 row-span-2">
        <img
          src="https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
          alt="Featured collection"
          className="h-48 w-full rounded-lg object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div>
        <img
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
          alt="Thumbnail 1"
          className="h-[5.8rem] w-full rounded-lg object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div>
        <img
          src="https://images.unsplash.com/photo-1523800503107-5bc3ba2a6f81?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
          alt="Thumbnail 2"
          className="h-[5.8rem] w-full rounded-lg object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
      <span className="text-sm font-medium text-white">
        Featured Collection
      </span>
    </div>
  </div>
);

export default function Welcome({ auth }) {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });

  const features = [
    {
      href: "ai-chat",
      icon: (
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      title: "AI Organization",
      description:
        "Easily categorize, tag, and search your multimedia files with AI-powered organization",
      tags: ["Smart Albums", "Auto-Organization", "Custom Tags"],
    },
    {
      href: "manage-content",
      icon: (
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      ),
      title: "Multi-Platform Publishing",
      description:
        "Optimize and seamlessly share content across multiple social media platforms",
    },
    {
      href: "analytics",
      icon: (
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Performance Analytics",
      description:
        "Get insights into your content engagement and optimize your strategy accordingly",
    },
    {
      href: "manage-content",
      icon: (
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Smart Scheduling",
      description:
        "Automate and schedule your posts with AI recommendations for optimal performance",
    },
  ];

  return (
    <>
      <Head title="Welcome" />

      <div
        className="min-h-screen bg-gradient-to-br 
                    from-gray-50 via-white to-red-50 dark:from-gray-900
                     dark:via-gray-800 dark:to-red-900/20
                     text-black"
        style={{
          backgroundImage: `url(${Bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
        }}
      >
        <div className="relative ">
          {/* Header */}
          <header className="relative z-10 bg-gray-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div
                className="flex items-center 
                                px-4
                                justify-between py-6 lg:py-8"
              >
                {/* Logo */}
                <div className="flex items-center">
                  <img
                    src={Logo}
                    alt="Logo"
                    className="h-32 w-auto 
                                        
                                        transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Navigation */}
                <nav className="flex items-center  space-x-4">
                  {auth.user ? (
                    <Link
                      href={route("dashboard")}
                      className="inline-flex items-center rounded-full bg-red-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Enhance Social Media
                    </Link>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Link
                        href={route("login")}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-black transition-colors hover:text-red-600 dark:text-black dark:hover:text-red-400"
                      >
                        Log in
                      </Link>
                      <Link
                        href={route("register")}
                        className="inline-flex items-center rounded-full bg-red-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Hero Section */}
              <div className="text-center py-12 lg:py-20">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:gray-700 sm:text-5xl lg:text-6xl">
                  Manage your content
                  <span className="block text-red-600">
                    with artificial intelligence
                  </span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-800 dark:text-gray-800">
                  Organize, optimize, and schedule your multimedia content with
                  AI-powered tools to maximize your social media presence.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                {/* Featured Card */}
                <div className="lg:row-span-2">
                  <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-lg ring-1 ring-gray-200/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:ring-red-200 dark:bg-gray-900/80 dark:ring-gray-700/50 dark:hover:ring-red-700">
                    <div className="absolute top-6 right-6 z-10">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                        Featured
                      </span>
                    </div>

                    <ImageGallery />

                    <div className="mt-6">
                      <div className="flex items-start gap-4">
                        <CustomIcon className="w-14 h-14 shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-7 h-7 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </CustomIcon>

                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            AI Organization
                          </h3>
                          <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
                            Easily categorize, tag, and search your multimedia
                            files with AI-powered organization
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {[
                              "Smart Albums",
                              "Auto-Organization",
                              "Custom Tags",
                            ].map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Feature Cards */}
                {features.slice(1).map((feature, index) => (
                  <FeatureCard key={index} {...feature} />
                ))}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-10 border-t border-gray-200/50 
           backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-sm text-gray-900 dark:text-gray-400 font-mono">
                  {formattedDate}
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

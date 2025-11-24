import React from "react";

export default function ModernCard({
  title,
  description,
  icon: Icon,
  children,
  headerColor = "blue", // blue, red, green, orange
  className = "",
}) {
  const headerColors = {
    blue: "from-blue-600 to-indigo-700",
    red: "from-red-600 to-orange-700",
    green: "from-green-600 to-emerald-700",
    orange: "from-orange-500 to-red-600",
    purple: "from-purple-600 to-indigo-600",
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}
    >
      {/* Header */}
      <div
        className={`px-8 py-6 bg-gradient-to-r ${headerColors[headerColor]}`}
      >
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {description && (
              <p className="text-white/80 text-sm mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">{children}</div>
    </div>
  );
}

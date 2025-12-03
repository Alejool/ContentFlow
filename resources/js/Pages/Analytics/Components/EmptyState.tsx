import { TrendingUp } from "lucide-react";

interface EmptyStateProps {
  theme?: "light" | "dark";
  title: string;
  description: string;
}

export default function EmptyState({
  theme = "light",
  title,
  description,
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl p-12 text-center transition-colors duration-300
            ${
              theme === "dark"
                ? "bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50"
                : "bg-white shadow-lg border border-gray-100"
            }`}
    >
      <div className="max-w-md mx-auto">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                    ${
                      theme === "dark"
                        ? "bg-neutral-800/50 border border-neutral-700/50"
                        : "bg-gray-100"
                    }`}
        >
          <TrendingUp
            className={`w-8 h-8 ${
              theme === "dark" ? "text-gray-400" : "text-gray-400"
            }`}
          />
        </div>
        <h3
          className={`text-xl font-semibold mb-2
                    ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}
        >
          {title}
        </h3>
        <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
          {description}
        </p>
      </div>
    </div>
  );
}

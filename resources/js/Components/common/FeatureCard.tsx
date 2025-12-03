import { Link } from "@inertiajs/react";
import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

const CustomIcon = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`flex items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-3 ${className}`}
  >
    {children}
  </div>
);

interface FeatureCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  tags?: string[];
  className?: string;
}

export default function FeatureCard({
  href,
  icon,
  title,
  description,
  tags,
  className = "",
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl backdrop-blur-sm p-5 shadow-lg ring-1 ring-gray-200/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:ring-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:bg-gray-900/80 dark:ring-gray-700/50 dark:hover:ring-red-700 ${className}`}
    >
      <div className="flex items-start gap-3">
        <CustomIcon className="w-11 h-11 shrink-0 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </CustomIcon>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {description}
          </p>

          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-100 dark:border-red-800/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0 mt-1" />
      </div>
    </Link>
  );
}

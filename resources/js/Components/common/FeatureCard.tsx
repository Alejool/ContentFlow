import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

const CustomIcon = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div
    className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary-50 to-primary-50 p-3 dark:from-primary-900/20 dark:to-primary-900/20 ${className}`}
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
      className={`group relative overflow-hidden rounded-lg p-5 shadow-lg ring-1 ring-gray-200/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-gray-900/80 dark:ring-gray-700/50 dark:hover:ring-primary-700 ${className}`}
    >
      <div className="flex items-start gap-3">
        <CustomIcon className="h-11 w-11 shrink-0 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </CustomIcon>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {description}
          </p>

          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:border-primary-800/30 dark:bg-primary-900/30 dark:text-primary-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-primary-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    </Link>
  );
}

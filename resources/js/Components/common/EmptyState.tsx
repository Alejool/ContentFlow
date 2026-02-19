import React from "react";

/**
 * Configuration interface for EmptyState component
 * Defines the structure for empty state content and actions
 */
export interface EmptyStateConfig {
    icon: React.ReactNode;
    title: string;
    description: string;
    primaryAction?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
    secondaryActions?: Array<{
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    }>;
    illustration?: string; // URL to illustration image
}

interface EmptyStateProps {
    config: EmptyStateConfig;
    className?: string;
}

/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states throughout the application.
 * Provides consistent UX with icons/illustrations, descriptive messages, and CTAs.
 * 
 * Features:
 * - Responsive design with mobile-friendly layout
 * - Accessibility compliant with semantic HTML and ARIA attributes
 * - Support for both icon and illustration displays
 * - Primary and secondary action buttons
 * - Dark mode support
 * 
 * @param config - Configuration object defining the empty state content
 * @param className - Optional additional CSS classes
 */
const EmptyState: React.FC<EmptyStateProps> = ({ config, className = "" }) => {
    return (
        <div
            className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
            role="status"
            aria-live="polite"
        >
            {/* Icon or Illustration */}
            {config.illustration ? (
                <img
                    src={config.illustration}
                    alt={config.title}
                    className="w-48 h-48 mb-6 object-contain"
                    loading="lazy"
                />
            ) : (
                <div
                    className="w-24 h-24 mb-6 text-gray-400 dark:text-neutral-500"
                    aria-hidden="true"
                >
                    {config.icon}
                </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-2">
                {config.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 dark:text-neutral-400 text-center max-w-md mb-6 leading-relaxed">
                {config.description}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {config.primaryAction && (
                    <button
                        onClick={config.primaryAction.onClick}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors duration-200"
                        aria-label={config.primaryAction.label}
                    >
                        {config.primaryAction.icon && (
                            <span className="w-4 h-4" aria-hidden="true">
                                {config.primaryAction.icon}
                            </span>
                        )}
                        {config.primaryAction.label}
                    </button>
                )}

                {config.secondaryActions?.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors duration-200"
                        aria-label={action.label}
                    >
                        {action.icon && (
                            <span className="w-4 h-4" aria-hidden="true">
                                {action.icon}
                            </span>
                        )}
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EmptyState;

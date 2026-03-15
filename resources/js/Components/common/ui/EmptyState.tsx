interface EmptyStateProps {
  title: string;
  description: string;
  className?: string;
  imageSize?: "sm" | "md" | "lg";
}

export default function EmptyState({
  title,
  description,
  className = "",
  imageSize = "md",
}: EmptyStateProps) {
  const sizeMap = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-64 h-64",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm dark:border-neutral-700/50 dark:bg-neutral-800 ${className}`}
    >
      <div className={`${sizeMap[imageSize]} mb-6 opacity-80 dark:opacity-60`}>
        <img
          src="/assets/empty-state.svg"
          alt="No results"
          className="h-full w-full object-contain"
        />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="mx-auto max-w-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

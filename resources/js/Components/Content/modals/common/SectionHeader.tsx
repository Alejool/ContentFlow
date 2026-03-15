interface SectionHeaderProps {
  title: string;
  className?: string;
}

export const SectionHeader = ({ title, className = "" }: SectionHeaderProps) => {
  return (
    <div
      className={`flex items-start gap-2 border-b border-gray-200 pb-2 dark:border-neutral-700 ${className}`}
    >
      <div className="h-5 w-1 rounded-full bg-primary-500"></div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
        {title}
      </h3>
    </div>
  );
};

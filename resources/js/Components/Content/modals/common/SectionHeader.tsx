interface SectionHeaderProps {
  title: string;
  className?: string;
}

export const SectionHeader = ({ title, className = "" }: SectionHeaderProps) => {
  return (
    <div className={`flex items-start gap-2 pb-2 border-b border-gray-200 dark:border-neutral-700 ${className}`}>
      <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );
};

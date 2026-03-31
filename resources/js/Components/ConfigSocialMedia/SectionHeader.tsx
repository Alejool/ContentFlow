interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
      {title}
    </h3>
  );
}

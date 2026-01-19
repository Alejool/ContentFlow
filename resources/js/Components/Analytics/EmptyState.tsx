import EmptyStateUnified from "@/Components/common/ui/EmptyState";

interface EmptyStateProps {
  theme?: "light" | "dark";
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <EmptyStateUnified
      title={title}
      description={description}
      className="!py-20"
    />
  );
}

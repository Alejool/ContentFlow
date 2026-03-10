import { UnifiedAvatar } from "@/Components/common/UnifiedAvatar";

interface AvatarProps {
  src?: string | null;
  defaultIcon?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
  statusColor?: string;
}

export function Avatar({
  src,
  defaultIcon,
  name = "User",
  size = "md",
  className = "",
  showStatus = false,
  statusColor = "bg-emerald-500",
}: AvatarProps) {
  return (
    <UnifiedAvatar
      src={src}
      defaultIcon={defaultIcon}
      name={name}
      size={size}
      className={className}
      showStatus={showStatus}
      statusColor={statusColor}
    />
  );
}

import defaultProfile from "@/../assets/profile-default.svg";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
  statusColor?: string;
}

export function Avatar({
  src,
  name = "User",
  size = "md",
  className = "",
  showStatus = false,
  statusColor = "bg-emerald-500",
}: AvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-24 h-24 text-2xl",
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`${sizeClasses[size]} relative rounded-full overflow-hidden flex items-center justify-center font-bold`}
      >
        <img
          src={src || defaultProfile}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== defaultProfile) {
              img.src = defaultProfile;
            }
          }}
        />
      </div>
      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 ${
            size === "xs" || size === "sm"
              ? "w-2 h-2"
              : size === "md" || size === "lg"
                ? "w-3 h-3"
                : "w-4 h-4"
          } ${statusColor} border-2 border-white dark:border-neutral-900 rounded-full shadow-sm`}
        ></div>
      )}
    </div>
  );
}

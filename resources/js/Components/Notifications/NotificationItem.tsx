import { useTheme } from "@/Hooks/useTheme";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const { theme } = useTheme();
  const { data, created_at, read_at } = notification;
  const isRead = !!read_at;

  const getIcon = () => {
    switch (data.status) {
      case "published":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
      case "failed":
        return <X className="w-5 h-5 text-red-500" />;
      case "restricted":
      case "copyright_claim":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div
      className={`p-4 border-b transition-colors cursor-pointer relative ${
        theme === "dark"
          ? "border-neutral-800 hover:bg-neutral-800/50"
          : "border-gray-100 hover:bg-gray-50"
      } ${
        !isRead
          ? theme === "dark"
            ? "bg-neutral-800/30"
            : "bg-blue-50/50"
          : ""
      }`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className="mt-1 flex-shrink-0">{getIcon()}</div>
        <div className="flex-1">
          <h4
            className={`text-sm font-semibold mb-1 ${
              theme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {data.message}
          </h4>
          <p
            className={`text-xs mb-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {data.title}
          </p>
          <span
            className={`text-xs ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </span>
        </div>
        {!isRead && (
          <div className="mt-2 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

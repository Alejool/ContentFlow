import DynamicIcon from "@/Components/Notifications/DynamicIcon";
import { useTheme } from "@/Hooks/useTheme";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ImageOff,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // Guard against undefined notification
  if (!notification?.id) {
    return null;
  }
  
  const { data, created_at, read_at } = notification;
  const isRead = !!read_at;
  const [imageError, setImageError] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getIcon = () => {
    // If there's an explicit icon from system notifications
    if (data.icon) {
      return (
        <DynamicIcon
          name={data.icon}
          className={`w-4 h-4 ${getStatusColor()}`}
          fallback={<Info className="w-4 h-4 text-blue-500" />}
        />
      );
    }

    switch (data.status) {
      case "success":
      case "published":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "deleted":
        return <X className="w-4 h-4 text-gray-500" />;
      case "rejected":
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "restricted":
      case "copyright_claim":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        // Try mapping the type if status is not available
        if (data.type === "success")
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (data.type === "error")
          return <XCircle className="w-4 h-4 text-red-500" />;
        if (data.type === "warning")
          return <AlertTriangle className="w-4 h-4 text-amber-500" />;

        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    // Use data.type if status is missing (common in SystemNotifications)
    const status = data.status || data.type;

    switch (status) {
      case "success":
      case "published":
        return theme === "dark" ? "text-green-400" : "text-green-600";
      case "deleted":
        return theme === "dark" ? "text-gray-400" : "text-gray-600";
      case "rejected":
      case "failed":
      case "error":
        return theme === "dark" ? "text-red-400" : "text-red-600";
      case "warning":
      case "restricted":
      case "copyright_claim":
        return theme === "dark" ? "text-amber-400" : "text-amber-600";
      default:
        return theme === "dark" ? "text-blue-400" : "text-blue-600";
    }
  };

  return (
    <div
      className={`p-3 sm:p-4 border-b border-color border-gray-200 transition-all duration-200 cursor-pointer relative group  ${
        theme === "dark"
          ? "border-neutral-800 hover:bg-neutral-800/50"
          : "border-gray-100 hover:bg-gray-50"
      } ${
        !isRead
          ? theme === "dark"
            ? "bg-primary-900/10"
            : "bg-primary-50/50"
          : ""
      }`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex gap-2 sm:gap-3 items-start">
        <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {/* Show title as heading if available */}
            {data.title && (
              <p
                className={`text-sm font-semibold mb-1 ${
                  theme === "dark" ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {data.title}
              </p>
            )}
            
            {/* Show message as main content */}
            {data.message && (
              <p
                className={`text-sm mb-1 break-words ${isExpanded ? "" : "line-clamp-2"} ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {data.message}
              </p>
            )}

            {data.message && data.message.length > 100 && (
              <span
                className={`text-xs hover:underline cursor-pointer ${
                  theme === "dark" ? "text-primary-400" : "text-primary-600"
                }`}
              >
                {isExpanded
                  ? t("common.show_less")
                  : t("common.read_more")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            {data.description && (
              <p
                className={`text-xs mb-1.5 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {data.description}
              </p>
            )}

            {data.account_name && (
              <p
                className={`text-xs mb-1 font-medium ${
                  theme === "dark" ? "text-primary-400" : "text-primary-600"
                }`}
              >
                {data.account_name}
              </p>
            )}

            {data.publication_title && (
              <>
                <span
                  className={`text-xs font-medium ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {data.publication_title}
                </span>
                <span
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  •
                </span>
              </>
            )}

            {data.campaign_name && (
              <>
                <span
                  className={`text-xs italic ${
                    theme === "dark" ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  {data.campaign_name}
                </span>
                <span
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  •
                </span>
              </>
            )}
            {data.platform && (
              <>
                <span className={`text-xs capitalize ${getStatusColor()}`}>
                  {data.platform}
                </span>
                <span
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  •
                </span>
              </>
            )}
            <span
              className={`text-xs ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {created_at && !isNaN(new Date(created_at).getTime())
                ? formatDistanceToNow(new Date(created_at), { addSuffix: true })
                : ""}
            </span>
          </div>

          {/* Orphaned Posts List */}
          {data.orphaned_posts_list && data.orphaned_posts_list.length > 0 && (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                theme === "dark" ? "bg-neutral-800" : "bg-gray-100"
              }`}
            >
              <p
                className={`font-semibold mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {theme === "dark"
                  ? "Publicaciones afectadas:"
                  : "Affected publications:"}
              </p>
              <ul
                className={`list-disc list-inside ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {data.orphaned_posts_list
                  .slice(0, 3)
                  .map((title: string, index: number) => (
                    <li key={index} className="truncate">
                      {title}
                    </li>
                  ))}
                {data.orphaned_posts_list.length > 3 && (
                  <li className="list-none pt-1 opacity-75">
                    + {data.orphaned_posts_list.length - 3}{" "}
                    {theme === "dark" ? "más..." : "more..."}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {data.thumbnail_url && !imageError && (
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden flex-shrink-0 ${
              theme === "dark" ? "bg-neutral-800" : "bg-gray-100"
            }`}
          >
            <img
              src={data.thumbnail_url}
              alt={data.publication_title || "Thumbnail"}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        )}

        {data.thumbnail_url && imageError && (
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-md flex items-center justify-center flex-shrink-0 ${
              theme === "dark" ? "bg-neutral-800" : "bg-gray-100"
            }`}
          >
            <ImageOff
              className={`w-6 h-6 ${
                theme === "dark" ? "text-neutral-600" : "text-gray-400"
              }`}
            />
          </div>
        )}

        {!isRead && (
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

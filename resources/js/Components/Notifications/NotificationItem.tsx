import { useTheme } from "@/Hooks/useTheme";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, ImageOff, Info, X } from "lucide-react";
import { useState } from "react";

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
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    switch (data.status) {
      case "success":
      case "published":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "deleted":
        return <X className="w-4 h-4 text-gray-500" />;
      case "rejected":
      case "failed":
      case "error":
        return <X className="w-4 h-4 text-red-500" />;
      case "restricted":
      case "copyright_claim":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case "success":
      case "published":
        return theme === "dark" ? "text-green-400" : "text-green-600";
      case "deleted":
        return theme === "dark" ? "text-gray-400" : "text-gray-600";
      case "rejected":
      case "failed":
      case "error":
        return theme === "dark" ? "text-red-400" : "text-red-600";
      case "restricted":
      case "copyright_claim":
        return theme === "dark" ? "text-amber-400" : "text-amber-600";
      default:
        return theme === "dark" ? "text-blue-400" : "text-blue-600";
    }
  };

  return (
    <div
      className={`p-3 border-b transition-all duration-200 cursor-pointer relative group ${
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
      <div className="flex gap-3 items-start">
        <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <p
              className={`text-sm mb-1 ${isExpanded ? "" : "line-clamp-2"} ${
                theme === "dark" ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {data.message || data.title}
            </p>
            {/* Show 'Read more' hint if likely truncated (this is an approximation, real detection needs refs) */}
            {(data.message || data.title).length > 100 && (
              <span
                className={`text-xs hover:underline cursor-pointer ${
                  theme === "dark" ? "text-primary-400" : "text-primary-600"
                }`}
              >
                {isExpanded
                  ? theme === "dark"
                    ? "Menos"
                    : "Less"
                  : theme === "dark"
                  ? "Leer más"
                  : "Read more"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
            className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 ${
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
            className={`w-16 h-16 rounded-md flex items-center justify-center flex-shrink-0 ${
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

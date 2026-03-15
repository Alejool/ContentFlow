import DynamicIcon from "@/Components/Notifications/DynamicIcon";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
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

  // Guard against undefined notification
  if (!notification?.id) {
    return null;
  }

  const { data, created_at, read_at } = notification;
  const isRead = !!read_at;
  const [imageError, setImageError] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getStatusColor = () => {
    const status = data.status || data.type;

    switch (status) {
      case "success":
      case "published":
        return "text-green-600 dark:text-green-400";
      case "deleted":
        return "text-gray-600 dark:text-gray-400";
      case "rejected":
      case "failed":
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
      case "restricted":
      case "copyright_claim":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getIcon = () => {
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
        if (data.type === "success")
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (data.type === "error")
          return <XCircle className="w-4 h-4 text-red-500" />;
        if (data.type === "warning")
          return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <motion.div
      layout
      className={`p-3 sm:p-4 border-b border-gray-200 dark:border-neutral-800 transition-colors duration-200 cursor-pointer relative group hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${
        !isRead ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
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
            {data.title && (
              <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">
                {data.title}
              </p>
            )}

            {data.message && (
              <AnimatePresence initial={false}>
                <motion.p
                  key={isExpanded ? "expanded" : "collapsed"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`text-sm mb-1 break-words text-gray-700 dark:text-gray-200 ${
                    isExpanded ? "" : "line-clamp-2"
                  }`}
                >
                  {data.message}
                </motion.p>
              </AnimatePresence>
            )}

            {data.message && data.message.length > 100 && (
              <span className="text-xs hover:underline cursor-pointer text-primary-600 dark:text-primary-400">
                {isExpanded ? t("common.show_less") : t("common.read_more")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            {data.description && (
              <p className="text-xs mb-1.5 text-gray-500 dark:text-gray-400">
                {data.description}
              </p>
            )}

            {data.account_name && (
              <p className="text-xs mb-1 font-medium text-primary-600 dark:text-primary-400">
                {data.account_name}
              </p>
            )}

            {data.publication_title && (
              <>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {data.publication_title}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  •
                </span>
              </>
            )}

            {data.campaign_name && (
              <>
                <span className="text-xs italic text-gray-500">
                  {data.campaign_name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  •
                </span>
              </>
            )}

            {data.platform && (
              <>
                <span className={`text-xs capitalize ${getStatusColor()}`}>
                  {data.platform}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  •
                </span>
              </>
            )}

            <span className="text-xs text-gray-400 dark:text-gray-500">
              {created_at && !isNaN(new Date(created_at).getTime())
                ? formatDistanceToNow(new Date(created_at), { addSuffix: true })
                : ""}
            </span>
          </div>

          {data.orphaned_posts_list && data.orphaned_posts_list.length > 0 && (
            <div className="mt-2 p-2 rounded text-xs bg-gray-100 dark:bg-neutral-800">
              <p className="font-semibold mb-1 text-gray-700 dark:text-gray-300">
                {t("common.affected_publications")}
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
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
                    {t("common.more_items")}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {data.thumbnail_url && !imageError && (
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-neutral-800">
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
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-neutral-800">
            <ImageOff className="w-6 h-6 text-gray-400 dark:text-neutral-600" />
          </div>
        )}

        {!isRead && (
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
        )}
      </div>
    </motion.div>
  );
}

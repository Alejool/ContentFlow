import { useTheme } from "@/Hooks/useTheme";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Log {
  id: number;
  created_at: string;
  platform: string;
  status: "success" | "failed" | "pending" | "published";
  message?: string;
  error_message?: string;
  campaign?: { name: string };
  publication?: { title: string };
  social_account?: { name: string; username: string; platform: string };
}

export default function LogsList() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/social-logs?page=${page}`);
      if (response.data.success) {
        setLogs(response.data.logs.data);
        setLastPage(response.data.logs.last_page);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-lg border transition-all duration-300 backdrop-blur-lg ${
        theme === "dark"
          ? "bg-neutral-800/70 border-neutral-700/70 text-white"
          : "bg-white/70 border-gray-100/70 text-gray-900"
      }`}
    >
      <div className="p-6 border-b border-gray-100 dark:border-neutral-700/50 flex justify-between items-center">
        <h2 className="text-xl font-bold">Activity Logs</h2>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead
            className={`${
              theme === "dark"
                ? "bg-neutral-800/90 border-neutral-700"
                : "bg-gray-50/90 border-gray-100"
            } border-b`}
          >
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Platform</th>
              <th className="px-6 py-4 font-semibold">Source</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Message</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              theme === "dark" ? "divide-neutral-700/50" : "divide-gray-100"
            }`}
          >
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className={`group transition-colors ${
                    theme === "dark"
                      ? "hover:bg-neutral-700/30"
                      : "hover:bg-gray-50/50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">
                        {log.platform}
                      </span>
                      {log.social_account && (
                        <span className="text-xs text-gray-400">
                          ({log.social_account.username})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {log.campaign && (
                        <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded w-fit mb-1">
                          Campaign: {log.campaign.name}
                        </span>
                      )}
                      {log.publication && (
                        <span className="text-xs text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded w-fit">
                          Pub: {log.publication.title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="capitalize">{log.status}</span>
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 max-w-xs truncate text-gray-500"
                    title={log.error_message || log.message}
                  >
                    {log.error_message || log.message || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <div className="p-4 flex justify-between items-center text-sm border-t border-gray-100 dark:border-neutral-700">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {lastPage}
          </span>
          <button
            disabled={page === lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

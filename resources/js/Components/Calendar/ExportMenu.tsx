import Button from "@/Components/common/Modern/Button";
import { Download, Calendar as CalendarIcon } from "lucide-react";
import React, { useState } from "react";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axios from "axios";

interface ExportMenuProps {
  events: any[];
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ events }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: "google" | "outlook") => {
    setIsExporting(true);
    try {
      const response = await axios.post(
        route(`api.v1.calendar.export.${type}`),
        {
          events: events.map((e) => ({
            title: e.title,
            start: e.start,
            end: e.end,
            description: `Status: ${e.status}`,
          })),
        },
      );

      if (response.data.data?.url) {
        window.open(response.data.data.url, "_blank");
        toast.success(
          `Calendario exportado exitosamente a ${type === "google" ? "Google Calendar" : "Outlook"}`,
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Error al exportar a ${type === "google" ? "Google Calendar" : "Outlook"}`,
      );
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || events.length === 0}
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Exportar calendario
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {events.length} eventos
              </p>
            </div>

            <div className="p-2">
              <button
                onClick={() => handleExport("google")}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <FaGoogle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Google Calendar
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Exportar como archivo .ics
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleExport("outlook")}
                disabled={isExporting}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FaMicrosoft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Outlook Calendar
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Exportar como archivo .ics
                  </div>
                </div>
              </button>

              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    El archivo .ics se puede importar en cualquier aplicación de
                    calendario compatible
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import Button from '@/Components/common/Modern/Button';
import toast from '@/Utils/toast';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Download, FileSpreadsheet, FileText, Info } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ExportButtonsProps {
  endpoint: string;
  filters?: Record<string, any>;
  className?: string;
  showHistoryInfo?: boolean;
}

export default function ExportButtons({
  endpoint,
  filters = {},
  className = '',
  showHistoryInfo = true,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [historyDays, setHistoryDays] = useState<number | null>(null);
  const { t } = useTranslation();

  const { props } = usePage<any>();

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    setIsExporting(true);

    try {
      const response = await axios.get(endpoint, {
        params: { ...filters, format },
        responseType: 'blob',
      });

      // Extract history limit info from headers (this is the source of truth)
      const historyDaysHeader = response.headers['x-export-history-days'];
      const startDate = response.headers['x-export-start-date'];

      if (historyDaysHeader) {
        const days = parseInt(historyDaysHeader);
        setHistoryDays(days); // Update with actual value from backend

        if (showHistoryInfo && startDate) {
          const formattedDate = new Date(startDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          toast.success(
            t('common.exportCompleted', {
              defaultValue: 'Exportación completada. Datos de los últimos {{days}} días (desde {{date}})',
              days,
              date: formattedDate,
            }),
            { duration: 5000 }
          );
        }
      } else {
        toast.success(t('common.exportCompleted', { defaultValue: 'Exportación completada' }));
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `export_${Date.now()}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('common.exportError', { defaultValue: 'Error al exportar. Por favor, intenta de nuevo.' }));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex flex-col items-end gap-2 ${className}`}>
      <div className="flex gap-2">
        <Button
          onClick={() => handleExport('xlsx')}
          disabled={isExporting}
          variant="ghost"
          buttonStyle="outline"
          size="sm"
          icon={FileSpreadsheet}
          className="flex items-center gap-2"
        >
          Excel
        </Button>

        <Button
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          variant="ghost"
          buttonStyle="outline"
          size="sm"
          icon={FileText}
          className="flex items-center gap-2"
        >
          CSV
        </Button>

        <Button
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          variant="ghost"
          buttonStyle="outline"
          size="sm"
          icon={Download}
          className="flex items-center gap-2"
        >
          PDF
        </Button>
      </div>
      {showHistoryInfo && historyDays && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Info className="h-3 w-3" />
          <span>
            {historyDays === 365
              ? t('pricing.features.exportHistoryLimitYear', {
                  days: historyDays,
                  defaultValue: 'Tu plan permite exportar hasta {{days}} días de historial (1 año)',
                })
              : t('pricing.features.exportHistoryLimit', {
                  days: historyDays,
                  defaultValue: 'Tu plan permite exportar hasta {{days}} días de historial',
                })}
          </span>
        </div>
      )}
    </div>
  );
}

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import Button from "@/Components/common/Modern/Button";
import axios from "axios";
import toast from "@/Utils/toast";

interface ExportButtonsProps {
    endpoint: string;
    filters?: Record<string, any>;
    className?: string;
}

export default function ExportButtons({ endpoint, filters = {}, className = "" }: ExportButtonsProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
        setIsExporting(true);
        
        try {
            const response = await axios.get(endpoint, {
                params: { ...filters, format },
                responseType: 'blob',
            });

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
            toast.error('Error al exportar. Por favor, intenta de nuevo.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <Button
                onClick={() => handleExport('xlsx')}
                disabled={isExporting}
                variant="ghost"
                size="md"
                icon={FileSpreadsheet}
                className="flex items-center gap-2"
            >
                Excel
            </Button>
            
            <Button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                variant="ghost"
                size="md"
                icon={FileText}
                className="flex items-center gap-2"
            >
                CSV
            </Button>
            
            <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                variant="ghost"
                size="md"
                icon={Download}
                className="flex items-center gap-2"
            >
                PDF
            </Button>
        </div>
    );
}

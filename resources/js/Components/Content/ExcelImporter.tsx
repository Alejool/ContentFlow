import Button from '@/Components/common/Modern/Button';
import Modal from '@/Components/common/ui/Modal';
import ModalFooter from '@/Components/Content/modals/common/ModalFooter';
import ModalHeader from '@/Components/Content/modals/common/ModalHeader';
import axios from 'axios';
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ExcelImporterProps {
  type: 'publications' | 'campaigns';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    success_count: number;
    failed_count: number;
    total: number;
  };
  errors?: Array<{
    row: number;
    errors: string[];
  }>;
}

export default function ExcelImporter({ type, isOpen, onClose, onSuccess, t }: ExcelImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const endpoint = `/api/v1/excel/templates/${type}`;
      const response = await axios.get(endpoint, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plantilla_${type}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('excel.templateDownloaded') || 'Plantilla descargada correctamente');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('excel.downloadError') || 'Error al descargar la plantilla');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error(t('excel.invalidFileType') || 'Tipo de archivo inválido. Use .xlsx, .xls o .csv');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(t('excel.fileTooLarge') || 'El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(t('excel.noFileSelected') || 'Por favor selecciona un archivo');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = `/api/v1/excel/import/${type}`;
      const response = await axios.post<ImportResult>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);

      if (response.data.success && response.data.data?.failed_count === 0) {
        toast.success(
          `${t('excel.importSuccess') || 'Importación exitosa'}: ${response.data.data.success_count} ${type === 'publications' ? t('excel.publications') || 'publicaciones' : t('excel.campaigns') || 'campañas'}`,
        );
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else if (response.data.data?.failed_count > 0) {
        toast.error(
          `${t('excel.importPartial') || 'Importación parcial'}: ${response.data.data.success_count} ${t('excel.successful') || 'exitosos'}, ${response.data.data.failed_count} ${t('excel.failed') || 'fallidos'}`,
        );
      }
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t('excel.importError') ||
        'Error al importar el archivo';
      toast.error(errorMessage);
      setResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setIsDragging(false);
    onClose();
  };

  const getTitle = () => {
    return type === 'publications'
      ? t('excel.importPublications') || 'Importar Publicaciones'
      : t('excel.importCampaigns') || 'Importar Campañas';
  };

  return (
    <Modal show={isOpen} onClose={handleClose} maxWidth="2xl">
      <ModalHeader
        t={t}
        onClose={handleClose}
        title={getTitle()}
        icon={FileSpreadsheet}
        iconColor="text-green-500"
        size="lg"
      />

      <div className="space-y-6 p-6">
        {/* Download Template Section */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h3 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-300">
                {t('excel.downloadTemplateTitle') || 'Paso 1: Descarga la plantilla'}
              </h3>
              <p className="mb-3 text-xs text-blue-700 dark:text-blue-400">
                {t('excel.downloadTemplateDesc') ||
                  'Descarga la plantilla oficial con el formato correcto y ejemplos.'}
              </p>
              <Button
                onClick={handleDownloadTemplate}
                variant="primary"
                size="sm"
                icon={Download}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('excel.downloadTemplate') || 'Descargar Plantilla'}
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {t('excel.uploadFileTitle') || 'Paso 2: Sube tu archivo'}
          </h3>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`group relative cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'scale-[1.02] ring-2 ring-primary-500 ring-offset-2 dark:ring-primary-400'
                : ''
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              className={`flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                  : 'border-gray-300 bg-gray-50 hover:border-primary-400 dark:border-gray-600 dark:bg-neutral-900/90 dark:hover:border-primary-500'
              }`}
            >
              {!file ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary-500/10 blur-xl dark:bg-primary-400/10"></div>
                    <div className="relative rounded-full bg-white p-4 shadow-lg dark:bg-neutral-800">
                      <Upload className="h-10 w-10 text-primary-500 dark:text-primary-400" />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-base font-medium text-gray-900 dark:text-white">
                      {t('excel.dragDropText') || 'Arrastra tu archivo aquí'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('excel.orClickToSelect') || 'o haz clic para seleccionar'}
                    </p>
                  </div>
                  <div className="pt-2">
                    <p className="inline-block rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-500 dark:bg-neutral-800 dark:text-gray-500">
                      {t('excel.supportedFormats') || 'Formatos: .xlsx, .xls, .csv (Máx. 10MB)'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-green-500/10 blur-xl dark:bg-green-400/10"></div>
                    <div className="relative mx-auto w-fit rounded-full bg-white p-4 shadow-lg dark:bg-neutral-800">
                      <FileSpreadsheet className="h-10 w-10 text-green-500 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div
            className={`rounded-lg p-4 ${
              result.success && result.data?.failed_count === 0
                ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : result.data?.failed_count && result.data.failed_count > 0
                  ? 'border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                  : 'border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success && result.data?.failed_count === 0 ? (
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {result.message}
                </h4>

                {result.data && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('excel.successful') || 'Exitosos'}:
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {result.data.success_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('excel.failed') || 'Fallidos'}:
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {result.data.failed_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('excel.total') || 'Total'}:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {result.data.total}
                      </span>
                    </div>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
                    <h5 className="text-xs font-semibold text-gray-900 dark:text-white">
                      {t('excel.errors') || 'Errores encontrados'}:
                    </h5>
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="rounded bg-white p-2 text-xs dark:bg-gray-800">
                        <p className="mb-1 font-semibold text-red-600 dark:text-red-400">
                          {t('excel.row') || 'Fila'} {error.row}:
                        </p>
                        <ul className="list-inside list-disc space-y-0.5 text-gray-600 dark:text-gray-400">
                          {error.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter
        onClose={handleClose}
        onPrimarySubmit={handleImport}
        submitText={t('excel.import') || 'IMPORTAR'}
        cancelText={t('common.cancel') || 'CANCELAR'}
        submitVariant="primary"
        submitIcon={<Upload className="h-4 w-4" />}
        isLoading={isUploading}
        submitDisabled={!file || isUploading}
      />
    </Modal>
  );
}

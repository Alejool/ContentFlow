import Button from '@/Components/common/Modern/Button';
import Modal from '@/Components/common/ui/Modal';
import ModalFooter from '@/Components/Content/modals/common/ModalFooter';
import ModalHeader from '@/Components/Content/modals/common/ModalHeader';
import { useJsonImport } from '@/Hooks/useJsonImport';
import { AlertCircle, CheckCircle, Download, FileJson, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface JsonImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}

export default function JsonImporter({ isOpen, onClose, onSuccess, t }: JsonImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importFile, isImporting, result, reset, downloadTemplate } = useJsonImport();

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
      toast.success(t('jsonImport.templateDownloaded') || 'Plantilla descargada correctamente');
    } catch {
      toast.error(t('jsonImport.downloadError') || 'Error al descargar la plantilla');
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const isJson =
      selectedFile.type === 'application/json' || selectedFile.name.toLowerCase().endsWith('.json');

    if (!isJson) {
      toast.error(t('jsonImport.invalidFileType') || 'Tipo de archivo inválido. Use .json');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(t('jsonImport.fileTooLarge') || 'El archivo es demasiado grande. Máximo 10MB');
      return;
    }
    setFile(selectedFile);
    reset();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(t('jsonImport.noFileSelected') || 'Por favor selecciona un archivo');
      return;
    }
    try {
      const response = await importFile(file);
      if (response.success) {
        toast.success(
          `${t('jsonImport.importSuccess') || 'Importación exitosa'}: ${response.data?.success_count ?? 0}`,
        );
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        toast.error(t('jsonImport.importPartial') || 'Importación completada con errores');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t('jsonImport.importError') ||
          'Error al importar el archivo',
      );
    }
  };

  const handleClose = () => {
    setFile(null);
    setIsDragging(false);
    reset();
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={handleClose} maxWidth="2xl">
      <ModalHeader
        t={t}
        onClose={handleClose}
        title={t('jsonImport.title') || 'Importar desde JSON'}
        icon={FileJson}
        iconColor="text-amber-500"
        size="lg"
      />

      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h3 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-300">
                {t('jsonImport.downloadTemplateTitle') || 'Paso 1: Descarga la plantilla'}
              </h3>
              <p className="mb-3 text-xs text-blue-700 dark:text-blue-400">
                {t('jsonImport.downloadTemplateDesc') ||
                  'Descarga el JSON de ejemplo con publicaciones únicas y campañas con publicaciones anidadas.'}
              </p>
              <Button
                onClick={handleDownloadTemplate}
                variant="primary"
                size="sm"
                icon={Download}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t('jsonImport.downloadTemplate') || 'Descargar Plantilla'}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {t('jsonImport.uploadFileTitle') || 'Paso 2: Sube tu archivo JSON'}
          </h3>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`flex min-h-4 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300 ${
              isDragging
                ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                : 'hover:border-primary-400 dark:hover:border-primary-500 border-gray-300 bg-gray-50 dark:border-neutral-600 dark:bg-theme-bg-secondary'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) validateAndSetFile(selected);
              }}
              className="hidden"
            />
            {!file ? (
              <div className="space-y-3">
                <Upload className="text-primary-500 dark:text-primary-400 mx-auto h-10 w-10" />
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {t('jsonImport.dragDropText') || 'Arrastra tu archivo .json aquí'}
                </p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {t('jsonImport.supportedFormats') || 'Formato: .json (Máx. 10MB)'}
                </p>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-theme-bg-secondary">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileJson className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    reset();
                  }}
                  className="ml-3 shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div
            className={`rounded-lg border p-4 ${
              result.success
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {result.message}
                </h4>
                {result.data && (
                  <p className="text-xs text-gray-600 dark:text-neutral-400">
                    {t('jsonImport.successful') || 'Exitosos'}:{' '}
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {result.data.success_count}
                    </span>{' '}
                    · {t('jsonImport.failed') || 'Fallidos'}:{' '}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {result.data.failed_count}
                    </span>{' '}
                    · {t('jsonImport.total') || 'Total'}: {result.data.total}
                  </p>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="rounded bg-white p-2 text-xs dark:bg-neutral-800">
                        <p className="mb-1 font-semibold text-red-600 dark:text-red-400">
                          {error.path}
                        </p>
                        <ul className="list-inside list-disc space-y-0.5 text-gray-600 dark:text-neutral-400">
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
        submitText={t('jsonImport.import') || 'IMPORTAR'}
        cancelText={t('common.cancel') || 'CANCELAR'}
        submitVariant="primary"
        submitIcon={<Upload className="h-4 w-4" />}
        isSubmitting={isImporting}
        disableSubmit={!file || isImporting}
      />
    </Modal>
  );
}

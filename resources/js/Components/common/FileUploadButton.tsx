import { Upload } from 'lucide-react';
import React, { useRef } from 'react';

interface FileUploadButtonProps {
  /**
   * Tipos de archivo aceptados (MIME types separados por coma)
   * @example "image/jpeg,image/png,image/webp"
   */
  accept?: string;

  /**
   * Permitir selección múltiple de archivos
   */
  multiple?: boolean;

  /**
   * Callback cuando se seleccionan archivos
   */
  onChange: (files: FileList | null) => void;

  /**
   * Texto del botón
   */
  label?: string;

  /**
   * Estado de carga/procesamiento
   */
  loading?: boolean;

  /**
   * Texto cuando está cargando
   */
  loadingLabel?: string;

  /**
   * Deshabilitar el botón
   */
  disabled?: boolean;

  /**
   * ID único para el input (opcional, se genera automáticamente si no se proporciona)
   */
  id?: string;

  /**
   * Clases CSS adicionales para el label/botón
   */
  className?: string;

  /**
   * Variante del botón
   */
  variant?: 'primary' | 'secondary' | 'ghost';

  /**
   * Tamaño del botón
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Icono personalizado (componente Lucide)
   */
  icon?: React.ComponentType<{ size?: number; className?: string }>;

  /**
   * Mostrar icono
   */
  showIcon?: boolean;
}

/**
 * Componente reutilizable para selección de archivos con estilo consistente
 *
 * @example
 * // Uso básico para imágenes
 * <FileUploadButton
 *   accept="image/jpeg,image/png,image/webp"
 *   onChange={handleFileChange}
 *   label="Elegir Imagen"
 * />
 *
 * @example
 * // Con estado de carga
 * <FileUploadButton
 *   accept="image/*"
 *   onChange={handleFileChange}
 *   loading={isUploading}
 *   loadingLabel="Subiendo..."
 * />
 *
 * @example
 * // Múltiples archivos
 * <FileUploadButton
 *   accept="image/*,video/*"
 *   multiple
 *   onChange={handleFileChange}
 *   label="Seleccionar Archivos"
 * />
 */
export default function FileUploadButton({
  accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
  multiple = false,
  onChange,
  label = 'Elegir Archivo',
  loading = false,
  loadingLabel = 'Subiendo...',
  disabled = false,
  id,
  className = '',
  variant = 'primary',
  size = 'md',
  icon: Icon = Upload,
  showIcon = true,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useRef(`file-upload-${Math.random().toString(36).substr(2, 9)}`);
  const inputId = id || generatedId.current;

  const isDisabled = disabled || loading;

  // Estilos base según variante
  const variantStyles = {
    primary:
      'border-2 border-primary-600 bg-transparent text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
    secondary:
      'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-gray-500',
    ghost:
      'border-2 border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-gray-500',
  };

  // Estilos de tamaño
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const buttonClasses = `
    inline-flex items-center justify-center gap-2 rounded-lg
    font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ');

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onChange(e.target.files)}
        className="hidden"
        id={inputId}
        disabled={isDisabled}
      />
      <label htmlFor={isDisabled ? undefined : inputId} className={buttonClasses}>
        {showIcon && Icon && <Icon size={iconSizes[size]} />}
        {loading ? loadingLabel : label}
      </label>
    </>
  );
}

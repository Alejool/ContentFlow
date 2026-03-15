import { Alert, AlertDescription } from "@/Components/ui/alert";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";
import React from "react";

/**
 * AlertCard - Componente de alerta reutilizable con diferentes tipos
 *
 * @example
 * // Alerta de información
 * <AlertCard type="info" message="Información importante" />
 *
 * // Alerta de advertencia con título
 * <AlertCard
 *   type="warning"
 *   title="Advertencia"
 *   message="Los cambios afectan a todo el sistema"
 * />
 *
 * // Alerta de advertencia amber (más intensa)
 * <AlertCard
 *   type="amber"
 *   title="Atención"
 *   message="Sesión duplicada detectada"
 * />
 *
 * // Alerta de éxito
 * <AlertCard type="success" message="Operación completada exitosamente" />
 *
 * // Alerta de error
 * <AlertCard type="error" message="Ha ocurrido un error" />
 *
 * // Alerta de peligro
 * <AlertCard type="danger" title="Peligro" message="Acción irreversible" />
 */

interface AlertCardProps {
  type?: "warning" | "info" | "success" | "error" | "danger" | "amber";
  title?: string;
  message: string | React.ReactNode;
  className?: string;
}

export default function AlertCard({
  type = "info",
  title,
  message,
  className,
}: AlertCardProps) {
  const config = {
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      textColor: "text-yellow-800 dark:text-yellow-300",
      titleColor: "text-yellow-900 dark:text-yellow-200",
    },
    amber: {
      icon: AlertCircle,
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-500",
      iconColor: "text-amber-500",
      textColor: "text-amber-700 dark:text-amber-300",
      titleColor: "text-amber-700 dark:text-amber-300",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
      textColor: "text-blue-800 dark:text-blue-300",
      titleColor: "text-blue-900 dark:text-blue-200",
    },
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      iconColor: "text-green-600 dark:text-green-400",
      textColor: "text-green-800 dark:text-green-300",
      titleColor: "text-green-900 dark:text-green-200",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      iconColor: "text-red-600 dark:text-red-400",
      textColor: "text-red-800 dark:text-red-300",
      titleColor: "text-red-900 dark:text-red-200",
    },
    danger: {
      icon: AlertCircle,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      iconColor: "text-red-600 dark:text-red-400",
      textColor: "text-red-800 dark:text-red-300",
      titleColor: "text-red-900 dark:text-red-200",
    },
  };

  const {
    icon: Icon,
    bgColor,
    borderColor,
    iconColor,
    textColor,
    titleColor,
  } = config[type];

  return (
    <Alert className={cn(bgColor, borderColor, "shadow-sm", className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />
        <div className="flex-1">
          {title && (
            <p className={cn("font-semibold mb-1", titleColor)}>{title}</p>
          )}
          <AlertDescription className={cn("text-sm", textColor)}>
            {message}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

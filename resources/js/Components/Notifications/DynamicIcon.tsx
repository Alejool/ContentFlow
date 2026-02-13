import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Info,
  Layers,
  Megaphone,
  Settings,
  X,
  XCircle,
} from "lucide-react";
import React from "react";

export const ICON_MAP: Record<string, any> = {
  Bell,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Megaphone,
  Layers,
  Settings,
  Clock,
  X,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function DynamicIcon({
  name,
  className,
  fallback,
}: DynamicIconProps) {
  const IconComponent = ICON_MAP[name];

  if (!IconComponent) {
    return <>{fallback || null}</>;
  }

  return <IconComponent className={className} />;
}

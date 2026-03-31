import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ContentVerificationStatusProps {
  status: 'published' | 'removed_on_platform' | 'failed' | 'orphaned' | 'pending';
  platform: string;
  lastVerified?: string;
  className?: string;
}

const statusConfig = {
  published: {
    icon: CheckCircle,
    label: 'Publicado',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  removed_on_platform: {
    icon: XCircle,
    label: 'Eliminado de la plataforma',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  failed: {
    icon: AlertCircle,
    label: 'Falló',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  orphaned: {
    icon: AlertCircle,
    label: 'Huérfano',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  pending: {
    icon: Clock,
    label: 'Pendiente',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

export default function ContentVerificationStatus({
  status,
  platform,
  lastVerified,
  className,
}: ContentVerificationStatusProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const formatLastVerified = (date: string) => {
    const now = new Date();
    const verified = new Date(date);
    const diffMs = now.getTime() - verified.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return verified.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm',
        config.bgColor,
        config.borderColor,
        className,
      )}
    >
      <Icon className={cn('h-4 w-4', config.color)} />
      <div className="flex flex-col">
        <span className={cn('font-medium', config.color)}>{config.label}</span>
        {lastVerified && (
          <span className="text-xs text-gray-500">
            Verificado: {formatLastVerified(lastVerified)}
          </span>
        )}
      </div>
    </div>
  );
}

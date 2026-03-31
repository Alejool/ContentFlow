import { AlertCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QueueStatusIndicatorProps {
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  plan?: string;
  effectivePriority?: number;
  publicationCount?: number;
  isBulk?: boolean;
}

const PLAN_LABELS: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  enterprise: {
    label: 'Prioridad Máxima',
    color: 'text-purple-600 dark:text-purple-400',
    icon: Zap,
  },
  professional: {
    label: 'Prioridad Alta',
    color: 'text-blue-600 dark:text-blue-400',
    icon: TrendingUp,
  },
  growth: {
    label: 'Prioridad Media',
    color: 'text-green-600 dark:text-green-400',
    icon: TrendingUp,
  },
  starter: {
    label: 'Prioridad Estándar',
    color: 'text-gray-600 dark:text-gray-400',
    icon: Clock,
  },
  free: {
    label: '',
    color: 'text-gray-500 dark:text-gray-500',
    icon: Clock,
  },
  demo: {
    label: '',
    color: 'text-gray-500 dark:text-gray-500',
    icon: Clock,
  },
};

export default function QueueStatusIndicator({
  queuePosition = 1,
  estimatedWaitMinutes = 0,
  plan = 'free',
  effectivePriority = 30,
  publicationCount = 1,
  isBulk = false,
}: QueueStatusIndicatorProps) {
  const [progress, setProgress] = useState(0);
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.free;
  const PlanIcon = planInfo.icon;

  // Simular progreso basado en el tiempo estimado
  useEffect(() => {
    if (estimatedWaitMinutes > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const increment = 100 / (estimatedWaitMinutes * 60); // Incremento por segundo
          return Math.min(prev + increment, 95); // Máximo 95% hasta que se complete
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [estimatedWaitMinutes]);

  const getStatusColor = () => {
    if (effectivePriority >= 150) return 'bg-purple-500';
    if (effectivePriority >= 80) return 'bg-blue-500';
    if (effectivePriority >= 60) return 'bg-green-500';
    if (effectivePriority >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusMessage = () => {
    if (estimatedWaitMinutes < 1) {
      return 'Procesando ahora...';
    }
    if (estimatedWaitMinutes < 3) {
      return 'Comenzará muy pronto';
    }
    if (estimatedWaitMinutes < 10) {
      return `Tiempo estimado: ~${estimatedWaitMinutes} min`;
    }
    return `En cola: ~${estimatedWaitMinutes} min`;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <PlanIcon className={`h-5 w-5 ${planInfo.color}`} />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isBulk
                ? `Publicación en Lote (${publicationCount} publicaciones)`
                : 'Publicación en Cola'}
            </h3>
          </div>

          {planInfo.label && (
            <p className={`mt-1 text-xs font-medium ${planInfo.color}`}>{planInfo.label}</p>
          )}

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{getStatusMessage()}</p>

          {queuePosition > 1 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Posición en cola: #{queuePosition}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusColor()} bg-opacity-10`}
          >
            <span className={`text-sm font-bold ${getStatusColor().replace('bg-', 'text-')}`}>
              {effectivePriority}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">Prioridad</span>
        </div>
      </div>

      {/* Barra de progreso */}
      {estimatedWaitMinutes > 0 && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${getStatusColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Información adicional para Enterprise */}
      {plan === 'enterprise' && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-purple-50 p-2 dark:bg-purple-900/20">
          <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <p className="text-xs text-purple-700 dark:text-purple-300">
            Procesamiento prioritario garantizado
          </p>
        </div>
      )}

      {/* Advertencia para planes bajos en hora pico */}
      {(plan === 'free' || plan === 'starter') && estimatedWaitMinutes > 15 && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Actualiza tu plan para procesamiento más rápido
          </p>
        </div>
      )}
    </div>
  );
}

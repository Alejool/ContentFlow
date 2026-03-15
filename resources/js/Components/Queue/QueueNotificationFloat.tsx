import { useQueueStatus } from '@/Hooks/useQueueStatus';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Clock, Loader2, X, XCircle } from 'lucide-react';

interface QueueNotificationFloatProps {
  publicationId?: number;
  onClose?: () => void;
}

export default function QueueNotificationFloat({
  publicationId,
  onClose,
}: QueueNotificationFloatProps) {
  const queueStatus = useQueueStatus(publicationId);

  if (!queueStatus) return null;

  const getIcon = () => {
    switch (queueStatus.status) {
      case 'queued':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'publishing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'published':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (queueStatus.status) {
      case 'queued':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'publishing':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'published':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
  };

  const getTitle = () => {
    switch (queueStatus.status) {
      case 'queued':
        return 'En Cola';
      case 'publishing':
        return 'Publicando...';
      case 'published':
        return '¡Publicado!';
      case 'failed':
        return 'Error';
    }
  };

  const getMessage = () => {
    if (queueStatus.message) return queueStatus.message;

    switch (queueStatus.status) {
      case 'queued':
        if (queueStatus.estimatedWaitMinutes < 2) {
          return 'Comenzará muy pronto';
        }
        return `Tiempo estimado: ~${queueStatus.estimatedWaitMinutes} min`;
      case 'publishing':
        return 'Publicando en las plataformas seleccionadas...';
      case 'published':
        return 'Tu publicación se ha completado exitosamente';
      case 'failed':
        return 'Hubo un error al publicar. Revisa los detalles.';
    }
  };

  const getPriorityBadge = () => {
    const planLabels: Record<string, string> = {
      enterprise: '⚡ Prioridad Máxima',
      professional: '🚀 Prioridad Alta',
      growth: '📈 Prioridad Media',
      starter: '📊 Prioridad Estándar',
    };

    const label = planLabels[queueStatus.plan];
    if (!label) return null;

    return (
      <span className="inline-flex items-center rounded-full bg-white/50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
        {label}
      </span>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
      >
        <div
          className={`rounded-lg border-2 p-4 shadow-lg backdrop-blur-sm ${getBackgroundColor()}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">{getIcon()}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {getTitle()}
                </h4>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{getMessage()}</p>

              {queueStatus.status === 'queued' && (
                <div className="mt-2 space-y-2">
                  {getPriorityBadge()}

                  {queueStatus.queuePosition > 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Posición en cola: #{queueStatus.queuePosition}
                    </p>
                  )}

                  {/* Barra de progreso */}
                  {queueStatus.estimatedWaitMinutes > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{
                            duration: queueStatus.estimatedWaitMinutes * 60,
                            ease: 'linear',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {queueStatus.status === 'publishing' && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <motion.div
                      className="h-full bg-blue-500"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{ width: '50%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

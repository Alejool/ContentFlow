import { Database, HardDrive, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CacheInfo {
  cache_driver: string;
  queue_driver: string;
  session_driver: string;
  environment: string;
  redis_available: boolean;
}

export function DevCacheIndicator() {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Solo mostrar en desarrollo
    if (import.meta.env.PROD) return;

    fetch('/api/dev/cache-info')
      .then((res) => res.json())
      .then((data) => setCacheInfo(data))
      .catch(() => setCacheInfo(null));
  }, []);

  // No mostrar en producción o si no hay info
  if (import.meta.env.PROD || !cacheInfo || !isVisible) return null;

  const isUsingDatabase =
    cacheInfo.cache_driver === 'database' || cacheInfo.queue_driver === 'database';

  const getIcon = (driver: string) => {
    if (driver === 'redis') return <Zap className="h-4 w-4" />;
    if (driver === 'database') return <Database className="h-4 w-4" />;
    return <HardDrive className="h-4 w-4" />;
  };

  const getColor = (driver: string) => {
    if (driver === 'redis') return 'bg-green-500';
    if (driver === 'database') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  if (isMinimized) {
    return (
      <div className="relative cursor-pointer self-end" onClick={() => setIsMinimized(false)}>
        <div
          className={`${getColor(cacheInfo.cache_driver)} rounded-full p-3 shadow-lg transition-transform hover:scale-110`}
        >
          {getIcon(cacheInfo.cache_driver)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div
            className={`${getColor(cacheInfo.cache_driver)} h-2 w-2 animate-pulse rounded-full`}
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Dev Mode</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Minimizar"
          >
            <span className="text-gray-500 dark:text-gray-400">−</span>
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Cerrar"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 p-4 text-sm">
        {/* Cache Driver */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Cache:</span>
          <div className="flex items-center gap-2">
            {getIcon(cacheInfo.cache_driver)}
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {cacheInfo.cache_driver}
            </span>
          </div>
        </div>

        {/* Queue Driver */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Queue:</span>
          <div className="flex items-center gap-2">
            {getIcon(cacheInfo.queue_driver)}
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {cacheInfo.queue_driver}
            </span>
          </div>
        </div>

        {/* Session Driver */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Session:</span>
          <div className="flex items-center gap-2">
            {getIcon(cacheInfo.session_driver)}
            <span className="font-mono font-semibold text-gray-900 dark:text-white">
              {cacheInfo.session_driver}
            </span>
          </div>
        </div>

        {/* Warning si usa database */}
        {isUsingDatabase && (
          <div className="mt-3 rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <div className="flex items-start gap-2">
              <Database className="mt-0.5 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold">Modo Demo</p>
                <p className="mt-1">Usando database cache. Performance reducida 5-10x.</p>
              </div>
            </div>
          </div>
        )}

        {/* Redis status */}
        {!cacheInfo.redis_available && (
          <div className="mt-2 rounded-md bg-red-50 p-2 dark:bg-red-900/20">
            <p className="text-xs text-red-800 dark:text-red-200">⚠️ Redis no disponible</p>
          </div>
        )}

        {/* Environment */}
        <div className="mt-3 border-t border-gray-200 pt-2 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Env: {cacheInfo.environment}
          </span>
        </div>
      </div>
    </div>
  );
}

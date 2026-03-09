import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useAddons } from '@/Hooks/useAddons';

export function AICreditCounter() {
  const { summary, loading } = useAddons();
  
  if (loading || !summary) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }
  
  const { used, limit, remaining, percentage } = summary.ai_credits;
  
  // Determinar estado
  const status = 
    percentage >= 95 ? 'critical' : 
    percentage >= 80 ? 'warning' : 
    'normal';
  
  const statusConfig = {
    critical: {
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      icon: AlertCircle,
      message: '¡Créditos casi agotados!',
    },
    warning: {
      color: 'text-amber-600',
      bgColor: 'bg-amber-500',
      icon: TrendingUp,
      message: 'Considera comprar más',
    },
    normal: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      icon: Sparkles,
      message: 'Todo bien',
    },
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Icon className={`w-5 h-5 ${config.color} mr-2`} />
          <span className="text-sm font-medium text-gray-700">
            Créditos IA
          </span>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${config.color}`}>
            {remaining}
          </div>
          <div className="text-xs text-gray-500">
            restantes
          </div>
        </div>
      </div>
      
      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${config.bgColor}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-600">
            {used} / {limit === -1 ? '∞' : limit} usados
          </span>
          <span className={`text-xs font-medium ${config.color}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      {/* Mensaje y CTA */}
      {status !== 'normal' && (
        <div className="pt-3 border-t border-blue-100">
          <p className="text-xs text-gray-600 mb-2">
            {config.message}
          </p>
          <Link 
            href="/subscription/addons"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4 inline mr-1.5" />
            Comprar Más Créditos
          </Link>
        </div>
      )}
      
      {/* Info adicional */}
      {status === 'normal' && remaining < 50 && (
        <div className="pt-3 border-t border-blue-100">
          <Link 
            href="/subscription/addons"
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center justify-center"
          >
            Ver paquetes disponibles
            <TrendingUp className="w-3 h-3 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { Activity, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface HealthStatus {
    status: string;
    timestamp: string;
    deployment: number;
    services: {
        database: boolean;
        redis: boolean;
        octane: boolean;
    };
}

// Custom hook for health check polling (avoids fetch in useEffect warning)
const useHealthCheck = (intervalMs: number = 5000) => {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [isOnline, setIsOnline] = useState(true);

    const checkHealth = useCallback(async () => {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            setHealth(data);
            setIsOnline(true);
        } catch {
            setIsOnline(false);
        }
    }, []);

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, intervalMs);
        return () => clearInterval(interval);
    }, [checkHealth, intervalMs]);

    return { health, isOnline };
};

export default function SystemHealthIndicator() {
    const { health, isOnline } = useHealthCheck();

    if (!health) return null;

    const allServicesUp = Object.values(health.services).every(s => s);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm transition-all ${
                isOnline && allServicesUp 
                    ? 'bg-green-500/90 text-white' 
                    : 'bg-red-500/90 text-white'
            }`}>
                {isOnline && allServicesUp ? (
                    <>
                        <Activity className="w-4 h-4 animate-pulse" />
                        <span className="text-sm font-medium">Sistema Actualizado</span>
                        <CheckCircle2 className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Reconectando...</span>
                        <XCircle className="w-4 h-4" />
                    </>
                )}
            </div>
        </div>
    );
}

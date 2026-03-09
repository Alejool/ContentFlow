import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface SystemStatus {
    plans: Record<string, boolean>;
    addons: Record<string, boolean>;
    features: Record<string, boolean>;
    integrations: Record<string, boolean>;
    general: {
        maintenance_mode: boolean;
        new_registrations: boolean;
    };
}

interface Props {
    status: SystemStatus;
}

export default function SystemStatusCard({ status }: Props) {
    const countEnabled = (items: Record<string, boolean>) => {
        return Object.values(items).filter(Boolean).length;
    };

    const countTotal = (items: Record<string, boolean>) => {
        return Object.keys(items).length;
    };

    const getStatusColor = (enabled: number, total: number) => {
        const percentage = (enabled / total) * 100;
        if (percentage === 100) return 'text-green-600';
        if (percentage >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const StatusItem = ({ label, enabled, total }: { label: string; enabled: number; total: number }) => {
        const Icon = enabled === total ? CheckCircle2 : enabled === 0 ? XCircle : AlertTriangle;
        const colorClass = getStatusColor(enabled, total);

        return (
            <div className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <Badge variant={enabled === total ? 'default' : enabled === 0 ? 'destructive' : 'secondary'}>
                    {enabled}/{total}
                </Badge>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>
                    Resumen de configuraciones activas
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {status.general.maintenance_mode && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-900">Modo Mantenimiento Activo</p>
                            <p className="text-xs text-red-700">Solo super admins pueden acceder</p>
                        </div>
                    </div>
                )}

                {!status.general.new_registrations && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-900">Registros Deshabilitados</p>
                            <p className="text-xs text-yellow-700">No se permiten nuevos registros</p>
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <StatusItem
                        label="Planes"
                        enabled={countEnabled(status.plans)}
                        total={countTotal(status.plans)}
                    />
                    <StatusItem
                        label="Add-ons"
                        enabled={countEnabled(status.addons)}
                        total={countTotal(status.addons)}
                    />
                    <StatusItem
                        label="Características"
                        enabled={countEnabled(status.features)}
                        total={countTotal(status.features)}
                    />
                    <StatusItem
                        label="Integraciones"
                        enabled={countEnabled(status.integrations)}
                        total={countTotal(status.integrations)}
                    />
                </div>

                <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                {countEnabled(status.features)}
                            </p>
                            <p className="text-xs text-muted-foreground">Características Activas</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">
                                {countEnabled(status.plans)}
                            </p>
                            <p className="text-xs text-muted-foreground">Planes Disponibles</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

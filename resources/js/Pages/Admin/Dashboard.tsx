import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminNavigation from '@/Components/Admin/AdminNavigation';
import SystemStatusCard from '@/Components/Admin/SystemStatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import Button from '@/Components/common/Modern/Button';
import { 
    Settings, 
    Bell, 
    Users, 
    TrendingUp, 
    Shield,
    Activity,
    Database,
    Zap
} from 'lucide-react';

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

interface Stats {
    total_users: number;
    active_subscriptions: number;
    total_publications: number;
    system_health: 'healthy' | 'warning' | 'critical';
}

interface Props {
    systemStatus: SystemStatus;
    stats?: Stats;
}

export default function AdminDashboard({ systemStatus, stats }: Props) {
    const quickActions = [
        {
            title: 'Configuración del Sistema',
            description: 'Gestiona planes, características e integraciones',
            icon: Settings,
            href: '/admin/system-settings',
            color: 'bg-blue-500',
        },
        {
            title: 'Notificaciones del Sistema',
            description: 'Envía notificaciones a todos los usuarios',
            icon: Bell,
            href: '/admin/system-notifications',
            color: 'bg-purple-500',
        },
    ];

    const systemMetrics = [
        {
            title: 'Usuarios Totales',
            value: stats?.total_users || 0,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Suscripciones Activas',
            value: stats?.active_subscriptions || 0,
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Publicaciones',
            value: stats?.total_publications || 0,
            icon: Database,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Estado del Sistema',
            value: stats?.system_health === 'healthy' ? 'Saludable' : 'Revisar',
            icon: Activity,
            color: stats?.system_health === 'healthy' ? 'text-green-600' : 'text-yellow-600',
            bgColor: stats?.system_health === 'healthy' ? 'bg-green-100' : 'bg-yellow-100',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-red-600" />
                    <div>
                        <h2 className="text-2xl font-bold">Panel de Administración</h2>
                        <p className="text-sm text-muted-foreground">
                            Gestión centralizada del sistema
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Panel de Administración" />

            <AdminNavigation currentRoute="/admin/dashboard" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* System Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {systemMetrics.map((metric) => {
                            const Icon = metric.icon;
                            return (
                                <Card key={metric.title}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {metric.title}
                                                </p>
                                                <p className="text-2xl font-bold mt-1">
                                                    {metric.value}
                                                </p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                                                <Icon className={`h-6 w-6 ${metric.color}`} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Card key={action.title} className="hover:shadow-lg transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-lg ${action.color}`}>
                                                        <Icon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">{action.title}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {action.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link href={action.href}>
                                                    <Button>Acceder</Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {/* Recent Activity */}
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Actividad Reciente</CardTitle>
                                    <CardDescription>
                                        Últimos cambios en la configuración del sistema
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            <span className="text-muted-foreground">
                                                Sistema iniciado correctamente
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span className="text-muted-foreground">
                                                Todas las configuraciones cargadas
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                                            <span className="text-muted-foreground">
                                                Caché optimizado
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* System Status */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Estado del Sistema</h3>
                            <SystemStatusCard status={systemStatus} />

                            {/* Quick Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-yellow-600" />
                                        Información Rápida
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-semibold">Acceso Exclusivo</p>
                                        <p className="text-muted-foreground">
                                            Solo super administradores pueden ver este panel
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Cambios en Tiempo Real</p>
                                        <p className="text-muted-foreground">
                                            Las configuraciones se aplican inmediatamente
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Auditoría Completa</p>
                                        <p className="text-muted-foreground">
                                            Todos los cambios quedan registrados
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

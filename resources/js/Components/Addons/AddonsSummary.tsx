import React, { useState, useEffect } from 'react';
import AddonUsageDisplay from './AddonUsageDisplay';

interface AddonSummary {
    total: number;
    used: number;
    available: number;
    percentage: number;
    plan_limit: number;
    current_usage: number;
    excess_usage: number;
}

interface AddonsSummaryData {
    summary: {
        ai_credits: AddonSummary;
        storage: AddonSummary;
        publications: AddonSummary;
        team_members: AddonSummary;
    };
    plan_info: {
        current_plan: string;
        limits: any;
        plan_started_at?: string;
    };
}

export default function AddonsSummary() {
    const [data, setData] = useState<AddonsSummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAddonsSummary();
    }, []);

    const fetchAddonsSummary = async () => {
        try {
            const response = await fetch('/api/v1/addons/summary');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching addons summary:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Error al cargar el resumen de addons</p>
            </div>
        );
    }

    const addonTypes = [
        {
            key: 'ai_credits',
            name: 'Créditos de IA',
            unit: 'créditos'
        },
        {
            key: 'storage',
            name: 'Almacenamiento',
            unit: 'GB'
        },
        {
            key: 'publications',
            name: 'Publicaciones',
            unit: 'publicaciones'
        },
        {
            key: 'team_members',
            name: 'Miembros del Equipo',
            unit: 'miembros'
        }
    ];

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No disponible';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Plan Info Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                    Plan Actual: {data.plan_info.current_plan.charAt(0).toUpperCase() + data.plan_info.current_plan.slice(1)}
                </h2>
                <div className="text-sm text-blue-700 space-y-1">
                    <p>
                        <strong>Inicio del plan:</strong> {formatDate(data.plan_info.plan_started_at)}
                    </p>
                    <p>
                        Los addons de extensión se activan automáticamente cuando excedes los límites de tu plan base.
                        <strong> El uso se cuenta desde el inicio de tu plan actual.</strong>
                    </p>
                </div>
            </div>

            {/* Addons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addonTypes.map((type) => {
                    const summary = data.summary[type.key as keyof typeof data.summary];
                    
                    // Solo mostrar si tiene addons o está excediendo el plan
                    if (summary.total === 0 && summary.excess_usage === 0) {
                        return null;
                    }

                    return (
                        <AddonUsageDisplay
                            key={type.key}
                            type={type.key}
                            name={type.name}
                            planLimit={summary.plan_limit}
                            currentUsage={summary.current_usage}
                            addonTotal={summary.total}
                            addonUsed={summary.used}
                            addonRemaining={summary.available}
                            unit={type.unit}
                        />
                    );
                })}
            </div>

            {/* No Addons Message */}
            {Object.values(data.summary).every(s => s.total === 0 && s.excess_usage === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No tienes addons activos
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Los addons de extensión te permiten exceder los límites de tu plan actual.
                    </p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Comprar Addons
                    </button>
                </div>
            )}

            {/* Plan Tracking Explanation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2">
                    ✅ Nuevo Sistema de Trazabilidad por Plan
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                    <li>• <strong>Uso independiente por plan:</strong> Cada plan empieza desde 0</li>
                    <li>• <strong>Fecha de inicio:</strong> El uso se cuenta desde {formatDate(data.plan_info.plan_started_at)}</li>
                    <li>• <strong>Addons intactos:</strong> Tus addons se mantienen al cambiar de plan</li>
                    <li>• <strong>Consumo inteligente:</strong> Solo se usan cuando excedes tu plan base</li>
                </ul>
            </div>

            {/* FIFO Explanation */}
            {Object.values(data.summary).some(s => s.total > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                        📋 Cómo funcionan los Addons de Extensión
                    </h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• <strong>Independientes del plan:</strong> Tus addons se mantienen al cambiar de plan</li>
                        <li>• <strong>Solo se usan cuando es necesario:</strong> Se activan automáticamente al exceder tu plan base</li>
                        <li>• <strong>FIFO (Primero en entrar, primero en salir):</strong> Se consumen en orden de compra</li>
                        <li>• <strong>Sin expiración:</strong> Los addons de extensión no caducan</li>
                        <li>• <strong>Trazabilidad por plan:</strong> El uso se resetea con cada cambio de plan</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
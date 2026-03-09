import React from 'react';
import { Link } from '@inertiajs/react';
import { Settings, Bell, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNavigationProps {
    currentRoute?: string;
}

export default function AdminNavigation({ currentRoute }: AdminNavigationProps) {
    const navItems = [
        {
            name: 'Dashboard',
            href: '/admin/dashboard',
            icon: Shield,
            description: 'Resumen del estado del sistema',
        },
        {
            name: 'Configuración del Sistema',
            href: '/admin/system-settings',
            icon: Settings,
            description: 'Gestiona planes, características e integraciones',
        },
        {
            name: 'Notificaciones del Sistema',
            href: '/admin/system-notifications',
            icon: Bell,
            description: 'Envía notificaciones a todos los usuarios',
        },
    ];

    return (
        <div className=" border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-2">
                        <Shield className="h-6 w-6 " />
                        <span className="text-lg font-semibold text-dark dark:text-white">
                            Panel de Administración
                        </span>
                    </div>
                    <nav className="flex space-x-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentRoute === item.href;
                            
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-red-100 text-red-700'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    )}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    message?: string;
}

export default function MaintenanceBanner({ message }: Props) {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className="bg-yellow-500 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="font-semibold">
                        {message || 'Modo Mantenimiento Activo - Solo super admins pueden acceder'}
                    </p>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="text-white hover:text-yellow-100 transition-colors"
                    aria-label="Cerrar banner"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

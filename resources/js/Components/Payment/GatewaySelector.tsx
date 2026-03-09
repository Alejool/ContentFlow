import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';

interface Gateway {
    name: string;
    display_name: string;
    logo: string | null;
    available: boolean;
}

interface GatewaySelectorProps {
    selectedGateway: string;
    onGatewayChange: (gateway: string) => void;
    className?: string;
}

export function GatewaySelector({ selectedGateway, onGatewayChange, className = '' }: GatewaySelectorProps) {
    const [gateways, setGateways] = useState<Gateway[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/payment/gateways')
            .then(res => res.json())
            .then(data => {
                setGateways(data.gateways || []);
                if (data.default_gateway && !selectedGateway) {
                    onGatewayChange(data.default_gateway);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading gateways:', error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (gateways.length <= 1) {
        return null; // No mostrar selector si solo hay un gateway
    }

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Método de pago
            </label>
            <div className="grid grid-cols-2 gap-3">
                {gateways.map((gateway) => (
                    <button
                        key={gateway.name}
                        onClick={() => onGatewayChange(gateway.name)}
                        disabled={!gateway.available}
                        className={`
                            relative flex items-center justify-center p-4 rounded-lg border-2 transition-all
                            ${selectedGateway === gateway.name
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                            }
                            ${!gateway.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {gateway.logo ? (
                            <img 
                                src={gateway.logo} 
                                alt={gateway.display_name}
                                className="h-8 object-contain"
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                <span className="font-medium">{gateway.display_name}</span>
                            </div>
                        )}
                        
                        {selectedGateway === gateway.name && (
                            <div className="absolute top-2 right-2">
                                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

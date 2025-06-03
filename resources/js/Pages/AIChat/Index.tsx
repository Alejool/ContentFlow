import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.tsx';
import { Head } from '@inertiajs/react';
import useAIChat from '@/Hooks/useAIChat'; // Assuming useAIChat will be typed or handled
import { Box, Circle, Float } from '@chakra-ui/react';

// Interface for individual trend objects
interface Trend {
    id: number;
    title: string;
    description: string;
    icon: string;
}

// Interface for chat messages (assuming structure from useAIChat)
interface ChatMessage {
    id: string; // Or number, depending on what useAIChat provides
    sender: 'AI' | 'User'; // Or string
    message: string;
    timestamp: string; // Or Date
}

// Interface for campaign data (assuming structure from useAIChat)
interface Campaign {
    id: string; // Or number
    name: string;
    status: 'active' | 'inactive' | string; // Example statuses
    // Add other campaign properties
}

// Props for the Index page component (usually passed by Inertia)
interface AIChatIndexPageProps {
    // Define any props passed from the controller, if any
    // For example: initialTrends?: Trend[];
}

export default function Index(props: AIChatIndexPageProps) { // Added props typing
    const {
        messages,       // Should be ChatMessage[] from useAIChat
        inputMessage,   // Should be string
        campaigns,      // Should be Campaign[]
        loading,        // Should be boolean
        handleInputChange, // Should be (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void
        handleKeyPress,    // Should be (e: KeyboardEvent<HTMLTextAreaElement>) => void
        sendMessage,       // Should be () => void or similar
    } = useAIChat(); // Ideally, useAIChat would be a typed hook

    const [trends, setTrends] = useState<Trend[]>([
        {
            id: 1,
            title: 'Marketing de Contenido Visual',
            description: 'Las imágenes y videos cortos generan 40% más engagement',
            icon: '📸'
        },
        {
            id: 2,
            title: 'Campañas de Sostenibilidad',
            description: 'Las marcas eco-friendly tienen 25% más retención de clientes',
            icon: '🌱'
        },
        {
            id: 3,
            title: 'Colaboraciones con Micro-Influencers',
            description: 'Mayor tasa de conversión que con celebridades tradicionales',
            icon: '👥'
        },
        {
            id: 4,
            title: 'Marketing Conversacional',
            description: 'Los chatbots personalizados aumentan la satisfacción del cliente',
            icon: '💬'
        },
        {
            id: 5,
            title: 'Contenido Generado por Usuarios',
            description: 'Aumenta la autenticidad de marca y reduce costos de producción',
            icon: '👤'
        }
    ]);

    // Type for the trend parameter
    const useTrendAsPrompt = (trend: Trend) => {
        const prompt = `Dame ideas para crear una campaña de ${trend.title}`;
        // Assuming handleInputChange expects an event-like object or simply the value
        handleInputChange({ target: { value: prompt } } as ChangeEvent<HTMLInputElement>);
    };

    return (
        <AuthenticatedLayout>
            <Head title="AI Chat" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Asistente IA para Campañas</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Obtén recomendaciones personalizadas para tus campañas de redes sociales.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white shadow-md rounded-lg p-6 h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800">Chat con IA</h2>
                                    {campaigns.length > 0 && (
                                        <span className="text-sm text-green-600">
                                            {(campaigns as Campaign[]).length} campañas cargadas
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4 max-h-96 overflow-y-auto mb-6 p-2">
                                    {(messages as ChatMessage[]).map((msg) => ( // Cast messages for now
                                        <div
                                            key={msg.id}
                                            className={`p-4 rounded-lg ${
                                                msg.sender === 'AI' ? 'bg-blue-50' : 'bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-800">{msg.sender}</p>
                                                <p className="text-sm text-gray-500">{msg.timestamp}</p>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">{msg.message}</p>
                                        </div>
                                    ))}

                                    {loading && (
                                        <div className="p-4 rounded-lg bg-blue-50">
                                            <div className="flex items-center space-x-2">
                                                <div className="animate-pulse text-blue-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
                                                    </svg>
                                                </div>
                                                <p className="text-sm text-gray-600">La IA está pensando...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <div className="flex">
                                        <textarea
                                            value={inputMessage as string} // Cast for now
                                            onChange={handleInputChange as (e: ChangeEvent<HTMLTextAreaElement>) => void} // Cast for now
                                            onKeyPress={handleKeyPress as (e: KeyboardEvent<HTMLTextAreaElement>) => void} // Cast for now
                                            placeholder="Escribe tu mensaje... (Puedes preguntar sobre campañas, solicitar ideas o mejoras)"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows={3} // rows should be number
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs text-gray-500">
                                            Presiona Enter para enviar o Shift+Enter para nueva línea
                                        </p>
                                        <button
                                            onClick={sendMessage as () => void} // Cast for now
                                            disabled={loading || !(inputMessage as string).trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
                                        >
                                            Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white shadow-md rounded-lg p-6 h-full">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6">Tendencias & Ideas</h2>
                                <div className="space-y-4">
                                    {trends.map((trend) => (
                                        <div
                                            key={trend.id}
                                            className="p-4 border border-gray-100 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                                            onClick={() => useTrendAsPrompt(trend)}
                                        >
                                            <div className="flex items-start">
                                                <span className="text-2xl mr-3">{trend.icon}</span>
                                                <div>
                                                    <h3 className="font-medium text-gray-800">{trend.title}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{trend.description}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-right">
                                                <button
                                                    className="text-xs text-blue-600 hover:text-blue-800"
                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => { // Typed event
                                                        e.stopPropagation();
                                                        useTrendAsPrompt(trend);
                                                    }}
                                                >
                                                    Usar como idea →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">Estadísticas de Campañas</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                           <Box position="relative" bg="bg.emphasized"> {/* Ensure Chakra Box props are valid */}
                                                <Float offsetX={1}> {/* Chakra Float props */}
                                                <Circle size="5" bg="green" color="white">
                                                    {(campaigns as Campaign[]).filter(c => c.status === 'active').length || 0}
                                                </Circle>
                                                </Float>
                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <p className="text-sm text-gray-600">Campañas Activas</p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {(campaigns as Campaign[]).filter(c => c.status === 'active').length || 0}
                                                    </p>
                                                </div>
                                            </Box>
                                           <Box position="relative" bg="bg.emphasized">
                                                <Float offsetX={1}>
                                                <Circle size="5" bg="blue" color="white">
                                                   {(campaigns as Campaign[]).length || 0}
                                                </Circle>
                                                </Float>
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-sm text-gray-600">Total Campañas</p>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        {(campaigns as Campaign[]).length || 0}
                                                    </p>
                                                </div>
                                            </Box>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
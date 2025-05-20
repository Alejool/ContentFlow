import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import useAIChat from '@/Hooks/useAIChat';
import { useState, useEffect } from 'react';
import { Box, Circle, Float } from '@chakra-ui/react';

export default function Index() {
    const {
        messages,
        inputMessage,
        campaigns,
        loading,
        handleInputChange,
        handleKeyPress,
        sendMessage,
    } = useAIChat();

   
    const [trends, setTrends] = useState([
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

    // Función para usar una tendencia como prompt para la IA
    const useTrendAsPrompt = (trend) => {
        const prompt = `Dame ideas para crear una campaña de ${trend.title}`;
        handleInputChange({ target: { value: prompt } });
    };
     
    return (
        <AuthenticatedLayout>
            <Head title="AI Chat" />
          
            <div className="py-12">
              

                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Encabezado de la página */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Asistente IA para Campañas</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Obtén recomendaciones personalizadas para tus campañas de redes sociales.
                        </p>
                    </div>

                    {/* Contenedor principal con grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sección de Chat (2/3 del ancho) */}
                        <div className="lg:col-span-2">
                            <div className="bg-white shadow-md rounded-lg p-6 h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800">Chat con IA</h2>
                                    {campaigns.length > 0 && (
                                        <span className="text-sm text-green-600">
                                            {campaigns.length} campañas cargadas
                                        </span>
                                    )}
                                </div>
                                
                                {/* Mensajes del chat */}
                                <div className="space-y-4 max-h-96 overflow-y-auto mb-6 p-2">
                                    {messages.map((msg) => (
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

                                {/* Entrada de chat */}
                                <div className="mt-6">
                                    <div className="flex">
                                        <textarea
                                            value={inputMessage}
                                            onChange={handleInputChange}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Escribe tu mensaje... (Puedes preguntar sobre campañas, solicitar ideas o mejoras)"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows="3"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs text-gray-500">
                                            Presiona Enter para enviar o Shift+Enter para nueva línea
                                        </p>
                                        <button 
                                            onClick={sendMessage}
                                            disabled={loading || !inputMessage.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
                                        >
                                            Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel de Tendencias e Ideas (1/3 del ancho) */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow-md rounded-lg p-6 h-full">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6">Tendencias & Ideas</h2>
                                
                                {/* Lista de tendencias */}
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
                                                    onClick={(e) => {
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

                                {/* Estadísticas de campañas */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">Estadísticas de Campañas</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                           <Box position="relative"  bg="bg.emphasized">
                                                <Float offsetX="1">
                                                <Circle size="5" bg="green" color="white">
                                                    {campaigns.filter(c => c.status === 'active').length || 0}
                                                </Circle>
                                                </Float>
                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <p className="text-sm text-gray-600">Campañas Activas</p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {campaigns.filter(c => c.status === 'active').length || 0}
                                                    </p>
                                                </div>
                                            </Box>
                                           <Box position="relative"  bg="bg.emphasized">
                                                <Float offsetX="1">
                                                <Circle size="5" bg="blue" color="white">
                                                   {campaigns.length || 0}
                                                </Circle>
                                                </Float>
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-sm text-gray-600">Total Campañas</p>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        {campaigns.length || 0}
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
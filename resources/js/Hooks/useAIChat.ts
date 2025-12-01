import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function useAIChat() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'AI',
            message: 'Hola! ¿Cómo puedo ayudarte con tus campañas hoy?',
            timestamp: new Date().toLocaleString(),
        },
    ]);
    
    const [inputMessage, setInputMessage] = useState('');
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);   

    const fetchCampaigns = async () => {
        try {
            const response = await axios.get('/campaigns');
            console.log('Campañas cargadas:', response.data.campaigns);
            setCampaigns(response.data.campaigns);
        } catch (error) {
            console.error('Error al cargar campañas:', error);
            toast.error('No se pudieron cargar las campañas');
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim()) return;
        
        const userMessage = {
            id: messages.length + 1,
            sender: 'User',
            message: inputMessage,
            timestamp: new Date().toLocaleString(),
        };
        
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        
        try {
            const campaignContext = campaigns.map(campaign => ({
                id: campaign.id,
                nombre: campaign.name || campaign.title,
                descripcion: campaign.description,
                estado: campaign.status,
                fechaInicio: campaign.start_date,
                fechaFin: campaign.end_date,
                hashtags: campaign.hashtags
            }));
            
            const response = await axios.post('/api/ai-chat/message', {
                message: inputMessage,
                context: {
                    campaigns: campaignContext,
                    projectType: 'social_media_management'
                }
            });

            const aiResponse = {
                id: messages.length + 2,
                sender: 'AI',
                message: response.data.message,
                timestamp: new Date().toLocaleString(),
            };
            setMessages(prev => [...prev, aiResponse]);

            if (response.data.suggestion) {
                handleSuggestion(response.data.suggestion);
            }
            
        } catch (error) {
            console.error('Error al procesar mensaje:', error);
            
            const errorMessage = {
                id: messages.length + 2,
                sender: 'AI',
                message: 'Lo siento, ocurrió un error al procesar tu mensaje.',
                timestamp: new Date().toLocaleString(),
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
            setInputMessage('');
        }
    };
    
    const handleSuggestion = (suggestion) => {
        if (suggestion.type === 'new_campaign') {
            console.log('Nueva campaña sugerida:', suggestion.data);
            toast.info('La IA ha sugerido una nueva campaña');
        } else if (suggestion.type === 'improvement') {
            console.log('Mejora sugerida para campaña:', suggestion.data);
            toast.info('La IA ha sugerido mejoras para una campaña existente');
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInputChange = (e) => {
        setInputMessage(e.target.value);
    };

    return {
        messages,
        inputMessage,
        campaigns,
        loading,
        handleInputChange,
        handleKeyPress,
        sendMessage,
    };
}
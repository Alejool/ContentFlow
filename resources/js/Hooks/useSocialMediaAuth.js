import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export function useSocialMediaAuth() {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [accounts, setAccounts] = useState([]);
    
    // Cargar cuentas conectadas del usuario
    const loadConnectedAccounts = async () => {
        try {
            const response = await axios.get('/api/social-accounts');
            setAccounts(response.data.accounts);
            return response.data.accounts;
        } catch (error) {
            console.error('Error al cargar cuentas sociales:', error);
            toast.error('No se pudieron cargar las cuentas conectadas');
            return [];
        }
    };
    
    // Iniciar proceso de autenticación
    const connectSocialMedia = async (platform) => {
        setIsAuthenticating(true);
        
        try {
            // Obtener URL de autorización del backend
            const response = await axios.get(`/api/social-accounts/auth-url/${platform}`);
            
            // Abrir ventana de autenticación
            const authWindow = window.open(
                response.data.url,
                `Conectar con ${platform}`,
                'width=600,height=700'
            );
            
            // Manejar el resultado de la autenticación
            const authResult = await new Promise((resolve, reject) => {
                // Escuchar mensajes de la ventana de autenticación
                window.addEventListener('message', (event) => {
                    if (event.data.type === 'social_auth_callback') {
                        if (authWindow) authWindow.close();
                        
                        if (event.data.success) {
                            resolve(event.data);
                        } else {
                            reject(new Error(event.data.error || 'Error de autenticación'));
                        }
                    }
                }, { once: true });
                
                // Manejar cierre manual de la ventana
                const checkClosed = setInterval(() => {
                    if (authWindow && authWindow.closed) {
                        clearInterval(checkClosed);
                        reject(new Error('Ventana cerrada por el usuario'));
                    }
                }, 500);
            });
            
            // Guardar los datos de la cuenta en el backend
            await axios.post('/api/social-accounts', {
                platform: platform,
                account_id: authResult.account_id,
                access_token: authResult.access_token,
                refresh_token: authResult.refresh_token,
                token_expires_at: authResult.expires_at
            });
            
            // Recargar cuentas conectadas
            await loadConnectedAccounts();
            
            toast.success(`Cuenta de ${platform} conectada exitosamente`);
            return true;
        } catch (error) {
            console.error(`Error al conectar con ${platform}:`, error);
            toast.error(`Error al conectar con ${platform}: ${error.message}`);
            return false;
        } finally {
            setIsAuthenticating(false);
        }
    };
    
    // Desconectar cuenta
    const disconnectSocialMedia = async (platform, accountId) => {
        try {
            await axios.delete(`/api/social-accounts/${accountId}`);
            
            // Actualizar estado local
            setAccounts(accounts.filter(account => account.id !== accountId));
            
            toast.success(`Cuenta de ${platform} desconectada exitosamente`);
            return true;
        } catch (error) {
            console.error(`Error al desconectar ${platform}:`, error);
            toast.error(`Error al desconectar ${platform}: ${error.message}`);
            return false;
        }
    };
    
    return {
        accounts,
        isAuthenticating,
        loadConnectedAccounts,
        connectSocialMedia,
        disconnectSocialMedia
    };
}
import { useState, useEffect, useRef } from 'react';
import IconFacebook from '@/../assets/Icons/facebook.svg';
import IconInstagram from '@/../assets/Icons/instagram.svg';
import IconTiktok from '@/../assets/Icons/tiktok.svg';
import IconTwitter from '@/../assets/Icons/x.svg';
import IconYoutube from '@/../assets/Icons/youtube.svg';
import { useSocialMediaAuth } from '@/Hooks/useSocialMediaAuth';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function SocialMediaAccounts() {
    const { isAuthenticating, connectSocialMedia, disconnectSocialMedia } = useSocialMediaAuth();
    const [accounts, setAccounts] = useState([
        { id: 1, platform: 'facebook', name: 'Facebook', logo: IconFacebook, isConnected: false, accountId: null },
        { id: 2, platform: 'instagram', name: 'Instagram', logo: IconInstagram, isConnected: false, accountId: null },
        { id: 3, platform: 'tiktok', name: 'TikTok', logo: IconTiktok, isConnected: false, accountId: null },
        { id: 4, platform: 'twitter', name: 'Twitter', logo: IconTwitter, isConnected: false, accountId: null },
        { id: 5, platform: 'youtube', name: 'YouTube', logo: IconYoutube, isConnected: false, accountId: null },
    ]);
    const [loading, setLoading] = useState(true);
    const [authInProgress, setAuthInProgress] = useState(false);
    const authWindowRef = useRef(null);
    const authCheckIntervalRef = useRef(null);

    // Cargar las cuentas conectadas al iniciar el componente
    useEffect(() => {
        fetchConnectedAccounts();
        
        // Configurar el listener de mensajes para la autenticación
        const handleAuthMessage = (event) => {
            console.log('Mensaje recibido en SocialMediaAccounts:', event.data);
            
            if (event.data && event.data.type === 'social_auth_callback') {
                setAuthInProgress(false);
                
                if (event.data.success) {
                    toast.success(`Cuenta conectada exitosamente`);
                    fetchConnectedAccounts(); // Recargar las cuentas después de una autenticación exitosa
                } else {
                    toast.error(`Error en la autenticación: ${event.data.message || 'Error desconocido'}`);
                }
                
                // Limpiar el intervalo de verificación si existe
                if (authCheckIntervalRef.current) {
                    clearInterval(authCheckIntervalRef.current);
                    authCheckIntervalRef.current = null;
                }
            }
        };
        
        window.addEventListener('message', handleAuthMessage);
        
        return () => {
            window.removeEventListener('message', handleAuthMessage);
            // Limpiar el intervalo de verificación al desmontar
            if (authCheckIntervalRef.current) {
                clearInterval(authCheckIntervalRef.current);
            }
        };
    }, []);

    // Función para obtener las cuentas conectadas desde el backend
    const fetchConnectedAccounts = async () => {
        try {
            setLoading(true);
            // Aseguramos que la solicitud incluya las credenciales y el token CSRF
            const response = await axios.get('/api/social-accounts', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                withCredentials: true // Importante para Sanctum
            });
            
            if (response.data && response.data.accounts) {
                // Actualizar el estado de las cuentas con la información del servidor
                updateAccountsStatus(response.data.accounts);
            }
        } catch (error) {
            console.error('Error al cargar cuentas sociales:', error);
            if (error.response?.status === 401) {
                toast.error('No autorizado. Por favor inicie sesión nuevamente.');
            } else {
                toast.error('No se pudieron cargar las cuentas conectadas');
            }
        } finally {
            setLoading(false);
        }
    };

    // Actualizar el estado de las cuentas con la información del servidor
    const updateAccountsStatus = (connectedAccounts) => {
        // Si no hay cuentas conectadas o el array está vacío, mantener todos los valores predeterminados
        if (!connectedAccounts || connectedAccounts.length === 0) {
            setAccounts(prevAccounts => 
                prevAccounts.map(account => ({
                    ...account,
                    isConnected: false,
                    accountId: null,
                    accountDetails: null
                }))
            );
            return;
        }
        
        // Si hay cuentas conectadas, actualizar solo las que coincidan por platform
        setAccounts(prevAccounts => 
            prevAccounts.map(account => {
                const connectedAccount = connectedAccounts.find(
                    ca => ca.platform.toLowerCase() === account.platform.toLowerCase()
                );
                
                return {
                    ...account,
                    isConnected: !!connectedAccount,
                    accountId: connectedAccount ? connectedAccount.id : null,
                    accountDetails: connectedAccount || null
                };
            })
        );
    };

    const handleConnectionToggle = async (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        
        if (!account) return;
        
        if (account.isConnected) {
            // Desconectar cuenta
            try {
                const success = await disconnectSocialMedia(account.platform, account.accountId);
                if (success) {
                    setAccounts(prevAccounts => 
                        prevAccounts.map(acc => 
                            acc.id === accountId ? { ...acc, isConnected: false, accountId: null, accountDetails: null } : acc
                        )
                    );
                    toast.success(`Cuenta de ${account.name} desconectada exitosamente`);
                }
            } catch (error) {
                toast.error(`Error al desconectar ${account.name}: ${error.message}`);
            }
        } else {
            // Conectar cuenta - Implementación mejorada
            try {
                setAuthInProgress(true);
                
                // Obtener URL de autenticación
                const response = await axios.get(`/api/social-accounts/auth-url/${account.platform}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                        'Accept': 'application/json',
                    },
                    withCredentials: true
                });
                
                if (response.data.success && response.data.url) {
                    // Cerrar cualquier ventana de autenticación anterior que pudiera estar abierta
                    if (authWindowRef.current && !authWindowRef.current.closed) {
                        authWindowRef.current.close();
                    }
                    
                    // Abrir ventana emergente para autenticación
                    authWindowRef.current = window.open(
                        response.data.url,
                        `${account.platform}Auth`,
                        'width=600,height=700,left=200,top=100'
                    );
                    
                    if (!authWindowRef.current) {
                        setAuthInProgress(false);
                        toast.error('El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio.');
                        return;
                    }
                    
                    // Verificar si la ventana se cerró manualmente
                    authCheckIntervalRef.current = setInterval(() => {
                        if (authWindowRef.current.closed) {
                            clearInterval(authCheckIntervalRef.current);
                            authCheckIntervalRef.current = null;
                            setAuthInProgress(false);
                            
                            // Verificar si la cuenta se conectó correctamente después de un breve retraso
                            setTimeout(() => {
                                fetchConnectedAccounts();
                            }, 1000);
                        }
                    }, 500);
                } else {
                    setAuthInProgress(false);
                    toast.error('No se pudo obtener la URL de autenticación');
                }
            } catch (error) {
                setAuthInProgress(false);
                console.error('Error al conectar con la red social:', error);
                toast.error(`Error al conectar con ${account.name}: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Conecta tus Redes Sociales</h2>
            <p className="text-gray-600 mb-6">
                Conecta tus cuentas de redes sociales para permitir la publicación automática de contenido.
                Tu información se mantendrá segura y solo se utilizará para las funciones que autorices.
            </p>
            
            {loading ? (
                <div className="text-center py-4">
                    <p className="text-gray-600">Cargando cuentas...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
                        >
                            <img src={account.logo} alt={`${account.name} Logo`} className="w-10 h-10 mr-4" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">{account.name}</h3>
                                <p className="text-sm text-gray-600">
                                    {account.isConnected ? (
                                        <span className="text-green-600">Conectado</span>
                                    ) : (
                                        <span className="text-red-600">No Conectado</span>
                                    )}
                                </p>
                                {account.isConnected && account.accountDetails && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        ID: {account.accountDetails.account_id}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleConnectionToggle(account.id)}
                                disabled={isAuthenticating || authInProgress}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                                    isAuthenticating || authInProgress ? 'bg-gray-200 text-gray-500' :
                                    account.isConnected
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                } transition duration-300`}
                            >
                                {isAuthenticating || authInProgress ? 'Procesando...' : account.isConnected ? 'Desconectar' : 'Conectar'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">¿Por qué conectar tus redes sociales?</h3>
                <ul className="list-disc pl-5 text-blue-700">
                    <li className="mb-1">Publica contenido automáticamente en tus redes sociales</li>
                    <li className="mb-1">Gestiona todas tus cuentas desde un solo lugar</li>
                    <li className="mb-1">Programa publicaciones para momentos óptimos</li>
                    <li className="mb-1">Mantén el control total de tus cuentas en todo momento</li>
                </ul>
                <p className="text-sm text-blue-600 mt-2">
                    Puedes desconectar tus cuentas en cualquier momento. No publicaremos nada sin tu permiso.
                </p>
            </div>
        </div>
    );
}
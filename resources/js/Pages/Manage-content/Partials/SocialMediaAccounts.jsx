import { useState, useEffect } from 'react';
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

    // Cargar las cuentas conectadas al iniciar el componente
    useEffect(() => {
        fetchConnectedAccounts();
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
            // Conectar cuenta
            try {
                const result = await connectSocialMedia(account.platform.toLowerCase());
                if (result) {
                    // Recargar las cuentas para obtener la información actualizada
                    await fetchConnectedAccounts();
                    toast.success(`Cuenta de ${account.name} conectada exitosamente`);
                }
            } catch (error) {
                toast.error(`Error al conectar con ${account.name}: ${error.message}`);
            }
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Cuentas de Redes Sociales Conectadas</h2>
            
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
                                disabled={isAuthenticating}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                                    isAuthenticating ? 'bg-gray-200 text-gray-500' :
                                    account.isConnected
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                } transition duration-300`}
                            >
                                {isAuthenticating ? 'Procesando...' : account.isConnected ? 'Desconectar' : 'Conectar'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
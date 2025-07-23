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

    // Load connected accounts when the component starts
    useEffect(() => {
        fetchConnectedAccounts();
        
        // Configure message listener for authentication
        const handleAuthMessage = (event) => {
            console.log('Message received in SocialMediaAccounts:', event.data);
            
            if (event.data && event.data.type === 'social_auth_callback') {
                setAuthInProgress(false);
                
                if (event.data.success) {
                    toast.success(`Account connected successfully`);
                    fetchConnectedAccounts(); // Reload accounts after successful authentication
                } else {
                    toast.error(`Authentication error: ${event.data.message || 'Unknown error'}`);
                }
                
                // Clear verification interval if it exists
                if (authCheckIntervalRef.current) {
                    clearInterval(authCheckIntervalRef.current);
                    authCheckIntervalRef.current = null;
                }
            }
        };
        
        window.addEventListener('message', handleAuthMessage);
        
        return () => {
            window.removeEventListener('message', handleAuthMessage);
            // Clear verification interval on unmount
            if (authCheckIntervalRef.current) {
                clearInterval(authCheckIntervalRef.current);
            }
        };
    }, []);

    // Function to get connected accounts from the backend
    const fetchConnectedAccounts = async () => {
        try {
            setLoading(true);
            // Ensure the request includes credentials and CSRF token
            const response = await axios.get('/api/social-accounts', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                withCredentials: true // Important for Sanctum
            });
            
            if (response.data && response.data.accounts) {
                // Update account status with server information
                updateAccountsStatus(response.data.accounts);
            }
        } catch (error) {
            console.error('Error loading social accounts:', error);
            if (error.response?.status === 401) {
                toast.error('Unauthorized. Please log in again.');
            } else {
                toast.error('Could not load connected accounts');
            }
        } finally {
            setLoading(false);
        }
    };

    // Update account status with server information
    const updateAccountsStatus = (connectedAccounts) => {
        // If there are no connected accounts or the array is empty, keep all default values
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
        
        // If there are connected accounts, update only those that match by platform
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
            // Disconnect account
            try {
                const success = await disconnectSocialMedia(account.platform, account.accountId);
                if (success) {
                    setAccounts(prevAccounts => 
                        prevAccounts.map(acc => 
                            acc.id === accountId ? { ...acc, isConnected: false, accountId: null, accountDetails: null } : acc
                        )
                    );
                    toast.success(`${account.name} account disconnected successfully`);
                }
            } catch (error) {
                toast.error(`Error disconnecting ${account.name}: ${error.message}`);
            }
        } else {
            // Connect account - Improved implementation
            try {
                setAuthInProgress(true);
                
                // Get authentication URL
                const response = await axios.get(`/api/social-accounts/auth-url/${account.platform}`, {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                        'Accept': 'application/json',
                    },
                    withCredentials: true
                });
                
                if (response.data.success && response.data.url) {
                    // Close any previous authentication window that might be open
                    if (authWindowRef.current && !authWindowRef.current.closed) {
                        authWindowRef.current.close();
                    }
                    
                    // Open popup window for authentication
                    authWindowRef.current = window.open(
                        response.data.url,
                        `${account.platform}Auth`,
                        'width=600,height=700,left=200,top=100'
                    );
                    
                    if (!authWindowRef.current) {
                        setAuthInProgress(false);
                        toast.error('The browser blocked the pop-up window. Please allow pop-ups for this site.');
                        return;
                    }
                    
                    // Check if the window was closed manually
                    authCheckIntervalRef.current = setInterval(() => {
                        if (authWindowRef.current.closed) {
                            clearInterval(authCheckIntervalRef.current);
                            authCheckIntervalRef.current = null;
                            setAuthInProgress(false);
                            
                            // Check if the account connected correctly after a short delay
                            setTimeout(() => {
                                fetchConnectedAccounts();
                            }, 1000);
                        }
                    }, 500);
                } else {
                    setAuthInProgress(false);
                    toast.error('Could not get authentication URL');
                }
            } catch (error) {
                setAuthInProgress(false);
                console.error('Error connecting to social network:', error);
                toast.error(`Error connecting with ${account.name}: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Connect Your Social Networks</h2>
            <p className="text-gray-600 mb-6">
                Connect your social media accounts to allow automatic content publishing.
                Your information will be kept secure and will only be used for the functions you authorize.
            </p>
            
            {loading ? (
                <div className="text-center py-4">
                    <p className="text-gray-600">Loading accounts...</p>
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
                                        <span className="text-green-600">Connected</span>
                                    ) : (
                                        <span className="text-red-600">Not Connected</span>
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
                                {isAuthenticating || authInProgress ? 'Processing...' : account.isConnected ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Why connect your social networks?</h3>
                <ul className="list-disc pl-5 text-blue-700">
                    <li className="mb-1">Automatically publish content to your social networks</li>
                    <li className="mb-1">Manage all your accounts from one place</li>
                    <li className="mb-1">Schedule posts for optimal times</li>
                    <li className="mb-1">Maintain full control of your accounts at all times</li>
                </ul>
                <p className="text-sm text-blue-600 mt-2">
                    You can disconnect your accounts at any time. We will not publish anything without your permission.
                </p>
            </div>
        </div>
    );
}
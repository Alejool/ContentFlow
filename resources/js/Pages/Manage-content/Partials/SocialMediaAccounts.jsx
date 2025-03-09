import IconFacebook from '@/../assets/Icons/facebook.svg';
import IconInstagram from '@/../assets/Icons/instagram.svg';
import IconTiktok from '@/../assets/Icons/tiktok.svg';
import IconTwitter from '@/../assets/Icons/x.svg';
import IconYoutube from '@/../assets/Icons/youtube.svg';

export default function SocialMediaAccounts() {
    const socialMediaAccounts = [
        { id: 1, name: 'Facebook', logo: IconFacebook, isConnected: true },
        { id: 2, name: 'Instagram', logo: IconInstagram, isConnected: false },
        { id: 3, name: 'TikTok', logo: IconTiktok, isConnected: true },
        { id: 4, name: 'Twitter', logo: IconTwitter, isConnected: false },
        { id: 5, name: 'YouTube', logo: IconYoutube, isConnected: true },
    ];

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Connected Social Media Accounts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {socialMediaAccounts.map((account) => (
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
                        </div>
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                                account.isConnected
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            } transition duration-300`}
                        >
                            {account.isConnected ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
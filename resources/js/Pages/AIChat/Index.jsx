import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index() {
    // Mock data for chat messages
    const chatMessages = [
        {
            id: 1,
            sender: 'AI',
            message: 'Hi! How can I assist you today?',
            timestamp: '2023-10-20 10:00 AM',
        },
        {
            id: 2,
            sender: 'User',
            message: 'Can you suggest some hashtags for my new post?',
            timestamp: '2023-10-20 10:01 AM',
        },
        {
            id: 3,
            sender: 'AI',
            message: 'Sure! Here are some hashtags: #SocialMediaTips #ContentCreation #DigitalMarketing',
            timestamp: '2023-10-20 10:02 AM',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="AI Chat" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">AI Chat</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Get real-time recommendations and support from our AI.
                        </p>
                    </div>

                    {/* Chat Section */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Chat with AI</h2>
                        <div className="space-y-4">
                            {chatMessages.map((msg) => (
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
                        </div>

                        {/* Chat Input */}
                        <div className="mt-6">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
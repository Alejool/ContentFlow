import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Welcome Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold text-gray-900">Welcome to ContentFlow</h1>
                        <p className="mt-2 text-xl text-gray-600">Manage your multimedia content efficiently with AI-powered tools.</p>
                    </div>

                    {/* Main Dashboard Grid */}
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Card 1: Content Management */}
                        <div className="overflow-hidden bg-white shadow-xl rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">Content Management</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Organize, edit, and schedule your multimedia content.
                                </p>
                                <Link
                                    href="/manage-content"
                                    className="mt-4 block w-full text-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                                >
                                    Manage Content
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Schedule Posts */}
                        <div className="overflow-hidden bg-white shadow-xl rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">Schedule Posts</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Plan and schedule your social media posts with ease.
                                </p>
                                <Link
                                    href="/schedule"
                                    className="mt-4 block w-full text-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                                >
                                    Schedule Now
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Analytics */}
                        <div className="overflow-hidden bg-white shadow-xl rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">Analytics</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Track engagement and performance metrics.
                                </p>
                                <Link
                                    href="/analytics"
                                    className="mt-4 block w-full text-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                                >
                                    View Analytics
                                </Link>
                            </div>
                        </div>

                        {/* Card 4: AI Chat */}
                        <div className="overflow-hidden bg-white shadow-xl rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">AI Chat</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Get real-time recommendations and support from our AI.
                                </p>
                                <Link
                                    href="/ai-chat"
                                    className="mt-4 block w-full text-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                                >
                                    Chat Now
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Graph Section */}
                    {/* <div className="mt-8 bg-white p-6 shadow-md rounded-lg transform transition-all hover:scale-105 hover:shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-800">Performance Overview</h3>
                        <div className="mt-4">
                            <div className="bg-gray-100 h-64 w-full flex justify-center items-center rounded-lg">
                                <span className="text-gray-500">Interactive Graph Placeholder</span>
                            </div>
                        </div>
                    </div> */}

                    {/* Quick Actions Section */}
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Quick Action 1: Upload Content */}
                        <div className="overflow-hidden bg-white shadow-xl rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div className="p-6">
                                <button className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300">
                                    Upload Content
                                </button>
                            </div>
                        </div>

                        {/* Quick Action 2: Create Campaign */}
                        <div className="overflow-hidden bg-white shadow-xl rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div className="p-6">
                                <button className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300">
                                    Create Campaign
                                </button>
                            </div>
                        </div>

                        {/* Quick Action 3: Team Collaboration */}
                        <div className="overflow-hidden bg-white shadow-xl rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div className="p-6">
                                <button className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300">
                                    Team Collaboration
                                </button>
                            </div>
                        </div>

                        {/* Quick Action 4: Settings */}
                        <div className="overflow-hidden bg-white shadow-xl rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
                            <div className="p-6">
                                <button className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300">
                                    Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Main Dashboard Grid */}      
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Card 1: Manage Orders */}
                        <div className="overflow-hidden bg-white shadow-lg sm:rounded-lg transform transition-all hover:scale-105 hover:shadow-xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Manage Orders</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    View, update, and process service orders efficiently.
                                </p>
                                <Link
                                    href="/orders"
                                    className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                                >
                                    Go to Orders
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Customer Management */}
                        <div className="overflow-hidden bg-white shadow-lg sm:rounded-lg transform transition-all hover:scale-105 hover:shadow-xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Customer Management</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Access customer profiles and service history.
                                </p>
                                <Link
                                    href="/customers"
                                    className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                                >
                                    Manage Customers
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Service Reports */}
                        <div className="overflow-hidden bg-white shadow-lg sm:rounded-lg transform transition-all hover:scale-105 hover:shadow-xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Service Reports</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Generate and review performance reports.
                                </p>
                                <Link
                                    href="/reports"
                                    className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
                                >
                                    View Reports
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Graph Section */}
                    <div className="mt-8 bg-white p-6 shadow-lg sm:rounded-lg transform transition-all hover:scale-105 hover:shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-800">Service Performance Overview</h3>
                        <div className="mt-4">
                            <div className="bg-gray-100 h-48 w-full flex justify-center items-center rounded-lg">
                                <span className="text-gray-500">Graph Placeholder</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Actions */}
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Action 1: New Service Request */}
                        <div className="overflow-hidden bg-white shadow-lg sm:rounded-lg transform transition-all hover:scale-105 hover:shadow-xl">
                            <div className="p-6">
                                <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300">
                                    Create New Service Request
                                </button>
                            </div>
                        </div>

                        {/* Action 2: Assign Technicians */}
                        <div className="overflow-hidden bg-white shadow-lg sm:rounded-lg transform transition-all hover:scale-105 hover:shadow-xl">
                            <div className="p-6">
                                <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300">
                                    Assign Technicians
                                </button>
                            </div>
                        </div>

                        {/* Action 3: System Settings */}
                        <div className="overflow-hidden bg-white shadow-lg sm:rounded-lg transform transition-all hover:scale-105 hover:shadow-xl">
                            <div className="p-6">
                                <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300">
                                    System Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
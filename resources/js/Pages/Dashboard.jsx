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
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-700">Manage Orders</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    View, update, and process service orders efficiently.
                                </p>
                                <Link
                                    href="/orders"
                                    className="px-4 mt-4 inline-block w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Go to Orders
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Customer Management */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-700">Customer Management</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Access customer profiles and service history.
                                </p>
                                <Link
                                    href="/customers"
                                    className="px-4 mt-4 inline-block w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    Manage Customers
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Service Reports */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-700">Service Reports</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Generate and review performance reports.
                                </p>
                                <Link
                                    href="/reports"
                                    className="px-4 mt-4 inline-block w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    View Reports
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Graph Section */}
                    <div className="mt-8 bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-700">Service Performance Overview</h3>
                        <div className="mt-4">
                            <div className="bg-gray-200 h-48 w-full flex justify-center items-center">
                                <span className="text-gray-500">Graph Placeholder</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Actions */}
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Action 1: New Service Request */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    Create New Service Request
                                </button>
                            </div>
                        </div>

                        {/* Action 2: Assign Technicians */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <button className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                                    Assign Technicians
                                </button>
                            </div>
                        </div>

                        {/* Action 3: System Settings */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <button className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
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

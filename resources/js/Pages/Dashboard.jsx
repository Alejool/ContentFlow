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
                        {/* Card 1: Edit Photos */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-700">Edit Photos</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Enhance and edit your photos with advanced tools.
                                </p>
                                <Link
                                    href="/edit-photos"
                                    className="mt-4 inline-block w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Go to Photo Editor
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Featured Collections */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-700">Featured Collections</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Explore our curated collections of high-quality images.
                                </p>
                                <Link
                                    href="/featured-collections"
                                    className="mt-4 inline-block w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                >
                                    View Featured Collections
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Manage Collections */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-700">Manage Collections</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Organize and manage your personal photo collections.
                                </p>
                                <Link
                                    href="/manage-collections"
                                    className="mt-4 inline-block w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Manage Your Collections
                                </Link>
                            </div>
                        </div>

                        {/* Card 4: Video Creating */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-700">Video Creating</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Create stunning videos with professional-grade tools.
                                </p>
                                <Link
                                    href="/videos"
                                    className="mt-4 inline-block w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    Start Creating Videos
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Graph Section */}
                    <div className="mt-8 bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-700">Monthly Usage Overview</h3>
                        <div className="mt-4">
                            {/* Placeholder for a graph */}
                            <div className="bg-gray-200 h-48 w-full flex justify-center items-center">
                                <span className="text-gray-500">Graph Placeholder</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions or Additional Options */}
                    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Action 1: Upload Media */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    Upload New Media
                                </button>
                            </div>
                        </div>

                        {/* Action 2: View Reports */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <button className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                                    View Activity Reports
                                </button>
                            </div>
                        </div>

                        {/* Action 3: Settings */}
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <button className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                                    Platform Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
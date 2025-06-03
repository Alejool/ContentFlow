import React from 'react'; // Imported React
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.tsx';
import { Head } from '@inertiajs/react';

// Interface for individual analytics metric objects
interface AnalyticsMetric {
    id: number;
    metric: string;
    value: string;
    change: string;
}

// Props for the Index page component (usually passed by Inertia)
interface AnalyticsIndexPageProps {
    // Define any props passed from the controller, if any
}

export default function Index(props: AnalyticsIndexPageProps) { // Added props typing
    // Mock data for analytics - typed with AnalyticsMetric[]
    const analyticsData: AnalyticsMetric[] = [
        {
            id: 1,      
            metric: 'Engagement Rate',
            value: '8.5%',
            change: '+2.3%',
        },
        {
            id: 2,
            metric: 'Impressions',
            value: '1.2M',      
            change: '+15%',  
        },
        {     
            id: 3,
            metric: 'Clicks',
            value: '45K',
            change: '+10%',
        },
        {
            id: 4,
            metric: 'Shares',
            value: '12K',
            change: '+5%',
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Analytics" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Track engagement and performance metrics.
                        </p>
                    </div>

                    {/* Metrics Section */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Performance Overview</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {analyticsData.map((data) => ( // data is now typed as AnalyticsMetric
                                <div
                                    key={data.id}                         
                                    className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">{data.metric}</p>
                                            <p className="text-2xl font-bold text-gray-800">{data.value}</p>
                                        </div>
                                        <span className="text-sm text-green-600">{data.change}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Graph Placeholder */}
                    <div className="mt-8 bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Engagement Over Time</h2>
                        <div className="bg-gray-100 h-64 flex items-center justify-center rounded-lg">
                            <span className="text-gray-500">Graph Placeholder</span>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
export default function ContentMetrics() {
    const contentMetrics = [
        { id: 1, title: 'Engagement Rate', value: '8.5%', change: '+2.3%', icon: '📈' },
        { id: 2, title: 'Impressions', value: '1.2M', change: '+15%', icon: '👀' },
        { id: 3, title: 'Clicks', value: '45K', change: '+10%', icon: '🖱️' },
        { id: 4, title: 'Shares', value: '12K', change: '+5%', icon: '🔗' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {contentMetrics.map((metric) => (
                <div
                    key={metric.id}
                    className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{metric.title}</p>
                            <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
                        </div>
                        <span className="text-2xl">{metric.icon}</span>
                    </div>
                    <p className="mt-2 text-sm text-green-600">{metric.change}</p>
                </div>
            ))}
        </div>
    );
}
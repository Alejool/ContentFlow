import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    format?: 'number' | 'currency' | 'percentage';
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    change,
    icon,
    color = 'blue',
    format = 'number',
}) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-red-600',
    };

    const formatValue = (val: string | number) => {
        if (format === 'currency') {
            return `$${Number(val).toLocaleString()}`;
        }
        if (format === 'percentage') {
            return `${val}%`;
        }
        return Number(val).toLocaleString();
    };

    const getTrendIcon = () => {
        if (change === undefined || change === null) return null;
        if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const getTrendColor = () => {
        if (change === undefined || change === null) return 'text-gray-600';
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className={`bg-gradient-to-r ${colorClasses[color]} p-4`}>
                <div className="flex items-center justify-between text-white">
                    <h3 className="text-sm font-medium opacity-90">{title}</h3>
                    {icon && <div className="opacity-80">{icon}</div>}
                </div>
            </div>
            <div className="p-6">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatValue(value)}
                        </p>
                        {change !== undefined && change !== null && (
                            <div className="flex items-center mt-2 space-x-1">
                                {getTrendIcon()}
                                <span className={`text-sm font-medium ${getTrendColor()}`}>
                                    {Math.abs(change)}%
                                </span>
                                <span className="text-xs text-gray-500">vs last period</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;

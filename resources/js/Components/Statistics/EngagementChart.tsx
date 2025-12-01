import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface EngagementChartProps {
    data: any[];
    height?: number;
}

const EngagementChart: React.FC<EngagementChartProps> = ({
    data,
    height = 350,
}) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                <defs>
                    <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSaves" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="date"
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                <Area
                    type="monotone"
                    dataKey="likes"
                    name="Likes"
                    stackId="1"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorLikes)"
                />
                <Area
                    type="monotone"
                    dataKey="comments"
                    name="Comments"
                    stackId="1"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorComments)"
                />
                <Area
                    type="monotone"
                    dataKey="shares"
                    name="Shares"
                    stackId="1"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorShares)"
                />
                <Area
                    type="monotone"
                    dataKey="saves"
                    name="Saves"
                    stackId="1"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorSaves)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default EngagementChart;

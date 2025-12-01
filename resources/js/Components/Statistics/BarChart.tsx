import React from 'react';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
    data: any[];
    bars: {
        dataKey: string;
        name: string;
        color: string;
    }[];
    xAxisKey: string;
    height?: number;
    layout?: 'horizontal' | 'vertical';
}

const BarChart: React.FC<BarChartProps> = ({
    data,
    bars,
    xAxisKey,
    height = 300,
    layout = 'horizontal',
}) => {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
                data={data}
                layout={layout}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey={xAxisKey}
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                    type={layout === 'vertical' ? 'number' : 'category'}
                />
                <YAxis
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                    type={layout === 'vertical' ? 'category' : 'number'}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                {bars.map((bar) => (
                    <Bar
                        key={bar.dataKey}
                        dataKey={bar.dataKey}
                        name={bar.name}
                        fill={bar.color}
                        radius={[8, 8, 0, 0]}
                    />
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
};

export default BarChart;

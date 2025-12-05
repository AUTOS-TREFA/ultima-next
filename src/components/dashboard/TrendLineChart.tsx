import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface TrendLineChartProps {
    data: {
        label: string;
        leads: number;
        applications: number;
    }[];
    height?: number;
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({ data, height = 300 }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No hay datos disponibles para este período</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height, minHeight: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                />
                <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                />
                <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                />
                <Line
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                    animationDuration={1000}
                />
                <Line
                    type="monotone"
                    dataKey="applications"
                    name="Solicitudes"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                    animationDuration={1000}
                />
            </LineChart>
          </ResponsiveContainer>
        </div>
    );
};

export default TrendLineChart;

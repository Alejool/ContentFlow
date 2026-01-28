import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LineChartProps {
  data: any[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  height?: number;
  theme?: "light" | "dark";
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey,
  height = 300,
  theme = "light",
}) => {
  const isDark = theme === "dark";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? "#374151" : "#f0f0f0"}
        />
        <XAxis
          dataKey={xAxisKey}
          stroke={isDark ? "#9ca3af" : "#888"}
          style={{ fontSize: "12px" }}
        />
        <YAxis
          stroke={isDark ? "#9ca3af" : "#888"}
          style={{ fontSize: "12px" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1f2937" : "white",
            border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            color: isDark ? "#f3f4f6" : "#111827",
          }}
        />
        <Legend
          wrapperStyle={{
            fontSize: "14px",
            color: isDark ? "#f3f4f6" : "#111827",
          }}
          iconType="line"
        />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;

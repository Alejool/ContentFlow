import React from "react";
import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarChartProps {
  data: any[];
  bars: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  height?: number;
  layout?: "horizontal" | "vertical";
  theme?: "light" | "dark";
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisKey,
  height = 300,
  layout = "horizontal",
  theme = "light",
}) => {
  const isDark = theme === "dark";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
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
          type={layout === "vertical" ? "number" : "category"}
        />
        <YAxis
          stroke={isDark ? "#9ca3af" : "#888"}
          style={{ fontSize: "12px" }}
          type={layout === "vertical" ? "category" : "number"}
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
        />
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

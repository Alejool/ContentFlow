import React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface PieChartProps {
  data: {
    name: string;
    value: number;
  }[];
  colors?: string[];
  height?: number;
  innerRadius?: number;
  theme?: "light" | "dark";
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // orange
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
];

const PieChart: React.FC<PieChartProps> = ({
  data,
  colors = COLORS,
  height = 300,
  innerRadius = 0,
  theme = "light",
}) => {
  const isDark = theme === "dark";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(props) => {
            const { name, percent, x, y, cx } = props;
            return (
              <text
                x={x}
                y={y}
                fill={isDark ? "#f3f4f6" : "#111827"}
                fontSize="12px"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
              >
                {`${name}: ${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
          outerRadius={100}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
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
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChart;

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface EngagementChartProps {
  data: any[];
  height?: number;
  theme?: "light" | "dark";
}

const EngagementChart: React.FC<EngagementChartProps> = ({
  data,
  height = 350,
  theme = "light",
}) => {
  const { t } = useTranslation();

  const colors = {
    likes: "#3b82f6", // Blue
    comments: "#10b981", // Emerald
    shares: "#f59e0b", // Amber
    saves: "#8b5cf6", // Violet
    grid: theme === "dark" ? "#374151" : "#f0f0f0",
    text: theme === "dark" ? "#9ca3af" : "#6b7280",
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.likes} stopOpacity={0.8} />
            <stop offset="95%" stopColor={colors.likes} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.comments} stopOpacity={0.8} />
            <stop offset="95%" stopColor={colors.comments} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.shares} stopOpacity={0.8} />
            <stop offset="95%" stopColor={colors.shares} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSaves" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.saves} stopOpacity={0.8} />
            <stop offset="95%" stopColor={colors.saves} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis
          dataKey="date"
          stroke={colors.text}
          style={{ fontSize: "12px" }}
          tick={{ fill: colors.text }}
        />
        <YAxis
          stroke={colors.text}
          style={{ fontSize: "12px" }}
          tick={{ fill: colors.text }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1f2937" : "white",
            border:
              theme === "dark" ? "1px solid #374151" : "1px solid #e5e7eb",
            borderRadius: "8px",
            color: theme === "dark" ? "#f3f4f6" : "#111827",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          itemStyle={{ color: theme === "dark" ? "#f3f4f6" : "#111827" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }}
          formatter={(value) => (
            <span style={{ color: colors.text }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="likes"
          name={t("analytics.trends.likes") || "Likes"}
          stackId="1"
          stroke={colors.likes}
          fillOpacity={1}
          fill="url(#colorLikes)"
        />
        <Area
          type="monotone"
          dataKey="comments"
          name={t("analytics.trends.comments") || "Comments"}
          stackId="1"
          stroke={colors.comments}
          fillOpacity={1}
          fill="url(#colorComments)"
        />
        <Area
          type="monotone"
          dataKey="shares"
          name={t("analytics.trends.shares") || "Shares"}
          stackId="1"
          stroke={colors.shares}
          fillOpacity={1}
          fill="url(#colorShares)"
        />
        <Area
          type="monotone"
          dataKey="saves"
          name={t("analytics.trends.saves") || "Saves"}
          stackId="1"
          stroke={colors.saves}
          fillOpacity={1}
          fill="url(#colorSaves)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default EngagementChart;

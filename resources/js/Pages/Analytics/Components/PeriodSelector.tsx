import React from "react";
import { useTranslation } from "react-i18next";

interface PeriodSelectorProps {
  selectedPeriod: number;
  onPeriodChange: (days: number) => void;
  theme?: "light" | "dark";
}

export default function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  theme = "light",
}: PeriodSelectorProps) {
  const { t } = useTranslation();
  const periods = [7, 30, 90];

  return (
    <div className="mb-6 flex gap-2">
      {periods.map((days) => (
        <button
          key={days}
          onClick={() => onPeriodChange(days)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300
                        ${
                          selectedPeriod === days
                            ? theme === "dark"
                              ? "bg-gradient-to-r from-orange-600 to-orange-800 text-white shadow-lg"
                              : "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg"
                            : theme === "dark"
                            ? "bg-neutral-800 text-gray-300 hover:bg-neutral-700 hover:text-gray-100 border border-neutral-700"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                        }`}
        >
          {days} {t("analytics.days")}
        </button>
      ))}
    </div>
  );
}

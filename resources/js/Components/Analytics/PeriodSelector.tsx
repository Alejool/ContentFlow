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
    <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg w-fit mb-6">
      {periods.map((days) => (
        <button
          key={days}
          onClick={() => onPeriodChange(days)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedPeriod === days
              ? "bg-white dark:bg-neutral-700 shadow-sm text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          {days} {t("analytics.days")}
        </button>
      ))}
    </div>
  );
}
